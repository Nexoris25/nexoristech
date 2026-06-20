"use client";
/**
 * The lifecycle stage control on a lead (PRD 2.2). Choosing a stage submits the updateLeadStage
 * action; Lost reveals a reason, Nurture reveals a revival date. Errors and confirmation show
 * inline. Hidden to viewers by the server action.
 */
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Button } from "@nexoris/ui";
import { updateLeadStage } from "../../../../lib/crm-actions.js";
import {
  STAGES,
  LOST_REASONS,
  type StageState,
} from "../../../../lib/crm-constants.js";

const initial: StageState = {};

export function StageControl({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}): ReactNode {
  const [state, action, pending] = useActionState(updateLeadStage, initial);
  const [status, setStatus] = useState(currentStatus);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-label font-600 text-ink-950">
          Stage
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="cursor-pointer rounded-card border border-neutral-300 p-2 text-label"
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </div>

      {status === "Lost" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="lostReason" className="text-label font-600 text-ink-950">
            Reason
          </label>
          <select
            id="lostReason"
            name="lostReason"
            className="cursor-pointer rounded-card border border-neutral-300 p-2 text-label"
          >
            {LOST_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {status === "Nurture" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="nurtureDate" className="text-label font-600 text-ink-950">
            Revisit on
          </label>
          <input
            id="nurtureDate"
            name="nurtureDate"
            type="date"
            className="rounded-card border border-neutral-300 p-2 text-label"
          />
        </div>
      ) : null}

      {state.error ? (
        <p className="text-label text-purple-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-label text-green-700" role="status">
          Stage updated.
        </p>
      ) : null}

      <Button type="submit" size="md" disabled={pending}>
        {pending ? "Saving" : "Update stage"}
      </Button>
    </form>
  );
}
