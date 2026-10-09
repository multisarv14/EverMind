import { createDecipheriv, createHash } from "node:crypto";

// Decrypts secrets stored in the database (the AI provider key) with AI_KEY_SECRET from the environment.
// scripts/set-ai-key.mjs does the encrypting with the same scheme; keep the two in step.

export interface SealedSecret {
  iv: string;
  tag: string;
  data: string;
}

function masterKey() {
  const secret = process.env.AI_KEY_SECRET;
  if (!secret || secret.length < 32) throw new Error("AI_KEY_SECRET is missing or shorter than 32 characters.");
  return createHash("sha256").update(secret).digest();
}

export function open(sealed: SealedSecret): string {
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(sealed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(sealed.data, "base64")), decipher.final()]).toString("utf8");
}
