"use client";
/**
 * Grant a person access to a module with a role (PRD 3.2). The role options follow the chosen
 * module. Submitting writes to the one access table read by every module's permission check.
 */
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { grantModuleAccess } from "../../../lib/shell-actions.js";
import { MODULES, MODULE_LABEL, MODULE_ROLES, type AccessState, type ModuleId } from "../../../lib/shell-constants.js";

const initial: AccessState = {};

export function GrantAccess({ staffId }: { staffId: string }): ReactNode {
  const [state, action, pending] = useActionState(grantModuleAccess, initial);
  const [moduleId, setModuleId] = useState<ModuleId>("crm");
  const roles = MODULE_ROLES[moduleId];

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="staffId" value={staffId} />
      <select
        name="module"
        value={moduleId}
        onChange={(e) => setModuleId(e.target.value as ModuleId)}
        aria-label="Module"
        className="cursor-pointer rounded-card border border-neutral-200 p-1.5 text-[0.78rem] text-ink-950"
      >
        {MODULES.map((m) => (
          <option key={m} value={m}>
            {MODULE_LABEL[m]}
          </option>
        ))}
      </select>
      <select
        name="role"
        aria-label="Role"
        className="cursor-pointer rounded-card border border-neutral-200 p-1.5 text-[0.78rem] text-ink-950"
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex cursor-pointer items-center gap-1 rounded-card bg-purple-600 px-2.5 py-1.5 text-[0.78rem] font-600 text-white hover:bg-purple-700 disabled:opacity-60"
      >
        <Plus size={13} strokeWidth={2.4} />
        Grant
      </button>
      {state.error ? <span className="text-[0.72rem] text-[#C0362C]">{state.error}</span> : null}
    </form>
  );
}
