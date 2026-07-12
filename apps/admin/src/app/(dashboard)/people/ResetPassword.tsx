"use client";
/**
 * Resolve a password-reset request by setting a new password for the person (PRD 1.1). No mail
 * service exists in this phase, so the admin sets it here and shares it with the person directly.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { resolvePasswordReset } from "../../../lib/shell-actions.js";

export function ResetPassword({
  requestId,
  staffId,
}: {
  requestId: string;
  staffId: string;
}): ReactNode {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-card border border-purple-200 px-2.5 py-1.5 text-[0.78rem] font-600 text-purple-700 hover:bg-purple-100"
      >
        Set new password
      </button>
    );
  }

  return (
    <form action={resolvePasswordReset} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="staffId" value={staffId} />
      <input
        name="newPassword"
        type="text"
        minLength={8}
        required
        placeholder="New password (min 8)"
        className="rounded-card border border-neutral-200 p-1.5 text-[0.78rem] text-ink-950"
      />
      <button
        type="submit"
        className="cursor-pointer rounded-card bg-purple-600 px-2.5 py-1.5 text-[0.78rem] font-600 text-white hover:bg-purple-700"
      >
        Save
      </button>
    </form>
  );
}
