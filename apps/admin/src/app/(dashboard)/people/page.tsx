/**
 * People & Access (PRD 3.2): the one screen where module access and role are granted, read by every
 * module's permission check. Admin-only. Shows each person, their per-module grants (with revoke),
 * and a grant control; the open password-reset requests to resolve; and the add-person form. When
 * HR lands, person creation moves there and this screen keeps only the access grants.
 */
import type { ReactNode } from "react";
import { KeyRound, UserPlus, X } from "lucide-react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { deactivateStaff } from "../../../lib/people-actions.js";
import { revokeModuleAccess } from "../../../lib/shell-actions.js";
import { MODULE_LABEL, type ModuleId } from "../../../lib/shell-constants.js";
import { AddStaffForm } from "./AddStaffForm.js";
import { GrantAccess } from "./GrantAccess.js";
import { ResetPassword } from "./ResetPassword.js";

export const dynamic = "force-dynamic";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  open_count: string;
  grants: { module: string; role: string }[] | null;
}

interface ResetRow {
  id: string;
  email: string;
  staff_id: string | null;
  staff_name: string | null;
  requested_at: string;
}

const CARD = "rounded-card border border-purple-200 bg-white shadow-subtle";

export default async function PeoplePage(): Promise<ReactNode> {
  await requireAdmin();
  const pool = db();

  const [{ rows: staff }, { rows: resets }] = await Promise.all([
    pool.query<StaffRow>(
      `SELECT s.id, s.name, s.email, s.role, s.active,
              count(l.id) FILTER (WHERE l.status NOT IN ('Won','Lost'))::text AS open_count,
              coalesce(
                (SELECT json_agg(json_build_object('module', ma.module, 'role', ma.role) ORDER BY ma.module)
                   FROM module_access ma WHERE ma.staff_id = s.id), '[]'
              ) AS grants
         FROM staff s LEFT JOIN lead l ON l.assigned_to = s.id
        GROUP BY s.id ORDER BY s.active DESC, s.name`,
    ),
    pool.query<ResetRow>(
      `SELECT r.id::text, r.email, r.staff_id, s.name AS staff_name, r.requested_at::text
         FROM password_reset_request r LEFT JOIN staff s ON s.id = r.staff_id
        WHERE r.status = 'open' ORDER BY r.requested_at DESC`,
    ),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-roboto text-[1.7rem] font-700 leading-tight text-ink-950">
        People &amp; Access
      </h1>
      <p className="mt-1 text-[0.95rem] text-neutral-600">
        The one place module access and role are granted. Deactivating preserves history and returns
        open leads to the queue.
      </p>

      {/* Password reset requests */}
      {resets.length > 0 ? (
        <section className={`mt-6 ${CARD} p-5`}>
          <h2 className="flex items-center gap-2 text-[1.05rem] font-700 text-ink-950">
            <KeyRound size={17} strokeWidth={2} className="text-purple-600" />
            Password reset requests
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[0.72rem] font-600 text-purple-700">
              {resets.length}
            </span>
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {resets.map((req) => (
              <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-purple-200/60 px-3.5 py-2.5">
                <span className="text-[0.88rem] text-ink-950">
                  {req.staff_name ?? req.email}
                  {req.staff_name ? <span className="text-neutral-600"> · {req.email}</span> : null}
                </span>
                {req.staff_id ? (
                  <ResetPassword requestId={req.id} staffId={req.staff_id} />
                ) : (
                  <span className="text-[0.78rem] text-neutral-600">No matching account</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* People + access */}
      <section className={`mt-6 ${CARD}`}>
        <h2 className="px-5 pt-5 text-[1.05rem] font-700 text-ink-950">People</h2>
        <div className="mt-3 flex flex-col divide-y divide-purple-200/60">
          {staff.map((person) => (
            <div key={person.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.95rem] font-600 text-ink-950">{person.name}</span>
                  {person.active ? (
                    <span className="rounded-full bg-[#E4F5EE] px-2 py-0.5 text-[0.66rem] font-600 uppercase tracking-wide text-[#0E7A5B]">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.66rem] font-600 uppercase tracking-wide text-neutral-600">
                      Exited
                    </span>
                  )}
                </span>
                <span className="block text-[0.78rem] text-neutral-600">
                  {person.email} · {person.open_count} open lead{person.open_count === "1" ? "" : "s"}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  {(person.grants ?? []).length === 0 ? (
                    <span className="text-[0.76rem] text-neutral-600">No module access granted</span>
                  ) : (
                    (person.grants ?? []).map((grant) => (
                      <span
                        key={grant.module}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-100 py-0.5 pl-2.5 pr-1 text-[0.72rem] font-600 text-purple-700"
                      >
                        {MODULE_LABEL[grant.module as ModuleId] ?? grant.module}: {grant.role}
                        <form action={revokeModuleAccess} className="inline-flex">
                          <input type="hidden" name="staffId" value={person.id} />
                          <input type="hidden" name="module" value={grant.module} />
                          <button
                            type="submit"
                            aria-label={`Revoke ${grant.module} access`}
                            className="grid h-4 w-4 cursor-pointer place-items-center rounded-full text-purple-700 hover:bg-purple-200"
                          >
                            <X size={11} strokeWidth={2.4} />
                          </button>
                        </form>
                      </span>
                    ))
                  )}
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {person.active ? <GrantAccess staffId={person.id} /> : null}
                {person.active && person.role !== "admin" ? (
                  <form action={deactivateStaff}>
                    <input type="hidden" name="staffId" value={person.id} />
                    <button
                      type="submit"
                      className="cursor-pointer text-[0.78rem] font-600 text-purple-700 hover:text-purple-600"
                    >
                      Deactivate
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`mt-6 ${CARD} p-5`}>
        <h2 className="flex items-center gap-2 text-[1.05rem] font-700 text-ink-950">
          <UserPlus size={17} strokeWidth={2} className="text-purple-600" />
          Add a person
        </h2>
        <p className="mt-1 text-[0.8rem] text-neutral-600">
          Sets the platform role and, for a salesperson, their CRM capacity and industries. When HR
          lands, people are created there and this form retires.
        </p>
        <div className="mt-4">
          <AddStaffForm />
        </div>
      </section>
    </div>
  );
}
