"use client";
/**
 * The Email Delivery form.
 *
 * A native form posting to a route handler, like the rest of the shell's write paths: Server Actions
 * return 500 when the browser sends Origin: null, which this deployment does hit.
 *
 * The credential fields are write-only. An existing secret is never loaded into the page, so the boxes
 * start empty and mean "replace what is stored" rather than "here is what is stored". Leaving them
 * empty saves the rest of the form and keeps the credential untouched, which is what an operator
 * correcting a From name expects to happen.
 *
 * autoComplete is off on the sender fields for a reason that was found the hard way. A browser
 * recognises three boxes shaped like a name and two addresses and fills them from its own store, and
 * because the form posts what is in the boxes rather than what was typed, saving after touching one
 * unrelated field silently replaced the From address with whatever the browser had remembered. The
 * page showed one sender and the database held another.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { KeyRound, Send } from "lucide-react";

export interface EmailSettingsInitial {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  keyHint: string;
  hasKey: boolean;
}

const field =
  "w-full rounded-card border border-neutral-200 bg-white px-3 py-2.5 text-[0.86rem] text-ink-950 placeholder:text-neutral-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/15";
const label = "text-[0.8rem] font-600 text-ink-950";

export function EmailSettingsForm({
  initial,
  canSeal,
}: {
  initial: EmailSettingsInitial;
  canSeal: boolean;
}): ReactNode {
  const [replacing, setReplacing] = useState(!initial.hasKey);

  return (
    <form action="/api/settings/email" method="post" className="mt-5 flex flex-col gap-5">
      <section className="rounded-card border border-neutral-200 bg-white p-4 shadow-subtle sm:p-5">
        <h2 className="text-[0.95rem] font-700 text-ink-950">Sender</h2>
        <p className="mt-1 text-[0.8rem] text-neutral-500">
          The address must belong to a domain validated with Mailjet, or Mailjet will refuse the message.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={label}>From Name</span>
            <input name="fromName" defaultValue={initial.fromName} autoComplete="off" placeholder="Nexoris Technologies" className={field} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>From Email</span>
            <input type="email" name="fromEmail" defaultValue={initial.fromEmail} autoComplete="off" placeholder="hello@nexoristech.com" required className={field} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={label}>Reply-To <span className="font-400 text-neutral-400">(optional)</span></span>
            <input type="email" name="replyTo" defaultValue={initial.replyTo} autoComplete="off" placeholder="business@nexoristech.com" className={field} />
          </label>
        </div>
      </section>

      <section className="rounded-card border border-neutral-200 bg-white p-4 shadow-subtle sm:p-5">
        <h2 className="flex items-center gap-1.5 text-[0.95rem] font-700 text-ink-950"><KeyRound size={15} /> Mailjet credentials</h2>

        {initial.hasKey && !replacing ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-card bg-neutral-50 px-3.5 py-3">
            <p className="text-[0.84rem] text-neutral-600">
              A key ending <span className="font-mono font-600 text-ink-950">{initial.keyHint || "••••"}</span> is stored.
              The secret is sealed and cannot be displayed.
            </p>
            <button type="button" onClick={() => setReplacing(true)}
              className="shrink-0 cursor-pointer rounded-card border border-purple-200 px-3 py-1.5 text-[0.78rem] font-600 text-purple-700 hover:bg-purple-100">
              Replace
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={label}>API Key</span>
              <input name="apiKey" autoComplete="off" spellCheck={false} placeholder="Mailjet API key" className={field} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>API Secret Key</span>
              {/* type=password so it is not left legible on a shared screen while being pasted. */}
              <input type="password" name="apiSecret" autoComplete="new-password" spellCheck={false} placeholder="Mailjet secret key" className={field} />
            </label>
            <p className="text-[0.78rem] text-neutral-500 sm:col-span-2">
              {initial.hasKey
                ? "Fill both boxes to replace the stored pair. Leave them empty to keep it."
                : "Both are required. They are encrypted before they are stored and are never shown again."}
            </p>
          </div>
        )}
        {!canSeal ? (
          <p className="mt-3 text-[0.78rem] font-600 text-amber-700">
            Credentials entered here will not be saved until ADMIN_SETTINGS_KEY is set.
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Verifies the stored credentials against Mailjet without sending anyone a message. */}
        <button type="submit" name="intent" value="verify"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-card border border-purple-200 px-4 py-2.5 text-[0.84rem] font-600 text-purple-700 hover:bg-purple-100">
          <Send size={14} /> Verify credentials
        </button>
        <button type="submit" name="intent" value="save"
          className="cursor-pointer rounded-card bg-purple-600 px-6 py-2.5 text-[0.84rem] font-600 text-white hover:bg-purple-700">
          Save
        </button>
      </div>
    </form>
  );
}
