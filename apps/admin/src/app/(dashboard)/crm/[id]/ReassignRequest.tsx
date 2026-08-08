"use client";
/**
 * The salesperson's reassignment request control (PRD 5.4). The lead's owner gives a short reason
 * and submits; a CRM Admin approves or declines it from the reassignment queue. Reassignment stays
 * Admin-only, so this is a request, never a direct handover.
 */
import type { ReactNode } from "react";
import { useActionState } from "react";
import { requestReassignment } from "../../../../lib/crm-reassign-actions.js";
import { type ReassignState } from "../../../../lib/crm-constants.js";

const initial: ReassignState = {};

export function ReassignRequest({ leadId }: { leadId: string }): ReactNode {
  const [state, action, pending] = useActionState(requestReassignment, initial);

  if (state.ok) {
    return (
      <p className="mt-3 rounded-card border border-purple-200 bg-purple-100/50 px-3 py-2 text-[0.8rem] text-ink-950">
        Request sent. An admin will approve or decline it.
      </p>
    );
  }

  return (
    <form action={action} className="mt-4 flex flex-col gap-2 border-t border-purple-200 pt-4">
      <input type="hidden" name="leadId" value={leadId} />
      <label htmlFor="reason" className="text-[0.75rem] font-600 uppercase tracking-wide text-neutral-600">
        Request reassignment
      </label>
      <textarea
        id="reason"
        name="reason"
        rows={2}
        placeholder="Why should this lead be reassigned?"
        className="rounded-card border border-neutral-200 p-2.5 text-[0.85rem] text-ink-950"
      />
      {state.error ? (
        <p className="text-[0.8rem] text-purple-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-card border border-purple-300 px-3 py-2 text-[0.82rem] font-600 text-purple-700 hover:bg-purple-100 disabled:opacity-60"
      >
        {pending ? "Sending" : "Request reassignment"}
      </button>
    </form>
  );
}
