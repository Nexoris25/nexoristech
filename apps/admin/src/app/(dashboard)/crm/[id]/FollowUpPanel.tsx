"use client";
/**
 * The AI follow-up email panel (PRD 5.8, 5.9). Shows the Oge-drafted email for the lead's current
 * stage, editable in place, with Regenerate (asks Oge for a fresh version) and Copy. For an
 * advanced lead it also shows the recommended send-by date and a Mark as sent control; if the
 * client has not replied by that date, the Action Center surfaces it. Drafts only: nothing sends
 * from here.
 */
import type { ReactNode } from "react";
import { useActionState, useEffect, useState } from "react";
import { Copy, Check, RefreshCw, Send } from "lucide-react";
import { markFollowUpSent } from "../../../../lib/crm-actions.js";

interface DraftResult {
  error?: string;
  draft?: string;
  draftedBy?: "ai" | "template";
}

export function FollowUpPanel({
  leadId,
  initialDraft,
  initialDraftedBy,
  action,
  due,
  sent,
  canEdit,
}: {
  leadId: string;
  initialDraft: string;
  initialDraftedBy: "ai" | "template";
  action: (prev: DraftResult, formData: FormData) => Promise<DraftResult>;
  due?: string | null;
  sent?: boolean;
  canEdit: boolean;
}): ReactNode {
  const [state, formAction, pending] = useActionState<DraftResult, FormData>(action, {});
  const [text, setText] = useState(initialDraft);
  const [copied, setCopied] = useState(false);
  const draftedBy = state.draftedBy ?? initialDraftedBy;

  useEffect(() => {
    if (state.draft) setText(state.draft);
  }, [state.draft]);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const dueLabel = due
    ? new Date(due).toLocaleDateString("en-NG", {
        timeZone: "Africa/Lagos",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-3">
      {dueLabel ? (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-purple-200 bg-purple-100/50 px-3 py-2 text-[0.78rem] text-ink-950">
          <span className="font-600">Recommended send by {dueLabel}.</span>
          <span className="text-neutral-600">
            {sent
              ? "Marked as sent."
              : "If the client has not replied by then, this appears in the Action Center."}
          </span>
        </div>
      ) : null}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!canEdit}
        rows={14}
        aria-label="Follow-up email draft"
        className="w-full rounded-card border border-neutral-200 bg-neutral-50 p-4 font-mono text-[0.82rem] leading-relaxed text-ink-950 focus:border-purple-500"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-[0.72rem] text-neutral-600">
          Draft only{draftedBy === "template" ? " (template)" : " (Oge)"}. Review and edit before you
          send it.
        </span>

        {canEdit ? (
          <form action={formAction}>
            <input type="hidden" name="leadId" value={leadId} />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-card border border-purple-200 px-3 py-2 text-[0.78rem] font-600 text-purple-700 hover:bg-purple-100 disabled:opacity-60"
            >
              <RefreshCw size={14} strokeWidth={2} className={pending ? "animate-spin" : ""} />
              {pending ? "Regenerating" : "Regenerate"}
            </button>
          </form>
        ) : null}

        <button
          type="button"
          onClick={copy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-card bg-ink-950 px-3 py-2 text-[0.78rem] font-600 text-white hover:bg-ink-800"
        >
          {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
          {copied ? "Copied" : "Copy email"}
        </button>

        {canEdit && due && !sent ? (
          <form action={markFollowUpSent}>
            <input type="hidden" name="leadId" value={leadId} />
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-card bg-purple-600 px-3 py-2 text-[0.78rem] font-600 text-white hover:bg-purple-700"
            >
              <Send size={14} strokeWidth={2} />
              Mark as sent
            </button>
          </form>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-[0.78rem] text-purple-700" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
