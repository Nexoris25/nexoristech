"use client";
/**
 * Send someone a password-reset link.
 *
 * This replaces a dialog in which an administrator typed a new password for another person and then
 * "shared it with them directly", which the file justified with "no mail service exists in this
 * phase". A mail service exists now, and the self-service flow it needed has existed for a while:
 * /forgot-password mints a single-use token and emails it to the address on the staff record.
 *
 * The admin path is worse than that flow in a way worth being explicit about, because it looked
 * helpful. A password an administrator chooses is a password an administrator knows, it travels to
 * the person over whatever channel is to hand, and the audit log records only that a reset happened.
 * The person never proves they control the mailbox. So the strongest thing an admin should be able to
 * do on someone else's behalf is start the flow, which is what this does: the link goes to the
 * address on the record, expires, and can be used once.
 *
 * Native form post to /api/access, like the rest of this screen.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { MailCheck } from "lucide-react";

export function SendResetLink({ staffId, email, byEmail = false }: { staffId: string; email: string; byEmail?: boolean }): ReactNode {
  const [sent, setSent] = useState(false);

  return (
    <form
      action="/api/access"
      method="post"
      onSubmit={() => setSent(true)}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="action" value="send-reset" />
      <input type="hidden" name="staffId" value={staffId} />
      <button
        type="submit"
        disabled={sent}
        title={byEmail ? `Email a reset link to ${email}` : `Create a reset link for ${email} to pass on`}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[0.78rem] font-600 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MailCheck size={14} /> {sent ? "Working…" : byEmail ? "Send reset link" : "Create reset link"}
      </button>
    </form>
  );
}
