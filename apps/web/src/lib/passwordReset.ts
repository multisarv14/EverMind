import { createHash, randomBytes } from "node:crypto";
import { deleteAll, insert, passwordResets, type UserRecord } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { resetEmail } from "@/lib/emails";

const HOUR_MS = 3600 * 1000;

/**
 * Makes a one-hour, single-use reset link for the user (replacing any earlier one) and emails it.
 * Only the token's hash is stored, so the link can't be read back from the database.
 */
export async function sendPasswordReset(user: UserRecord, baseUrl: string): Promise<{ link: string; emailed: boolean }> {
  const token = randomBytes(32).toString("base64url");
  const col = passwordResets();
  await deleteAll(col.where("userId", "==", user._id));
  await insert(col, { userId: user._id, expiresAt: new Date(Date.now() + HOUR_MS) }, createHash("sha256").update(token).digest("hex"));

  const link = `${baseUrl}/reset?token=${token}`;
  const { sent } = await sendMail(resetEmail(user.email, user.name, link));
  return { link, emailed: sent };
}
