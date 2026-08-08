"use client";
/**
 * The lifecycle stage control on a lead (PRD 2.2). Choosing a stage submits the updateLeadStage
 * action; Lost reveals a reason, Nurture reveals a revival date. Errors and confirmation show
 * inline. Hidden to viewers by the server action.
 */
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { SERVICES } from "@nexoris/recommend";
import { Button } from "@nexoris/ui";
import { updateLeadStage } from "../../../../lib/crm-actions.js";
import {
  STAGES,
  LOST_REASONS,
  ENGAGEMENT_TYPES,
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

      {status === "Won" ? (
        <div className="flex flex-col gap-3 rounded-card border border-purple-200 bg-purple-100/40 p-3">
          <p className="text-[0.78rem] text-neutral-600">
            The deal is captured here and carried straight into the Finance Engagement. These figures
            are yours to enter; nothing is assumed.
          </p>
          <div className="flex flex-col gap-1">
            <label htmlFor="dealValue" className="text-label font-600 text-ink-950">
              Deal value (Sales Won Value, NGN)
            </label>
            <input
              id="dealValue"
              name="dealValue"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              placeholder="e.g. 2500000"
              className="rounded-card border border-neutral-300 p-2 text-label"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="serviceLine" className="text-label font-600 text-ink-950">
              Service line
            </label>
            <select
              id="serviceLine"
              name="serviceLine"
              defaultValue=""
              className="cursor-pointer rounded-card border border-neutral-300 p-2 text-label"
            >
              <option value="" disabled>
                Choose a service line
              </option>
              {SERVICES.map((service) => (
                <option key={service.slug} value={service.label}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="engagementType" className="text-label font-600 text-ink-950">
              Engagement type
            </label>
            <select
              id="engagementType"
              name="engagementType"
              defaultValue=""
              className="cursor-pointer rounded-card border border-neutral-300 p-2 text-label"
            >
              <option value="" disabled>
                Choose the engagement type
              </option>
              {ENGAGEMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
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
