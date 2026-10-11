// The Firestore connection for the scripts in this folder; same settings as src/lib/db.ts.
// FIREBASE_PROJECT_ID (and, if a key is used, FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) come from .env.local
// (node --env-file=.env.local). Without a key, Google's default credentials are used; FIRESTORE_EMULATOR_HOST uses the emulator.
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function connect() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is missing. Run with: node --env-file=.env.local scripts/<script>.mjs ...");
  // Without a key, Google's default credentials are used (e.g. after `gcloud auth application-default login`).
  const app = initializeApp(
    privateKey && !process.env.FIRESTORE_EMULATOR_HOST
      ? { projectId, credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }) }
      : { projectId }
  );
  const db = process.env.FIRESTORE_DATABASE_ID ? getFirestore(app, process.env.FIRESTORE_DATABASE_ID) : getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}
