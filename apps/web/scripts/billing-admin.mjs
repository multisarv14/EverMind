#!/usr/bin/env node
// Billing chores for the EverMind team. Uses the Firestore project in .env.local (see scripts/firestore.mjs).
//
//   node --env-file=.env.local scripts/billing-admin.mjs report [YYYY-MM]                        revenue vs AI cost per company for a month
//   node --env-file=.env.local scripts/billing-admin.mjs grant <owner-email> <credits> [note]    give free credits (valid 12 months)
//   node --env-file=.env.local scripts/billing-admin.mjs set-plan <owner-email> <free|pro|business>   change a plan by hand (no payment)
import { connect } from "./firestore.mjs";

const USD_TO_INR = Number(process.env.USD_TO_INR ?? 88);
const [cmd, ...args] = process.argv.slice(2);
async function companyByOwner(db, email) {
  const found = await db.collection("users").where("email", "==", String(email ?? "").toLowerCase()).limit(1).get();
  const user = found.docs[0]?.data();
  if (!user?.companyId) throw new Error(`No user with email ${email}`);
  const company = await db.collection("companies").doc(user.companyId).get();
  return { _id: company.id, ...company.data() };
}

/** Sums the given fields per company over the documents a query returns (and `keep` accepts). */
async function totalsByCompany(query, fields, keep = () => true) {
  const totals = new Map();
  for (const doc of (await query.get()).docs) {
    const d = doc.data();
    if (!keep(d)) continue;
    const row = totals.get(d.companyId) ?? { _id: d.companyId, calls: 0, ...Object.fromEntries(fields.map((f) => [f, 0])) };
    for (const f of fields) row[f] += d[f] ?? 0;
    row.calls++;
    totals.set(d.companyId, row);
  }
  return [...totals.values()];
}

async function report(db, month) {
  const from = new Date(`${month}-01T00:00:00Z`);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);

  const cost = await totalsByCompany(
    db.collection("usageEvents").where("createdAt", ">=", from).where("createdAt", "<", to),
    ["costMicros", "credits"]
  );
  const paid = await totalsByCompany(
    db.collection("payments").where("createdAt", ">=", from).where("createdAt", "<", to),
    ["amount"],
    (p) => p.status === "captured"
  );

  const companies = (await db.collection("companies").select("name", "plan").get()).docs.map((d) => ({ _id: d.id, ...d.data() }));
  const byId = new Map(companies.map((c) => [c._id, c]));
  const ids = [...new Set([...cost, ...paid].map((r) => r._id))];

  const rows = ids.map((id) => {
    const c = cost.find((r) => r._id === id);
    const p = paid.find((r) => r._id === id);
    const aiInr = ((c?.costMicros ?? 0) / 1e6) * USD_TO_INR;
    // Payments include 18% GST, which is not revenue.
    const revenueInr = (p?.amount ?? 0) / 100 / 1.18;
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
  const db = connect();

  if (cmd === "report") {
    await report(db, args[0] ?? new Date().toISOString().slice(0, 7));
  } else if (cmd === "grant") {
    const [email, amount, ...note] = args;
    const credits = Math.round(Number(amount));
    if (!(credits > 0)) throw new Error("Give a positive number of credits.");
    const company = await companyByOwner(db, email);
    const now = new Date();
    await db.collection("creditGrants").add({
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
    await db.collection("companies").doc(company._id).update({ plan });
    const warn = company.billing?.status === "active" ? " It also has an active Razorpay subscription; the next payment webhook may change this back." : "";
    console.log(`${company.name} is now on ${plan}.${warn}`);
  } else {
    console.log("Usage: report [YYYY-MM] | grant <owner-email> <credits> [note] | set-plan <owner-email> <free|pro|business>");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
