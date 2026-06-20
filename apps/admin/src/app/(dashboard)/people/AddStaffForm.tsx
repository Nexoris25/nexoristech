"use client";
/**
 * The add-staff form (PRD 2.5). Admin-only (the server action re-checks). Captures the new
 * salesperson's details, an initial password, the industries they own, and a capacity cap.
 */
import type { ReactNode } from "react";
import { useActionState } from "react";
import { Button } from "@nexoris/ui";
import { addStaff } from "../../../lib/people-actions.js";
import { ROLES, type StaffFormState } from "../../../lib/crm-constants.js";

const initial: StaffFormState = {};

export function AddStaffForm(): ReactNode {
  const [state, action, pending] = useActionState(addStaff, initial);

  return (
    <form action={action} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input
        name="name"
        placeholder="Full name"
        required
        className="rounded-card border border-neutral-300 p-2 text-label"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-card border border-neutral-300 p-2 text-label"
      />
      <input
        name="password"
        type="password"
        placeholder="Initial password (min 8)"
        required
        className="rounded-card border border-neutral-300 p-2 text-label"
      />
      <select
        name="role"
        defaultValue="salesperson"
        className="cursor-pointer rounded-card border border-neutral-300 p-2 text-label"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <input
        name="industries"
        placeholder="Industries owned (slugs, comma-separated)"
        className="rounded-card border border-neutral-300 p-2 text-label md:col-span-2"
      />
      <input
        name="capacityCap"
        type="number"
        min="1"
        placeholder="Capacity cap (optional)"
        className="rounded-card border border-neutral-300 p-2 text-label"
      />
      <div className="flex items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding" : "Add staff"}
        </Button>
        {state.error ? (
          <span className="text-label text-purple-700" role="alert">
            {state.error}
          </span>
        ) : null}
        {state.ok ? (
          <span className="text-label text-green-700" role="status">
            Staff added.
          </span>
        ) : null}
      </div>
    </form>
  );
}
