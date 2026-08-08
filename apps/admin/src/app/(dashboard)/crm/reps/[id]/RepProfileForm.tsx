"use client";
/**
 * The Sales Rep Profile edit form (PRD 5.6, 5.7). A CRM Admin sets the industries owned, capacity
 * cap, territory, and the weekly and monthly targets. Everything here is configuration; the rep's
 * name and contact are read from HR and shown read-only by the page around this form.
 */
import type { ReactNode } from "react";
import { useActionState } from "react";
import { INDUSTRIES } from "@nexoris/recommend";
import { Button } from "@nexoris/ui";
import { updateRepProfile } from "../../../../../lib/rep-profile-actions.js";
import { TARGET_METRICS, type ProfileState } from "../../../../../lib/crm-constants.js";

const initial: ProfileState = {};

const FIELD = "rounded-card border border-neutral-300 p-2 text-label";

export function RepProfileForm({
  staffId,
  industries,
  capacityCap,
  territory,
  targets,
}: {
  staffId: string;
  industries: string[];
  capacityCap: number | null;
  territory: string | null;
  targets: Record<string, number>;
}): ReactNode {
  const [state, action, pending] = useActionState(updateRepProfile, initial);
  const owned = new Set(industries);
  const monthly = TARGET_METRICS.filter((m) => m.period === "monthly");
  const weekly = TARGET_METRICS.filter((m) => m.period === "weekly");

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="staffId" value={staffId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="capacityCap" className="text-label font-600 text-ink-950">
            Capacity cap
          </label>
          <input
            id="capacityCap"
            name="capacityCap"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={capacityCap ?? ""}
            placeholder="Open leads at once"
            className={FIELD}
          />
          <span className="text-[0.72rem] text-neutral-600">
            Leave blank to exclude from the round-robin.
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="territory" className="text-label font-600 text-ink-950">
            Territory
          </label>
          <input
            id="territory"
            name="territory"
            type="text"
            defaultValue={territory ?? ""}
            placeholder="Optional, e.g. Lagos"
            className={FIELD}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-label font-600 text-ink-950">Industries owned</legend>
        <p className="text-[0.72rem] text-neutral-600">
          Leads in these industries prefer this rep. None selected means any industry.
        </p>
        <div className="mt-1 grid grid-cols-1 gap-1.5 min-[520px]:grid-cols-2">
          {INDUSTRIES.map((industry) => (
            <label
              key={industry.slug}
              className="flex cursor-pointer items-center gap-2 rounded-card border border-neutral-200 px-2.5 py-1.5 text-[0.8rem] text-ink-950 hover:bg-purple-100/40"
            >
              <input
                type="checkbox"
                name="industry"
                value={industry.slug}
                defaultChecked={owned.has(industry.slug)}
                className="h-3.5 w-3.5 cursor-pointer accent-purple-600"
              />
              {industry.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-label font-600 text-ink-950">Monthly targets</legend>
          {monthly.map((metric) => (
            <label key={metric.key} className="flex flex-col gap-1">
              <span className="text-[0.78rem] text-neutral-600">
                {metric.label}
                {metric.kind === "naira" ? " (NGN)" : ""}
              </span>
              <input
                name={`target_${metric.key}`}
                type="number"
                min="0"
                inputMode="numeric"
                defaultValue={targets[metric.key] || ""}
                placeholder="0"
                className={FIELD}
              />
            </label>
          ))}
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-label font-600 text-ink-950">Weekly targets</legend>
          {weekly.map((metric) => (
            <label key={metric.key} className="flex flex-col gap-1">
              <span className="text-[0.78rem] text-neutral-600">{metric.label}</span>
              <input
                name={`target_${metric.key}`}
                type="number"
                min="0"
                inputMode="numeric"
                defaultValue={targets[metric.key] || ""}
                placeholder="0"
                className={FIELD}
              />
            </label>
          ))}
        </fieldset>
      </div>

      {state.error ? (
        <p className="text-label text-purple-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-label text-green-700" role="status">
          Profile saved.
        </p>
      ) : null}

      <div>
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
