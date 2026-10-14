#!/usr/bin/env node
// Manages EverMind team accounts that can open the admin panel (/admin). Uses the Firestore project in .env.local.
// An admin is an ordinary user (with its own workspace, like an owner) whose record has platformAdmin: true.
//
//   npm run admin -- create <email> <name...>   new admin login; prints a one-time password to change after signing in
//   npm run admin -- promote <email>            make an existing user an admin
//   npm run admin -- revoke <email>             take admin access away (the account itself stays)
//   npm run admin -- list                       show every admin
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { connect } from "./firestore.mjs";

const [cmd, ...args] = process.argv.slice(2);
const emailKey = (email) => encodeURIComponent(email.toLowerCase());
const normal = (email) => String(email ?? "").trim().toLowerCase();

async function userByEmail(db, email) {
  const found = await db.collection("users").where("email", "==", email).limit(1).get();
  if (found.empty) throw new Error(`No user with email ${email}.`);
  return found.docs[0];
}

async function create(db, email, name) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Give a valid email.");
  if (name.length < 2) throw new Error("Give the person's name.");

  // A random password, shown once; it is stored only as a bcrypt hash, like every other password.
  const password = randomBytes(12).toString("base64url");
  const now = new Date();
  const user = db.collection("users").doc();
  const company = db.collection("companies").doc();

  // Same records as a sign-up: the email reservation fails if the email is taken, and then nothing is written.
  const batch = db.batch();
  batch.create(db.collection("emails").doc(emailKey(email)), { userId: user.id });
  batch.create(company, { name: "EverMind Admin", teamSize: "2–10", plan: "free", lastLearningAt: null, createdAt: now });
  batch.create(user, {
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    companyId: company.id,
    role: "owner",
    platformAdmin: true,
    createdAt: now,
  });
  try {
    await batch.commit();
  } catch (e) {
    if (e.code === 6) throw new Error(`An account with ${email} already exists. Use: promote ${email}`);
    throw e;
  }

  console.log(`Created admin ${name} <${email}>.`);
  console.log(`One-time password: ${password}`);
  console.log("Sign in, then change it under Settings. This password is not shown again.");
}

async function setAdmin(db, email, on) {
  const doc = await userByEmail(db, email);
  await doc.ref.update({ platformAdmin: on });
  console.log(on ? `${email} is now an admin.` : `${email} is no longer an admin.`);
}

async function list(db) {
  const snap = await db.collection("users").where("platformAdmin", "==", true).get();
  if (snap.empty) return console.log("No admins yet. Add one with: create <email> <name>");
  console.table(snap.docs.map((d) => ({ name: d.data().name, email: d.data().email, createdAt: d.data().createdAt?.toDate?.().toISOString().slice(0, 10) })));
}

async function main() {
  const db = connect();
  const email = normal(args[0]);

  if (cmd === "create") await create(db, email, args.slice(1).join(" ").trim());
  else if (cmd === "promote") await setAdmin(db, email, true);
  else if (cmd === "revoke") await setAdmin(db, email, false);
  else if (cmd === "list") await list(db);
  else {
    console.log("Usage: create <email> <name> | promote <email> | revoke <email> | list");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
