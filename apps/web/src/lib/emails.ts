import type { Mail } from "@/lib/mail";

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
