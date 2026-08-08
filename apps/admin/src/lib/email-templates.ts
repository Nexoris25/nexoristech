/**
 * The two transactional emails the platform sends.
 *
 * Both are deliberately plain. A password reset that looks like marketing is a password reset people
 * hesitate over, and heavy layout is what trips spam filters and breaks in older clients. Inline styles
 * only, a single column, no images, no external stylesheet — that is the intersection of what every
 * mail client renders the same way.
 *
 * Every message carries a plain-text alternative with the same link. Some clients show only that, and a
 * message with no text part scores worse with filters.
 */

const BRAND = "#543CDA";
const INK = "#0d0a1c";

function shell(heading: string, body: string, action: { label: string; url: string }, footer: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f6f6f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e6e4ee;border-radius:12px;">
<tr><td style="padding:28px 28px 0;">
<div style="font:700 15px/1.2 Arial,Helvetica,sans-serif;color:${INK};letter-spacing:-0.01em;">Nexoris Technologies</div>
</td></tr>
<tr><td style="padding:20px 28px 0;">
<h1 style="margin:0;font:700 20px/1.3 Arial,Helvetica,sans-serif;color:${INK};">${escapeHtml(heading)}</h1>
</td></tr>
<tr><td style="padding:14px 28px 0;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:#3a3550;">
${body}
</td></tr>
<tr><td style="padding:24px 28px 0;">
<a href="${escapeAttr(action.url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font:600 15px/1 Arial,Helvetica,sans-serif;padding:14px 24px;border-radius:8px;">${escapeHtml(action.label)}</a>
</td></tr>
<tr><td style="padding:20px 28px 0;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#6b6880;">
If the button does not work, copy this address into your browser:<br>
<span style="word-break:break-all;color:${BRAND};">${escapeHtml(action.url)}</span>
</td></tr>
<tr><td style="padding:20px 28px 28px;border-top:1px solid #eeedf3;margin-top:20px;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:#6b6880;">
${footer}
</td></tr>
</table>
<div style="font:400 12px/1.5 Arial,Helvetica,sans-serif;color:#9a97ab;padding-top:16px;">Nexoris Technologies Limited &middot; Lagos, Nigeria</div>
</td></tr></table>
</body></html>`;
}

/** The reset message. `hours` is stated so the reader knows the link goes stale. */
export function passwordResetEmail(name: string, url: string, minutes: number): { subject: string; html: string; text: string } {
  const first = firstName(name);
  return {
    subject: "Reset your Nexoris Technologies password",
    html: shell(
      "Reset your password",
      `<p style="margin:0 0 12px;">Hello ${escapeHtml(first)},</p>
       <p style="margin:0 0 12px;">Someone asked to reset the password for this account. Choose a new one using the button below.</p>
       <p style="margin:0;">This link works once and expires in ${minutes} minutes.</p>`,
      { label: "Choose a new password", url },
      `<strong style="color:${INK};">If you did not ask for this, you can ignore this email.</strong>
       Your password stays as it is, and the link above cannot be used to read it.`,
    ),
    text: [
      `Hello ${first},`,
      ``,
      `Someone asked to reset the password for your Nexoris Technologies account.`,
      `Choose a new one here:`,
      url,
      ``,
      `This link works once and expires in ${minutes} minutes.`,
      ``,
      `If you did not ask for this, ignore this email. Your password stays as it is.`,
      ``,
      `Nexoris Technologies Limited, Lagos, Nigeria`,
    ].join("\n"),
  };
}

/** The invitation message. `days` matches the token's own expiry. */
export function invitationEmail(name: string, invitedBy: string, url: string, days: number): { subject: string; html: string; text: string } {
  const first = firstName(name);
  return {
    subject: "You have been invited to Nexoris Technologies Admin",
    html: shell(
      "Set up your account",
      `<p style="margin:0 0 12px;">Hello ${escapeHtml(first)},</p>
       <p style="margin:0 0 12px;">${escapeHtml(invitedBy)} has invited you to the Nexoris Technologies admin. Set your password to finish setting up your account.</p>
       <p style="margin:0;">This invitation expires in ${days} days.</p>`,
      { label: "Set your password", url },
      `You choose your own password; nobody else sees it. If you were not expecting this invitation,
       you can ignore this email and no account will be activated.`,
    ),
    text: [
      `Hello ${first},`,
      ``,
      `${invitedBy} has invited you to the Nexoris Technologies admin.`,
      `Set your password to finish setting up your account:`,
      url,
      ``,
      `This invitation expires in ${days} days.`,
      ``,
      `If you were not expecting this, ignore this email and no account will be activated.`,
      ``,
      `Nexoris Technologies Limited, Lagos, Nigeria`,
    ].join("\n"),
  };
}

function firstName(full: string): string {
  return (full ?? "").trim().split(/\s+/)[0] || "there";
}

/** Text going into element content. A name comes from a form and must not be able to inject markup. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Text going into an attribute value. */
function escapeAttr(s: string): string {
  return escapeHtml(s);
}
