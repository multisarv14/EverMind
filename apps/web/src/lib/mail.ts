import nodemailer from "nodemailer";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const mailConfigured = () => Boolean(process.env.SMTP_URL);

/** The public address of the app, for links inside emails. */
export const appUrl = (request: Request) => process.env.APP_URL ?? new URL(request.url).origin;

/** The public address for emails sent outside a request (background jobs, webhooks). */
export const publicUrl = () => process.env.APP_URL ?? "http://localhost:3000";

/**
 * Sends an email through the SMTP server in SMTP_URL (e.g. smtp://user:pass@smtp.example.com:587).
 * Never throws: a mail problem must not break sign-up, invites or password reset.
 *
 * Without SMTP_URL nothing is sent. In development the message is printed to the server
 * console so the link can be copied; MAIL_OUTBOX_DIR (used by tests) writes it to a file.
 */
export async function sendMail(mail: Mail): Promise<{ sent: boolean }> {
  try {
    if (process.env.MAIL_OUTBOX_DIR) {
      mkdirSync(process.env.MAIL_OUTBOX_DIR, { recursive: true });
      writeFileSync(join(process.env.MAIL_OUTBOX_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`), JSON.stringify(mail, null, 2));
      return { sent: true };
    }

    if (!mailConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n--- email not sent (SMTP_URL is not set) ---\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n---`);
      }
      return { sent: false };
    }

    const transport = nodemailer.createTransport(process.env.SMTP_URL!);
    await transport.sendMail({ from: process.env.MAIL_FROM ?? "EverMind <no-reply@localhost>", ...mail });
    return { sent: true };
  } catch (error) {
    console.error("mail error:", error instanceof Error ? error.message : error);
    return { sent: false };
  }
}
