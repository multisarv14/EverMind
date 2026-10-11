#!/usr/bin/env node
// One-time copy of the EverMind data from MongoDB (MONGODB_URI) into Firestore (FIREBASE_* in .env.local).
// Run from apps/web while the app is stopped or in maintenance, so nothing changes during the copy:
//
//   node --env-file=.env.local scripts/migrate-mongo-to-firestore.mjs --dry-run     count what would be copied
//   node --env-file=.env.local scripts/migrate-mongo-to-firestore.mjs               copy (refuses if Firestore already has users)
//   node --env-file=.env.local scripts/migrate-mongo-to-firestore.mjs --overwrite   copy again over an earlier run
//
// MongoDB is only read, never changed. Every document keeps its id (ObjectIds become their 24-character hex
// string), so sessions, links and payment notes that hold an id keep working. What changes on the way
// (see src/lib/db.ts for the new layout):
//   - conversations: messages move to the "messages" subcollection; companyId, messageCount, lastMessage are added
//   - users: an "emails" document per user reserves the email (Firestore has no unique indexes)
//   - invites, feedback, payments, pack credit grants, upgrade requests: the id is built from their unique fields
//   - companies: lastLearningAt is null when learning never ran
//   - rateLimits are not copied (they only live for minutes)
import { MongoClient, ObjectId } from "mongodb";
import { connect } from "./firestore.mjs";

const dryRun = process.argv.includes("--dry-run");
const overwrite = process.argv.includes("--overwrite");

// Same as key() in src/lib/db.ts; keep the two in step.
const key = (...parts) => parts.map((p) => encodeURIComponent(String(p))).join(":");
const messageId = (index) => String(index).padStart(6, "0");

/** ObjectIds become hex strings; Dates, numbers, strings and the rest stay as they are. */
function convert(value) {
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Date || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(convert);
  if (value._bsontype) return value.toString(); // other BSON types (Long, Decimal128): not expected here
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convert(v)]));
}

const idOf = (doc) => convert(doc._id);
const withoutId = (doc) => {
  const { _id, ...rest } = convert(doc);
  void _id;
  return rest;
};

const mongo = new MongoClient(process.env.MONGODB_URI ?? "mongodb://localhost:27017/evermind");
const counts = {};
const skipped = [];

async function main() {
  if (!process.env.MONGODB_URI) console.log("MONGODB_URI is not set; reading mongodb://localhost:27017/evermind.");
  await mongo.connect();
  const source = mongo.db();
  const target = connect();

  if (!dryRun && !overwrite && !(await target.collection("users").limit(1).get()).empty) {
    throw new Error("Firestore already has users. Run with --overwrite to copy again over them (newer changes made in Firestore would be lost).");
  }

  const writer = target.bulkWriter();
  writer.onWriteError((error) => {
    console.error(`write failed (${error.documentRef.path}): ${error.message}`);
    return error.failedAttempts < 5;
  });
  const put = (collection, id, data) => {
    counts[collection] = (counts[collection] ?? 0) + 1;
    if (!dryRun) void writer.set(target.collection(collection).doc(String(id)), data);
  };
  const putRef = (path, data, label) => {
    counts[label] = (counts[label] ?? 0) + 1;
    if (!dryRun) void writer.set(target.doc(path), data);
  };
  const each = async (name, fn) => {
    for await (const doc of source.collection(name).find()) await fn(doc);
  };

  // Users first: conversations need each user's company.
  const companyOfUser = new Map();
  await each("users", (u) => {
    const user = withoutId(u);
    companyOfUser.set(idOf(u), user.companyId);
    put("users", idOf(u), user);
    put("emails", key(String(user.email).toLowerCase()), { userId: idOf(u) });
  });

  await each("companies", (c) => put("companies", idOf(c), { ...withoutId(c), lastLearningAt: c.lastLearningAt ?? null }));

  await each("conversations", (c) => {
    const convo = withoutId(c);
    const id = idOf(c);
    const companyId = companyOfUser.get(convo.userId);
    if (!companyId) return skipped.push(`conversation ${id}: its user ${convo.userId} no longer exists`);
    const messages = convo.messages ?? [];
    delete convo.messages;
    put("conversations", id, {
      ...convo,
      companyId,
      messageCount: messages.length,
      lastMessage: String(messages.at(-1)?.content ?? "").slice(0, 2000),
    });
    messages.forEach((m, i) => putRef(`conversations/${id}/messages/${messageId(i)}`, m, "conversations/*/messages"));
  });

  await each("invites", (i) => {
    const invite = withoutId(i);
    put("invites", key(invite.companyId, String(invite.email).toLowerCase()), invite);
  });

  for (const name of ["projects", "tasks", "decisions", "knowledge", "reports", "learnings", "usageEvents"]) {
    await each(name, (d) => put(name, idOf(d), withoutId(d)));
  }

  // These already had string ids built from their fields; they stay the same.
  for (const name of ["usage", "dailyUsage", "passwordResets", "settings"]) {
    await each(name, (d) => put(name, idOf(d), withoutId(d)));
  }
  await each("billingEvents", (e) => put("billingEvents", key(idOf(e)), withoutId(e)));

  await each("feedback", (f) => {
    const fb = withoutId(f);
    put("feedback", key(fb.userId, fb.conversationId, fb.messageIndex), fb);
  });

  await each("payments", (p) => {
    const payment = withoutId(p);
    put("payments", key(payment.gatewayPaymentId), payment);
  });

  await each("creditGrants", (g) => {
    const grant = withoutId(g);
    put("creditGrants", grant.paymentId ? key("pack", grant.paymentId) : idOf(g), grant);
  });

  // Newest request per company wins (the app keeps one per company).
  const requests = await source.collection("upgradeRequests").find().sort({ createdAt: 1 }).toArray();
  const latest = new Map(requests.map((r) => [convert(r.companyId), r]));
  for (const [companyId, r] of latest) put("upgradeRequests", companyId, withoutId(r));

  if (!dryRun) await writer.close();

  const known = new Set([
    "users", "companies", "conversations", "invites", "projects", "tasks", "decisions", "knowledge", "reports",
    "learnings", "usageEvents", "usage", "dailyUsage", "passwordResets", "settings", "billingEvents", "feedback",
    "payments", "creditGrants", "upgradeRequests", "rateLimits",
  ]);
  const unknown = (await source.listCollections().toArray()).map((c) => c.name).filter((n) => !known.has(n) && !n.startsWith("system."));

  console.log(dryRun ? "\nDry run: nothing was written. Would copy:" : "\nCopied:");
  console.table(counts);
  if (skipped.length) console.log(`Skipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);
  if (unknown.length) console.log(`Not copied (unknown to this script): ${unknown.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongo.close());
