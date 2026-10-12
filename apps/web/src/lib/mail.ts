import nodemailer from "nodemailer";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}
export const mailConfigured = () => Boolean(process.env.SMTP_URL || process.env.SMTP_HOST);

/** The public address of the app, for links inside emails. */
export const appUrl = (request: Request) => process.env.APP_URL ?? new URL(request.url).origin;

/** The public address for emails sent outside a request (background jobs, webhooks). */
export const publicUrl = () => process.env.APP_URL ?? "http://localhost:3000";

/**
 * Creates a nodemailer Transporter from either SMTP_URL or discrete variables
 * (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE).
 * Safely parses passwords containing special characters (e.g. #, ?, @).
 */
export function getMailTransport(): nodemailer.Transporter | null {
  const commonTimeouts = {
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };

  if (process.env.SMTP_URL) {
    const raw = process.env.SMTP_URL.trim();
    try {
      return nodemailer.createTransport({
        ...commonTimeouts,
        ...(nodemailer.createTransport(raw).options as object),
      });
    } catch {
      // Fallback for special characters in passwords (e.g. #, ?) that fail standard url.parse
      const match = raw.match(/^(smtps?):\/\/(?:(.+?):(.*?)@)?([^:/]+)(?::(\d+))?$/);
      if (match) {
        const [, proto, user, pass, host, portStr] = match;
        const isSmtps = proto === "smtps";
        const port = portStr ? Number(portStr) : isSmtps ? 465 : 587;
        return nodemailer.createTransport({
          ...commonTimeouts,
          host,
          port,
          secure: isSmtps || port === 465,
          auth: user ? { user: decodeURIComponent(user), pass: pass ? decodeURIComponent(pass) : "" } : undefined,
        });
      }
      throw new Error("Unable to parse SMTP_URL. Check the connection string format.");
    }
  }

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || (process.env.SMTP_SECURE === "true" ? 465 : 587));
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    return nodemailer.createTransport({
      ...commonTimeouts,
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS ?? "",
          }
        : undefined,
    });
  }

  return null;
}

/**
 * Sends an email through the SMTP server in SMTP_URL or SMTP_HOST settings.
 * Never throws: a mail problem must not break sign-up, invites or password reset.
 *
 * Without SMTP configured nothing is sent. In development the message is printed to the server
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
        console.log(`\n--- email not sent (SMTP is not configured in SMTP_URL or SMTP_HOST) ---\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n---`);
      } else {
        console.error(`mail error: SMTP is not configured (set SMTP_URL or SMTP_HOST), so "${mail.subject}" was not sent`);
      }
      return { sent: false };
    }

    const transport = getMailTransport();
    if (!transport) {
      console.error(`mail error: Could not initialize SMTP transport for "${mail.subject}"`);
      return { sent: false };
    }

    await transport.sendMail({ from: process.env.MAIL_FROM ?? "EverMind <no-reply@localhost>", ...mail });
    return { sent: true };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const response = (error as { response?: string })?.response;
    const msg = error instanceof Error ? error.message : String(error);
    const details = [msg, code ? `code: ${code}` : "", response ? `response: ${response}` : ""].filter(Boolean).join(" | ");
    console.error("mail error:", details);
    return { sent: false };
  }
}

