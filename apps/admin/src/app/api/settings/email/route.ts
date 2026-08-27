/**
 * Email Delivery settings (PRD 3, 15), as a route handler with a native form post, matching the rest
 * of the shell's write paths: Server Actions are rejected when the browser sends `Origin: null`.
 *
 * Two intents on the one form:
 *   save   - store the sender details, and the credential pair when both boxes were filled in
 *   verify - ask Mailjet whether the stored credentials are accepted, without emailing anybody
 *
 * Admin only. What this route will not do, in any branch: return a credential, echo one back into the
 * page, or write one to the audit log or the console. The audit entry records that email settings
 * changed and whether the key was rotated, which is the part an auditor needs.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { requireAdmin } from "../../../../lib/auth.js";
import { hint, seal, sealingAvailable } from "../../../../lib/secret-box.js";
import { open } from "../../../../lib/secret-box.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const back = (request: NextRequest, query = ""): Response =>
  NextResponse.redirect(new URL(`/settings/email${query}`, request.url), { status: 303 });

const fail = (request: NextRequest, message: string): Response =>
  back(request, `?error=${encodeURIComponent(message)}`);

export async function POST(request: NextRequest): Promise<Response> {
  const admin = await requireAdmin();
  const f = await request.formData();
  const intent = String(f.get("intent") ?? "save");
  const pool = db();

  if (intent === "verify") return verify(request, pool);

  const fromEmail = String(f.get("fromEmail") ?? "").trim();
  const fromName = String(f.get("fromName") ?? "").trim();
  const replyTo = String(f.get("replyTo") ?? "").trim();
  const apiKey = String(f.get("apiKey") ?? "").trim();
  const apiSecret = String(f.get("apiSecret") ?? "").trim();

  if (!fromEmail || !fromEmail.includes("@")) {
    return fail(request, "A From address is required.");
  }
  if (replyTo && !replyTo.includes("@")) {
    return fail(request, "The Reply-To address does not look like an address.");
  }

  // One box filled and not the other is a mistake worth naming rather than half-applying: a key
  // stored against the previous secret would fail every send with a confusing provider error.
  if (Boolean(apiKey) !== Boolean(apiSecret)) {
    return fail(request, "Enter both the API key and the secret, or neither.");
  }

  const rotating = apiKey.length > 0;
  if (rotating && !sealingAvailable()) {
    // Refusing is the point. Storing it unsealed "for now" is how a credential ends up in a backup.
    return fail(
      request,
      "ADMIN_SETTINGS_KEY is not set, so the secret cannot be encrypted. Nothing was saved.",
    );
  }

  const sealedKey = rotating ? seal(apiKey) : null;
  const sealedSecret = rotating ? seal(apiSecret) : null;
  if (rotating && (!sealedKey || !sealedSecret)) {
    return fail(request, "The credentials could not be encrypted. Nothing was saved.");
  }

  /*
   * One transaction, because a credential change that is not in the audit log is worse than a
   * credential change that did not happen. Written as two statements first, and the audit insert
   * named a column this table does not have: the settings were saved, the audit was lost, and the
   * operator saw a 500 for a change that had in fact gone through.
   */
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE email_settings
          SET from_email = $1,
              from_name  = $2,
              reply_to   = $3,
              api_key_sealed    = COALESCE($4, api_key_sealed),
              api_secret_sealed = COALESCE($5, api_secret_sealed),
              api_key_hint      = COALESCE($6, api_key_hint),
              updated_at = now(),
              updated_by = $7
        WHERE id = true`,
      [fromEmail, fromName, replyTo, sealedKey, sealedSecret, rotating ? hint(apiKey) : null, admin.id],
    );
    await client.query(
      // `after`, the column this table actually has, matching every other writer in the app.
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, after)
       VALUES ($1,'update','email_settings',NULL,$2::jsonb)`,
      // The sender is recorded because it is not secret and it is what changed. The credential is
      // recorded only as the fact that it was rotated, never as any part of its value.
      [admin.id, JSON.stringify({ fromEmail, fromName, replyTo, credentialsRotated: rotating })],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`[email-settings] save failed: ${e instanceof Error ? e.message : String(e)}`);
    return fail(request, "The settings could not be saved.");
  } finally {
    client.release();
  }

  return back(request, "?saved=1");
}

/**
 * Check the stored credentials against Mailjet.
 *
 * GET /v3/REST/sender is a read: it answers whether the key and secret are accepted, and lists the
 * addresses the account may send from, without putting a message in anyone's inbox. Verifying by
 * sending a real email would mean this button quietly mails somebody every time it is pressed.
 */
async function verify(request: NextRequest, pool: ReturnType<typeof db>): Promise<Response> {
  const { rows } = await pool.query<{ api_key_sealed: string | null; api_secret_sealed: string | null }>(
    "SELECT api_key_sealed, api_secret_sealed FROM email_settings WHERE id = true",
  );
  const key = open(rows[0]?.api_key_sealed);
  const secret = open(rows[0]?.api_secret_sealed);
  if (!key || !secret) {
    return fail(request, "No credentials are stored, or they cannot be opened with the current ADMIN_SETTINGS_KEY.");
  }

  try {
    const res = await fetch("https://api.mailjet.com/v3/REST/sender?Limit=1", {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 401) return fail(request, "Mailjet rejected the credentials.");
    if (!res.ok) return fail(request, `Mailjet returned ${res.status}.`);
    return back(request, "?tested=ok");
  } catch (e) {
    return fail(request, `Could not reach Mailjet: ${e instanceof Error ? e.message : String(e)}`);
  }
}
