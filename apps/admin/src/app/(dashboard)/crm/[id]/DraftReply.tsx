"use client";
/**
 * Auto-response drafting on a lead (PRD 3.2). Asks the Oge CRM Worker for a reply the salesperson
 * reviews and edits before sending. Drafts only: nothing is sent from here. Hidden to viewers by
 * the server action.
 */
import type { ReactNode } from "react";
import { useActionState } from "react";
import { Button } from "@nexoris/ui";
import { draftLeadReply } from "../../../../lib/crm-actions.js";
import type { DraftState } from "../../../../lib/crm-constants.js";

const initial: DraftState = {};

export function DraftReply({ leadId }: { leadId: string }): ReactNode {
  const [state, action, pending] = useActionState(draftLeadReply, initial);

  return (
    <div className="flex flex-col gap-3">
      <form action={action}>
        <input type="hidden" name="leadId" value={leadId} />
        <Button type="submit" disabled={pending}>
          {pending ? "Drafting" : "Draft a reply"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-label text-purple-700" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.draft ? (
        <div>
          <textarea
            defaultValue={state.draft}
            rows={12}
            className="w-full rounded-card border border-neutral-300 p-3 text-body"
            aria-label="Drafted reply"
          />
          <p className="mt-1 text-label text-neutral-600">
            Draft only{state.draftedBy === "template" ? " (template)" : ""}.
            Review and edit before you send it.
          </p>
        </div>
      ) : null}
    </div>
  );
}
