#!/usr/bin/env node
// Billing chores for the EverMind team. Reads MONGODB_URI (default: local "evermind" database).
//
//   node scripts/billing-admin.mjs report [YYYY-MM]                        revenue vs AI cost per company for a month
//   node scripts/billing-admin.mjs grant <owner-email> <credits> [note]    give free credits (valid 12 months)
//   node scripts/billing-admin.mjs set-plan <owner-email> <free|pro|business>   change a plan by hand (no payment)
import { MongoClient } from "mongodb";

const USD_TO_INR = Number(process.env.USD_TO_INR ?? 88);
const [cmd, ...args] = process.argv.slice(2);
const client = new MongoClient(process.env.MONGODB_URI ?? "mongodb://localhost:27017/evermind");

async function companyByOwner(db, email) {
  const user = await db.collection("users").findOne({ email: String(email ?? "").toLowerCase() });
  if (!user?.companyId) throw new Error(`No user with email ${email}`);
  return db.collection("companies").findOne({ _id: user.companyId });
}

async function report(db, month) {
  const from = new Date(`${month}-01T00:00:00Z`);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);

  const cost = await db
    .collection("usageEvents")
    .aggregate([
      { $match: { createdAt: { $gte: from, $lt: to } } },
      { $group: { _id: "$companyId", micros: { $sum: "$costMicros" }, credits: { $sum: "$credits" }, calls: { $sum: 1 } } },
    ])
    .toArray();
  const paid = await db
    .collection("payments")
    .aggregate([
      { $match: { status: "captured", createdAt: { $gte: from, $lt: to } } },
      { $group: { _id: "$companyId", paise: { $sum: "$amount" } } },
    ])
    .toArray();

  const companies = await db.collection("companies").find({}, { projection: { name: 1, plan: 1 } }).toArray();
  const byId = new Map(companies.map((c) => [c._id.toString(), c]));
  const ids = [...new Set([...cost, ...paid].map((r) => r._id.toString()))];

  const rows = ids.map((id) => {
    const c = cost.find((r) => r._id.toString() === id);
    const p = paid.find((r) => r._id.toString() === id);
    const aiInr = ((c?.micros ?? 0) / 1e6) * USD_TO_INR;
    // Payments include 18% GST, which is not revenue.
    const revenueInr = (p?.paise ?? 0) / 100 / 1.18;
    return {
      company: byId.get(id)?.name ?? id,
      plan: byId.get(id)?.plan ?? "?",
      calls: c?.calls ?? 0,
      credits: c?.credits ?? 0,
      aiCostInr: Number(aiInr.toFixed(2)),
      revenueInr: Number(revenueInr.toFixed(2)),
      marginInr: Number((revenueInr - aiInr).toFixed(2)),
    };
  });
  rows.sort((a, b) => b.aiCostInr - a.aiCostInr);

  console.log(`Month ${month} (1 USD = ₹${USD_TO_INR}; revenue excludes GST)`);
  console.table(rows);
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0).toFixed(2);
  console.log(`Total AI cost ₹${sum("aiCostInr")} · revenue ₹${sum("revenueInr")} · margin ₹${sum("marginInr")}`);
  console.log("Compare the AI cost with the Anthropic Console bill for the same month.");
}

async function main() {
  await client.connect();
  const db = client.db();

  if (cmd === "report") {
    await report(db, args[0] ?? new Date().toISOString().slice(0, 7));
  } else if (cmd === "grant") {
    const [email, amount, ...note] = args;
    const credits = Math.round(Number(amount));
    if (!(credits > 0)) throw new Error("Give a positive number of credits.");
    const company = await companyByOwner(db, email);
    const now = new Date();
    await db.collection("creditGrants").insertOne({
      companyId: company._id,
      source: "admin",
      credits,
      remaining: credits,
      ...(note.length ? { note: note.join(" ") } : {}),
      createdAt: now,
      expiresAt: new Date(now.getTime() + 365 * 86_400_000),
    });
    console.log(`Granted ${credits.toLocaleString()} credits to ${company.name}.`);
  } else if (cmd === "set-plan") {
    const [email, plan] = args;
    if (!["free", "pro", "business"].includes(plan)) throw new Error("Plan must be free, pro or business.");
    const company = await companyByOwner(db, email);
    await db.collection("companies").updateOne({ _id: company._id }, { $set: { plan } });
    const warn = company.billing?.status === "active" ? " It also has an active Razorpay subscription; the next payment webhook may change this back." : "";
    console.log(`${company.name} is now on ${plan}.${warn}`);
  } else {
    console.log("Usage: report [YYYY-MM] | grant <owner-email> <credits> [note] | set-plan <owner-email> <free|pro|business>");
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => client.close());
