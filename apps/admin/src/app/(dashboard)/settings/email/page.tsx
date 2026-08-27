/**
 * Email Delivery (PRD 3, 15). The one place outbound email is configured, for the whole platform.
 *
 * It lives here rather than in the CMS because email is not a CMS concern. Invitations and password
 * resets go to anyone granted access to any module, so a person invited to Finance or HR depends on
 * this screen just as much as an editor does. The CMS previously carried an Email tab whose fields
 * nothing read; this replaces it.
 *
 * Admin only, and deliberately narrow: it shows whether sending works, who mail comes from, and which
 * key is in use, identified by its last four characters. The API secret is never loaded into this page
 * because it is never sent to a browser at all.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, TriangleAlert, CheckCircle2 } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { emailBlocker } from "../../../../lib/email.js";
import { sealingAvailable } from "../../../../lib/secret-box.js";
import { EmailSettingsForm } from "./EmailSettingsForm.js";

export const dynamic = "force-dynamic";

interface Row {
  from_email: string;
  from_name: string;
  reply_to: string;
  api_key_hint: string;
  has_key: boolean;
  updated_at: string | null;
  updated_by_name: string | null;
}

export default async function EmailSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tested?: string; error?: string }>;
}): Promise<ReactNode> {
  await requireAdmin();
  const sp = await searchParams;
  const pool = db();

  const { rows } = await pool.query<Row>(
    // has_key, not the key. The sealed columns are never selected into anything that renders.
    `SELECT e.from_email, e.from_name, e.reply_to, e.api_key_hint,
            (e.api_key_sealed IS NOT NULL AND e.api_secret_sealed IS NOT NULL) AS has_key,
            e.updated_at::text, s.name AS updated_by_name
       FROM email_settings e
       LEFT JOIN staff s ON s.id = e.updated_by
      WHERE e.id = true`,
  );
  const row = rows[0] ?? {
    from_email: "", from_name: "", reply_to: "", api_key_hint: "",
    has_key: false, updated_at: null, updated_by_name: null,
  };

  const blocker = await emailBlocker();
  const keyed = sealingAvailable();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-[0.82rem] font-600 text-slate-500 hover:text-purple-700">
        <ArrowLeft size={14} /> Settings
      </Link>
      <h1 className="mt-2 text-[1.4rem] font-700 text-slate-900">Email Delivery</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">
        Invitations and password resets for every module are sent from here. Configured once, for the
        whole platform.
      </p>

      {sp.saved ? (
        <p className="mt-4 rounded-card border border-green-200 bg-green-50 px-4 py-3 text-[0.84rem] text-green-800">
          Saved.
        </p>
      ) : null}
      {sp.tested === "ok" ? (
        <p className="mt-4 rounded-card border border-green-200 bg-green-50 px-4 py-3 text-[0.84rem] text-green-800">
          Mailjet accepted the credentials.
        </p>
      ) : null}
      {sp.error ? (
        <p className="mt-4 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-[0.84rem] text-red-800">
          {sp.error}
        </p>
      ) : null}

      {/* Status first. The question an operator arrives with is "does email work", and the old screen
          could not answer it because nothing it showed was connected to sending. */}
      <div className={`mt-5 flex items-start gap-3 rounded-card border px-4 py-3.5 ${blocker ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
        {blocker ? <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />}
        <div>
          <p className={`text-[0.88rem] font-600 ${blocker ? "text-amber-900" : "text-green-900"}`}>
            {blocker ? "Email is not being sent" : "Email is configured"}
          </p>
          <p className={`mt-0.5 text-[0.82rem] ${blocker ? "text-amber-800" : "text-green-800"}`}>
            {blocker
              ? `${blocker}. Invitations still work: the person inviting gets a link to pass on by hand.`
              : `Sending as ${row.from_name ? `${row.from_name} <${row.from_email}>` : row.from_email} through Mailjet.`}
          </p>
        </div>
      </div>

      {!keyed ? (
        <div className="mt-4 flex items-start gap-3 rounded-card border border-slate-200 bg-slate-50 px-4 py-3.5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-500" />
          <div>
            <p className="text-[0.88rem] font-600 text-slate-900">Credential storage is not set up</p>
            <p className="mt-0.5 text-[0.82rem] text-slate-600">
              ADMIN_SETTINGS_KEY is missing from the environment, so an API secret cannot be sealed and
              will not be saved. A credential is never written in the clear as a fallback.
            </p>
          </div>
        </div>
      ) : null}

      <EmailSettingsForm
        initial={{
          fromEmail: row.from_email,
          fromName: row.from_name,
          replyTo: row.reply_to,
          keyHint: row.api_key_hint,
          hasKey: row.has_key,
        }}
        canSeal={keyed}
      />

      <div className="mt-5 rounded-card border border-slate-200 bg-white p-4 text-[0.8rem] text-slate-500">
        <p className="flex items-center gap-1.5 font-600 text-slate-700"><Mail size={14} /> How this is stored</p>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
          <li>Mail is sent over HTTPS to Mailjet&apos;s API. There is no plain-text option, and no SMTP host to expose.</li>
          <li>The API secret is encrypted with AES-256-GCM before it is written, under a key held in the environment and never in the database.</li>
          <li>Once saved, the secret is never shown again, never returned by any API, and never written to a log. Replacing it is the only way to change it.</li>
        </ul>
        {row.updated_at ? (
          <p className="mt-3 text-[0.78rem] text-slate-400">
            Last changed {new Date(row.updated_at).toLocaleString("en-NG")}
            {row.updated_by_name ? ` by ${row.updated_by_name}` : ""}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
