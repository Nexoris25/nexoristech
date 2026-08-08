"use client";
/**
 * Grant a person access to a module with a role (PRD 3.2). The role options follow the chosen module.
 * Posts natively to /api/access so granting works even when the app is framed (a Server Action would be
 * rejected on `Origin: null`). Writes to the one access table every module's permission check reads.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { MODULES, MODULE_LABEL, MODULE_ROLES, type ModuleId } from "../../../../lib/shell-constants.js";

export function GrantAccess({ staffId }: { staffId: string }): ReactNode {
  const [moduleId, setModuleId] = useState<ModuleId>("crm");
  const roles = MODULE_ROLES[moduleId];
  const select = "cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-[0.78rem] text-slate-900 focus:border-[#543CDA] focus:outline-none";

  return (
    <form action="/api/access" method="post" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="action" value="grant" />
      <input type="hidden" name="staffId" value={staffId} />
      <select name="module" value={moduleId} onChange={(e) => setModuleId(e.target.value as ModuleId)} aria-label="Module" className={select}>
        {MODULES.map((m) => <option key={m} value={m}>{MODULE_LABEL[m]}</option>)}
      </select>
      <select name="role" aria-label="Role" className={select}>
        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
      </select>
      <button type="submit" className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#543CDA] px-2.5 py-1.5 text-[0.78rem] font-600 text-white hover:bg-[#4330B8]">
        <Plus size={13} strokeWidth={2.4} /> Grant
      </button>
    </form>
  );
}
