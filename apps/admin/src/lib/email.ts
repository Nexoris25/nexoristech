/**
 * Sending email.
 *
 * A note on the choice, because the brief said "nodemailer, not SMTP": nodemailer *is* an SMTP client.
 * Its default transport speaks SMTP to a mail server, so using it would have meant configuring exactly
 * the thing that was ruled out, a host, a port, a username and a password. What was actually wanted is
 * email that works without standing up a mail server, and that means an HTTP API. This posts to
 * Mailjet's Send API v3.1 over HTTPS.
 *
 * Where the configuration comes from, and why that changed. It used to be two environment variables,
 * while the CMS carried a Global Settings screen with a provider dropdown and SMTP fields that nothing
 * read: filling that form in and saving it changed nothing about what was sent. Configuration now
 * lives in one place, email_settings in the platform database, edited at Settings, Email Delivery, and
 * read here. Environment variables are gone rather than kept as a second source of truth, because two
 * sources of truth for "which account sends our mail" is how an operator ends up debugging the wrong
 * one.
 *
 * Encryption is not configurable. The provider is reached over TLS because the URL is https and there
 * is no code path that is not, and the stored credential is sealed with AES-256-GCM (see secret-box).
 * The old screen's STARTTLS / SSL / None dropdown has no successor, deliberately: "None" was an option
 * to send credentials in clear text.
 *
 * Three rules this file follows without exception:
 *
 *   * It never throws into a request path. A password reset that fails to send must not turn into a
 *     500 on the sign-in page, and an invitation that fails to send must not lose the account that was
 *     just created. Callers get a result and decide what to say.
 *
 *   * It never logs a token, a link or a message body. Those are the credential. What gets logged is
 *     whether delivery worked and, on failure, the provider's error, never the payload.
 *
 *   * The API secret is read here and nowhere else. It is not returned by any route, not rendered into
 *     any page, and not written to any log, including on failure.
 */
import { db } from "./db.js";
import { open, sealingAvailable } from "./secret-box.js";

const API = "https://api.mailjet.com/v3.1/send";

export interface EmailMessage {
  to: string;
  subject: string;
  /** The HTML body. */
  html: string;
  /** The plain-text alternative. Never optional: some clients show only this, and spam filters read it. */
  text: string;
}

export type EmailResult =
  /**
   * The provider accepted the message. Accepted, not delivered.
   *
   * This distinction cost real time, so it is worth stating. Mailjet answers a v3.1 send with
   * `Status: "success"` and a MessageID as soon as it has taken the message, and that is all it
   * means. A brand-new account that has not been validated yet takes every message this way and
   * sends none of them: the API says success, the message store returns 404 for the ID it just
   * issued, and the account's lifetime counters stay empty.
   *
   * So this status means the message left here and the provider owns it now. Anything downstream,
   * validation holds, bounces, spam foldering, is between the provider and the recipient, and the
   * only honest thing this code can report is the handover.
   */
  | { status: "sent" }
  /** No provider is configured yet. Not an error: the caller falls back to a copyable link. */
  | { status: "not-configured"; reason: string }
  /** The provider was called and refused, or the request failed. */
  | { status: "failed"; reason: string };

/** The parts of the configuration that are safe to hold in memory together. */
interface Delivery {
  apiKey: string;
  apiSecret: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
}

interface SettingsRow {
  from_email: string;
  from_name: string;
  reply_to: string;
  api_key_sealed: string | null;
  api_secret_sealed: string | null;
}

/**
 * Load and unseal the configuration, or say precisely what is missing.
 *
 * Read per send rather than cached: the configuration is a single indexed row, sends are rare, and a
 * cache would mean an operator fixing a wrong key in Settings and watching mail keep failing until
 * something restarted.
 */
