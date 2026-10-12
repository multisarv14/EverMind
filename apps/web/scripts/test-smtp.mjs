// Test script to diagnose and verify SMTP setup.
// Usage:
//   node --env-file=.env.local scripts/test-smtp.mjs [recipient-email]
// Example:
//   node --env-file=.env.local scripts/test-smtp.mjs you@example.com

import nodemailer from "nodemailer";

console.log("=== EverMind SMTP Setup Diagnostic ===\n");

const smtpUrl = process.env.SMTP_URL?.trim();
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = process.env.SMTP_PORT?.trim();
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const smtpSecure = process.env.SMTP_SECURE?.trim();
const mailFrom = process.env.MAIL_FROM?.trim() || "EverMind <no-reply@localhost>";

console.log("Configuration status:");
console.log(`- SMTP_URL:     ${smtpUrl ? maskUrl(smtpUrl) : "(not set)"}`);
console.log(`- SMTP_HOST:    ${smtpHost || "(not set)"}`);
console.log(`- SMTP_PORT:    ${smtpPort || "(not set)"}`);
console.log(`- SMTP_USER:    ${smtpUser || "(not set)"}`);
console.log(`- SMTP_PASS:    ${smtpPass ? "******" : "(not set)"}`);
console.log(`- MAIL_FROM:    ${mailFrom}`);
console.log("");

if (!smtpUrl && !smtpHost) {
  console.error("❌ No SMTP configuration found in environment variables.");
  console.log("\nTo configure SMTP, add one of the following to your apps/web/.env.local (or environment):");
  console.log("\nOption A: Using SMTP_URL (connection string)");
  console.log("  # For Gmail (use a 16-character Google App Password, not your account password):");
  console.log("  SMTP_URL=smtps://your-name@gmail.com:your-app-password@smtp.gmail.com:465");
  console.log("  MAIL_FROM=EverMind <your-name@gmail.com>");
  console.log("");
  console.log("  # For Resend / Brevo / Sendgrid / etc (port 587):");
  console.log("  SMTP_URL=smtp://apikey:your-api-key@smtp.provider.com:587");
  console.log("  MAIL_FROM=EverMind <notifications@yourverifieddomain.com>");
  console.log("");
  console.log("Option B: Using individual variables (recommended if password has special chars #, ?, @):");
  console.log("  SMTP_HOST=smtp.gmail.com");
  console.log("  SMTP_PORT=465");
  console.log("  SMTP_USER=your-name@gmail.com");
  console.log("  SMTP_PASS=your-16-char-app-password");
  console.log("  SMTP_SECURE=true");
  console.log("  MAIL_FROM=EverMind <your-name@gmail.com>");
  process.exit(1);
}

function maskUrl(url) {
  try {
    return url.replace(/(:)([^@]+)(@)/, "$1******$3");
  } catch {
    return "(set)";
  }
}

function getTransport() {
  const commonTimeouts = {
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };

  if (smtpUrl) {
    try {
      return nodemailer.createTransport({
        ...commonTimeouts,
        ...nodemailer.createTransport(smtpUrl).options,
      });
    } catch {
      const match = smtpUrl.match(/^(smtps?):\/\/(?:(.+?):(.*?)@)?([^:/]+)(?::(\d+))?$/);
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
      throw new Error("Invalid SMTP_URL format");
    }
  }

  const port = Number(smtpPort || (smtpSecure === "true" ? 465 : 587));
  const secure = smtpSecure === "true" || port === 465;
  return nodemailer.createTransport({
    ...commonTimeouts,
    host: smtpHost,
    port,
    secure,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass || "" } : undefined,
  });
}

const transport = getTransport();
console.log("Connecting to SMTP server and verifying credentials...");

try {
  await transport.verify();
  console.log("✅ SMTP connection & authentication successful!\n");

  const recipient = process.argv[2]?.trim();
  if (recipient) {
    console.log(`Sending test email to ${recipient}...`);
    const info = await transport.sendMail({
      from: mailFrom,
      to: recipient,
      subject: "EverMind SMTP Test",
      text: "This is a test email from EverMind to verify your SMTP configuration.",
      html: "<p>This is a test email from <strong>EverMind</strong> to verify your SMTP configuration.</p>",
    });
    console.log(`✅ Test email delivered! Message ID: ${info.messageId}`);
  } else {
    console.log("💡 Tip: You can send a test email by passing a recipient address:");
    console.log("   node --env-file=.env.local scripts/test-smtp.mjs your-email@example.com");
  }
} catch (err) {
  console.error("❌ SMTP Verification Failed!");
  console.error(`- Error:    ${err.message}`);
  if (err.code) console.error(`- Code:     ${err.code}`);
  if (err.command) console.error(`- Command:  ${err.command}`);
  if (err.response) console.error(`- Response: ${err.response}`);

  console.log("\n--- Troubleshooting Tips ---");
  if (err.code === "EAUTH" || err.response?.includes("535")) {
    console.log("• Authentication failed. Check username and password.");
    console.log("• If using Gmail, make sure 2-Step Verification is ON and you generated an 'App Password' (not normal account password).");
    console.log("• App passwords should have no extra spaces or URL-encoded correctly.");
  } else if (err.code === "ESOCKET" || err.code === "ETIMEDOUT" || err.code === "ECONNECTION") {
    console.log("• Connection timed out or refused.");
    console.log("• Many residential/cloud networks block outbound port 25 or 587. Try port 465 with smtps://");
    console.log("• Ensure host and port are correct.");
  } else if (err.response?.includes("550") || err.response?.includes("553")) {
    console.log("• Sender rejected. Ensure MAIL_FROM matches your verified domain or email address in your mail provider.");
  }
  process.exit(1);
}
