import { publicUrl, type Mail } from "@/lib/mail";
import type { Plan } from "@/lib/plans";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(heading: string, paragraphs: string[], button: { label: string; href: string }, footer: string) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155">${esc(p)}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f5fb;font-family:system-ui,-apple-system,Segoe UI,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
      <tr><td>
        <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#4c1d95">EverMind</p>
        <h1 style="margin:0 0 14px;font-size:22px;color:#0f172a">${esc(heading)}</h1>
        ${body}
        <p style="margin:22px 0"><a href="${esc(button.href)}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:15px">${esc(button.label)}</a></p>
        <p style="margin:0 0 6px;font-size:12px;color:#64748b">Or paste this link into your browser:<br><span style="word-break:break-all">${esc(button.href)}</span></p>
        <p style="margin:18px 0 0;font-size:12px;color:#94a3b8">${esc(footer)}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export function resetEmail(to: string, name: string, link: string): Mail {
  return {
    to,
    subject: "Reset your EverMind password",
    text: `Hi ${name},\n\nUse this link to choose a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email; your password won't change.`,
    html: layout(
      "Reset your password",
      [`Hi ${name},`, "Click the button to choose a new password. The link works for 1 hour."],
      { label: "Choose a new password", href: link },
      "If you didn't ask for this, you can ignore this email. Your password won't change."
    ),
  };
}

export function inviteEmail(to: string, inviter: string, company: string, role: string, link: string): Mail {
  return {
    to,
    subject: `${inviter} invited you to ${company} on EverMind`,
    text: `${inviter} invited you to join ${company} on EverMind as ${role}.\n\nCreate your account with this email address to join:\n${link}`,
    html: layout(
      `Join ${company} on EverMind`,
      [`${inviter} invited you to join ${company} on EverMind as ${role}.`, "Create your account with this email address and you'll join the team right away."],
      { label: "Accept the invitation", href: link },
      "If you weren't expecting this invitation, you can ignore this email."
    ),
  };
}

const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function usageEmail(to: string, name: string, company: string, plan: Plan, level: "high" | "full", packCredits: number, resets: Date): Mail {
  const link = `${publicUrl()}/settings?tab=plan`;
  const heading =
    level === "high" ? `${company} has used 80% of this month's AI credits` : `${company} has used this month's AI credits`;
  const detail =
    level === "high"
      ? `You're on the ${plan.name} plan with ${plan.monthlyCredits.toLocaleString()} credits a month. They reset on ${day(resets)}.`
      : packCredits > 0
        ? `EverMind keeps working using your ${packCredits.toLocaleString()} pack credits. The monthly allowance resets on ${day(resets)}.`
        : `AI features are paused until ${day(resets)}. ${plan.topUps ? "Buy a credit pack or upgrade" : "Upgrade"} to keep going now.`;
  return {
    to,
    subject: heading,
    text: `Hi ${name},\n\n${heading}.\n${detail}\n\nPlans and credits: ${link}`,
    html: layout(heading, [`Hi ${name},`, detail], { label: plan.topUps ? "Buy credits or upgrade" : "See plans", href: link }, "You get this email at most twice a month."),
  };
}

export function paymentFailedEmail(to: string, name: string, company: string, plan: Plan, graceUntil: Date): Mail {
  const link = `${publicUrl()}/settings?tab=plan`;
  const detail = `We couldn't collect the renewal payment for ${company}'s ${plan.name} plan. Your plan keeps working until ${day(graceUntil)}; after that the company moves to the Free plan. No data is deleted.`;
  return {
    to,
    subject: `Payment failed for ${company} on EverMind`,
    text: `Hi ${name},\n\n${detail}\n\nUpdate your payment method: ${link}`,
    html: layout("Your payment didn't go through", [`Hi ${name},`, detail], { label: "Update payment", href: link }, "If you already fixed this, you can ignore this email."),
  };
}

export function receiptEmail(to: string, name: string, company: string, what: string, amountPaise: number, currency: string): Mail {
  const link = `${publicUrl()}/settings?tab=plan`;
  const amount = `${currency === "INR" ? "₹" : `${currency} `}${(amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const detail = `We received ${amount} (GST included) from ${company} for ${what}. Thank you!`;
  return {
    to,
    subject: `Payment received: ${what}`,
    text: `Hi ${name},\n\n${detail}\n\nBilling: ${link}`,
    html: layout("Payment received", [`Hi ${name},`, detail], { label: "View billing", href: link }, "Keep this email for your records."),
  };
}
