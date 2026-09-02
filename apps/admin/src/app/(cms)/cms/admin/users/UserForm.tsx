"use client";
/**
 * Create / edit CMS user form (CMS Administration design). First/last name, email, the assigned CMS role,
 * department, and status. On create it can send an invitation (status = invited). Native POST to
 * /api/cms/users, which writes to the shared staff table and the CMS module grant.
 *
 * The role list offered nine options — Super Admin, Administrator, Reviewer, Author, Contributor,
 * Manager, Analyst, Guest — of which only Editor existed. Assigning any of the others wrote a role no
 * code recognised into module_access, and the gate then granted blanket CMS access anyway. The options
 * now come from CMS_ROLES, which is what the gate reads.
 *
 * Responsive to 360px.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { CMS_ROLES, ROLE_DESCRIPTION } from "../../../../../lib/cms-roles.js";

interface Initial { id?: string; firstName?: string; lastName?: string; email?: string; role?: string; department?: string; status?: string }
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const DEPARTMENTS = ["Content", "Product", "Marketing", "Operations", "Leadership", "External"];

export function UserForm({ initial }: { initial?: Initial }): ReactNode {
  const edit = Boolean(initial?.id);
  const [sendInvite, setSendInvite] = useState(!edit);
  // Held in state so the description under the select says what the chosen role actually grants.
  const [role, setRole] = useState(initial?.role ?? "Editor");

  return (
    <form action="/api/cms/users" method="post" className="max-w-2xl">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
        <h2 className="text-[0.95rem] font-700 text-slate-900">User Information</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className={label}>First Name <span className="text-[#EF4444]">*</span></span><input name="first_name" defaultValue={initial?.firstName ?? ""} required placeholder="e.g. Ada" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={label}>Last Name</span><input name="last_name" defaultValue={initial?.lastName ?? ""} placeholder="e.g. Obi" className={field} /></label>
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Email Address <span className="text-[#EF4444]">*</span></span><input name="email" type="email" defaultValue={initial?.email ?? ""} required placeholder="name@nexoris.com" className={field} readOnly={edit} /></label>
          <label className="flex flex-col gap-1.5"><span className={label}>Assign Role <span className="text-[#EF4444]">*</span></span>
            <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={`cursor-pointer ${field}`}>{CMS_ROLES.map((r) => <option key={r}>{r}</option>)}</select>
            <span className="text-[0.74rem] leading-snug text-slate-600">{ROLE_DESCRIPTION[role] ?? ""}</span>
          </label>
          <label className="flex flex-col gap-1.5"><span className={label}>Department</span>
            <select name="department" defaultValue={initial?.department ?? "Content"} className={`cursor-pointer ${field}`}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>
          </label>
          {edit ? (
            <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Account Status</span>
              <select name="status" defaultValue={initial?.status ?? "active"} className={`cursor-pointer ${field}`}><option value="active">Active</option><option value="invited">Invited</option><option value="suspended">Suspended</option></select>
            </label>
          ) : null}
        </div>

        {!edit ? (
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
            <span><span className="block text-[0.85rem] font-600 text-slate-800">Send invitation email</span><span className="block text-[0.76rem] text-slate-500">The user receives a link to set their password and get started.</span></span>
            <input type="checkbox" name="send_invite" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} className="peer sr-only" />
            <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${sendInvite ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${sendInvite ? "left-[1.4rem]" : "left-0.5"}`} /></span>
          </label>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <a href="/cms/admin/users" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
          <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Save Changes" : "Create User"}</button>
        </div>
      </section>
    </form>
  );
}
