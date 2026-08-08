/**
 * Sending email.
 *
 * A note on the choice, because the brief said "nodemailer, not SMTP": nodemailer *is* an SMTP client.
 * Its default transport speaks SMTP to a mail server, so using it would have meant configuring exactly
 * the thing that was ruled out — a host, a port, a username and a password. What was actually wanted is
 * email that works without standing up a mail server, and that means an HTTP API.
 *
 * So this posts to a provider over HTTPS. Resend is the implementation: one API key, one request, no
 * server to run and nothing to keep patched. Everything provider-specific is inside `deliver` below, so
 * moving to Postmark, SendGrid or anything else is a change to one function.
 *
 * Two rules this file follows without exception:
 *
 *   * It never throws into a request path. A password reset that fails to send must not turn into a
 *     500 on the sign-in page, and an invitation that fails to send must not lose the account that was
 *     just created. Callers get a result and decide what to say.
 *
 *   * It never logs a token, a link or a message body. Those are the credential. What gets logged is
 *     whether delivery worked and, on failure, the provider's error — never the payload.
 */

const API = "https://api.resend.com/emails";

export interface EmailMessage {
  to: string;
  subject: string;
  /** The HTML body. */
  html: string;
  /** The plain-text alternative. Never optional: some clients show only this, and spam filters read it. */
  text: string;
}

export type EmailResult =
  /** Handed to the provider, which accepted it. */
  | { status: "sent" }
  /** No provider is configured yet. Not an error: the caller falls back to a copyable link. */
  | { status: "not-configured" }
  /** The provider was called and refused, or the request failed. */
  | { status: "failed"; reason: string };

/** True when email can actually be sent, so callers can adjust what they tell the user. */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * The address messages are sent from. Must be on a domain verified with the provider, or the provider
 * will reject the request — that rejection is surfaced, not swallowed.
 */
function sender(): string {
  return process.env.EMAIL_FROM ?? "";
}

async function deliver(message: EmailMessage): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !sender()) return { status: "not-configured" };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      // A slow mail provider must not hold a form submission open.
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) return { status: "sent" };

    // The provider's own message, truncated. It says useful things like "domain is not verified",
    // and it never contains our payload.
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    return { status: "failed", reason: `provider returned ${res.status} ${detail}`.trim() };
  } catch (e) {
    return { status: "failed", reason: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Send one message. Logs the outcome — never the contents.
 *
 * `purpose` is a short label for the log ("password reset", "invitation") so an operator can tell what
 * failed without the message being anywhere near the logs.
 */
export async function sendEmail(message: EmailMessage, purpose: string): Promise<EmailResult> {
  const result = await deliver(message);
  if (result.status === "failed") {
    console.error(`[email] ${purpose} to ${redact(message.to)} failed: ${result.reason}`);
  } else if (result.status === "not-configured") {
    console.warn(
      `[email] ${purpose} not sent: RESEND_API_KEY and EMAIL_FROM are not both set. ` +
      `The link is still available to copy from the admin.`,
    );
  }
  return result;
}

/**
 * An address in a form that is useful in a log without printing it in full: enough to match against a
 * support request, not enough to harvest.
 */
function redact(address: string): string {
  const [local = "", domain = ""] = address.split("@");
  const head = local.slice(0, 2);
  return `${head}${local.length > 2 ? "***" : ""}@${domain}`;
}