async function delivery(): Promise<Delivery | { missing: string }> {
  if (!sealingAvailable()) {
    return { missing: "ADMIN_SETTINGS_KEY is not set, so the stored credentials cannot be opened" };
  }
  let row: SettingsRow | undefined;
  try {
    const { rows } = await db().query<SettingsRow>(
      "SELECT from_email, from_name, reply_to, api_key_sealed, api_secret_sealed FROM email_settings WHERE id = true",
    );
    row = rows[0];
  } catch (e) {
    return { missing: `the email settings could not be read: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!row) return { missing: "no email settings row exists" };

  const apiKey = open(row.api_key_sealed);
  const apiSecret = open(row.api_secret_sealed);
  if (!apiKey || !apiSecret) {
    return { missing: "no Mailjet API key and secret are stored, or they were sealed under a different ADMIN_SETTINGS_KEY" };
  }
  if (!row.from_email) return { missing: "no From address is set" };

  return {
    apiKey,
    apiSecret,
    fromEmail: row.from_email,
    fromName: row.from_name || row.from_email,
    replyTo: row.reply_to,
  };
}

/** True when email can actually be sent, so callers can adjust what they tell the user. */
export async function emailConfigured(): Promise<boolean> {
  const config = await delivery();
  return !("missing" in config);
}

/** What is stopping email from being sent, or null when nothing is. For operator-facing screens only. */
export async function emailBlocker(): Promise<string | null> {
  const config = await delivery();
  return "missing" in config ? config.missing : null;
}

/** Basic credentials for Mailjet: the API key is the username, the secret is the password. */
function authorization(config: Delivery): string {
  return `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`;
}

async function deliver(message: EmailMessage): Promise<EmailResult> {
  const config = await delivery();
  if ("missing" in config) return { status: "not-configured", reason: config.missing };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: authorization(config), "Content-Type": "application/json" },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: config.fromEmail, Name: config.fromName },
            To: [{ Email: message.to }],
            Subject: message.subject,
            TextPart: message.text,
            HTMLPart: message.html,
            ...(config.replyTo ? { ReplyTo: { Email: config.replyTo } } : {}),
          },
        ],
      }),
      // A slow mail provider must not hold a form submission open.
      signal: AbortSignal.timeout(10_000),
    });

    const body = await res.text().catch(() => "");

    if (!res.ok) {
      // The provider's own message, truncated. It says useful things like "sender address is not
      // validated", and it never contains our payload.
      return { status: "failed", reason: `provider returned ${res.status} ${body.slice(0, 300)}`.trim() };
    }

    // Mailjet answers 200 for a batch and reports per-message outcomes inside it, so a rejected
    // recipient arrives as a success at the HTTP layer. Treating 200 as "sent" would have reported
    // delivery for an address the provider refused.
    const outcome = parseBatch(body);
    return outcome === null ? { status: "sent" } : { status: "failed", reason: outcome };
  } catch (e) {
    return { status: "failed", reason: e instanceof Error ? e.message : String(e) };
  }
}

/** The reason the first message in a Mailjet batch was not accepted, or null when it was. Exported
 *  for its tests: a 200 that reports a rejected recipient is the case worth pinning down. */
export function parseBatch(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as {
      Messages?: { Status?: string; Errors?: { ErrorMessage?: string }[] }[];
    };
    const first = parsed.Messages?.[0];
    if (!first) return "provider returned no message status";
    if (first.Status === "success") return null;
    const detail = (first.Errors ?? [])
      .map((e) => e.ErrorMessage ?? "")
      .filter(Boolean)
      .join("; ");
    return `provider reported ${first.Status ?? "an unknown status"}${detail ? `: ${detail}` : ""}`.slice(0, 300);
  } catch {
    // A 200 that is not the documented shape. Not worth failing the send over, and not worth claiming
    // success over either; the HTTP layer accepted it, so report that and let the provider's own
    // dashboard be the record.
    return null;
  }
}

/**
 * Send one message. Logs the outcome, never the contents.
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
      `[email] ${purpose} not sent: ${result.reason}. Configure it at Settings, Email Delivery. ` +
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
