import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { BASE, addMember, mailsTo, newCompany, unique } from "./helpers.mjs";

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "whsec-test";
const MOCK = process.env.MOCK_URL ?? "http://localhost:9999";
// The Firestore emulator that scripts/test-api.sh started (FIRESTORE_EMULATOR_HOST).
const db = getFirestore(initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? "demo-evermind-test" }));

/** Sends a webhook the way Razorpay does: raw JSON body, HMAC-SHA256 signature, event id. */
async function webhook(event, { sign = true, id = `evt_${unique()}` } = {}) {
  const body = JSON.stringify(event);
  const res = await fetch(`${BASE}/api/billing/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-event-id": id,
      ...(sign ? { "x-razorpay-signature": createHmac("sha256", SECRET).update(body).digest("hex") } : {}),
    },
    body,
  });
  return res.status;
}

const lastRazorpayCall = async (path) => (await (await fetch(`${MOCK}/__razorpay`)).json()).filter((c) => c.path.startsWith(path)).at(-1);

const now = () => Math.floor(Date.now() / 1000);
const subEvent = (event, sub, notes, payment) => ({
  event,
  payload: {
    subscription: { entity: { id: sub, status: "active", current_start: now(), current_end: now() + 30 * 86400, notes } },
    ...(payment ? { payment: { entity: payment } } : {}),
  },
});

async function companyIdOf(client) {
  const users = await db.collection("users").where("email", "==", client.email).limit(1).get();
  return users.docs[0].data().companyId;
}

test("subscribe, renew, buy a pack, fail a payment and cancel", async () => {
  const owner = await newCompany("Bill");
  const member = await addMember(owner, "member");

  let me = (await owner.get("/api/auth/me")).data;
  assert.equal(me.plan.id, "free");
  assert.equal(me.billing.online, true);
  assert.equal(me.packs.length, 3);

  // Free plans upgrade instead of buying packs; only the owner pays.
  assert.equal((await owner.post("/api/billing/topup", { pack: "1m" })).data.code, "upgrade_required");
  assert.equal((await member.post("/api/billing/checkout", { plan: "pro" })).status, 403);
  assert.equal((await owner.post("/api/billing/checkout", { plan: "gold" })).status, 400);

  const checkout = await owner.post("/api/billing/checkout", { plan: "pro", interval: "monthly" });
  assert.equal(checkout.status, 201);
  assert.match(checkout.data.url, /^https:\/\/rzp\.test\/sub_/);
  const call = await lastRazorpayCall("/v1/subscriptions");
  assert.equal(call.body.plan_id, "plan_pro_m");
  const notes = call.body.notes;
  const sub = checkout.data.url.split("/").at(-1);

  // Nothing changes until Razorpay confirms, and only signed calls count.
  assert.equal((await owner.get("/api/auth/me")).data.plan.id, "free");
  assert.equal(await webhook(subEvent("subscription.activated", sub, notes), { sign: false }), 400);

  const pay1 = { id: `pay_${unique()}`, amount: 353882, currency: "INR", status: "captured" };
  const charged = subEvent("subscription.charged", sub, notes, pay1);
  assert.equal(await webhook(charged, { id: "evt_same" }), 200);
  assert.equal(await webhook(charged, { id: "evt_same" }), 200, "a repeated delivery is accepted");
  assert.equal(await webhook(charged), 200, "and the same payment under a new event id is not counted twice");

  me = (await owner.get("/api/auth/me")).data;
  assert.equal(me.plan.id, "pro");
  assert.equal(me.billing.status, "active");
  assert.equal(me.billing.interval, "monthly");
  assert.equal(me.usage.limit, 2_000_000);
  assert.equal((await owner.get("/api/billing")).data.payments.length, 1);
  assert.deepEqual((await member.get("/api/billing")).data.payments, [], "members don't see payments");
  assert.ok(mailsTo(owner.email).some((m) => /Payment received/.test(m.subject)));

  // A pack: the link carries GST, credits arrive only with the paid webhook, once.
  const topup = await owner.post("/api/billing/topup", { pack: "1m" });
  assert.equal(topup.status, 201);
  const link = await lastRazorpayCall("/v1/payment_links");
  assert.equal(link.body.amount, 176882, "₹1,499 + 18% GST in paise");
  const pay2 = { id: `pay_${unique()}`, amount: 176882, currency: "INR", status: "captured" };
  const paid = { event: "payment_link.paid", payload: { payment_link: { entity: { id: "plink_1", notes: link.body.notes } }, payment: { entity: pay2 } } };
  assert.equal(await webhook(paid), 200);
  assert.equal(await webhook(paid), 200);
  assert.equal((await owner.get("/api/auth/me")).data.usage.packBalance, 1_000_000);

  // A failed renewal keeps the plan during the grace period and tells the owner.
  assert.equal(await webhook(subEvent("subscription.halted", sub, notes)), 200);
  me = (await owner.get("/api/auth/me")).data;
  assert.equal(me.plan.id, "pro");
  assert.ok(me.billing.graceUntil);
  assert.ok(mailsTo(owner.email).some((m) => /Payment failed/.test(m.subject)));

  // After the grace period the company is treated as Free.
  const companyId = await companyIdOf(owner);
  await db.collection("companies").doc(companyId).update({ "billing.graceUntil": new Date(Date.now() - 1000) });
  assert.equal((await owner.get("/api/auth/me")).data.plan.id, "free");
  assert.equal(await webhook(subEvent("subscription.charged", sub, notes, { ...pay1, id: `pay_${unique()}` })), 200);
  assert.equal((await owner.get("/api/auth/me")).data.plan.id, "pro", "a successful retry restores it");

  // Cancelling keeps the plan to the end of the period; the end moves it to Free.
  assert.equal((await member.post("/api/billing/cancel")).status, 403);
  assert.equal((await owner.post("/api/billing/cancel")).status, 200);
  assert.equal((await owner.get("/api/auth/me")).data.billing.cancelAtPeriodEnd, true);
  assert.equal(await webhook(subEvent("subscription.cancelled", sub, notes)), 200);
  me = (await owner.get("/api/auth/me")).data;
  assert.equal(me.plan.id, "free");
  assert.equal(me.usage.packBalance, 1_000_000, "pack credits stay after cancelling");
});

test("switching plan replaces the old subscription", async () => {
  const owner = await newCompany("Switch");
  const first = (await owner.post("/api/billing/checkout", { plan: "pro" })).data.url.split("/").at(-1);
  const notes1 = (await lastRazorpayCall("/v1/subscriptions")).body.notes;
  await webhook(subEvent("subscription.activated", first, notes1));
  assert.equal((await owner.post("/api/billing/checkout", { plan: "pro", interval: "monthly" })).status, 409);

  const second = (await owner.post("/api/billing/checkout", { plan: "business", interval: "yearly" })).data.url.split("/").at(-1);
  const notes2 = (await lastRazorpayCall("/v1/subscriptions")).body.notes;
  await webhook(subEvent("subscription.activated", second, notes2));
  const cancelled = await lastRazorpayCall(`/v1/subscriptions/${first}/cancel`);
  assert.equal(cancelled.body.cancel_at_cycle_end, 0, "the old one stops right away");

  // The old subscription's end must not undo the new plan.
  await webhook(subEvent("subscription.cancelled", first, notes1));
  const me = (await owner.get("/api/auth/me")).data;
  assert.equal(me.plan.id, "business");
  assert.equal(me.billing.interval, "yearly");
  assert.equal(me.plan.seats, 100);
});

test("the allowance is used first, then pack credits, then AI stops", async () => {
  const owner = await newCompany("Credits");
  const companyId = await companyIdOf(owner);
  const me = (await owner.get("/api/auth/me")).data;
  const month = new Date().toISOString().slice(0, 7);

  // Use up the whole monthly allowance.
  await db.collection("usage").doc(`${companyId}:${month}`).set({ companyId, month, credits: me.usage.limit, tokens: 0 }, { merge: true });
  const blocked = await owner.chat("hello");
  assert.equal(blocked.status, 402);
  assert.equal(blocked.data.code, "limit_reached");
  assert.equal((await owner.post("/api/tasks/generate", { goal: "Launch the product" })).status, 402);
  assert.equal((await owner.post("/api/tasks", { title: "Non-AI work still works" })).status, 201);

  // Pack credits (here: an admin grant) keep AI going and are drawn down.
  await db.collection("creditGrants").add({ companyId, source: "admin", credits: 100, remaining: 100, createdAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000) });
  const ok = await owner.chat("hello again");
  assert.equal(ok.status, 200);
  assert.equal((await owner.get("/api/auth/me")).data.usage.packBalance, 100 - 66);

  // Expired credits don't count.
  const grants = await db.collection("creditGrants").where("companyId", "==", companyId).get();
  await Promise.all(grants.docs.map((g) => g.ref.update({ expiresAt: new Date(Date.now() - 1000) })));
  assert.equal((await owner.chat("and again")).status, 402);
});
