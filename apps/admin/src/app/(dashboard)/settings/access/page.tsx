/**
 * People & Access (PRD 3.2): the one screen where module access and role are granted, read by every
 * module's permission check. Admin only. It opens with the access dashboard - active users, the role
 * summary, pending password-reset requests, recent access activity, and security alerts - then the
 * per-person grant/revoke controls. People are created in HR (§3.1), never here, so there is no
 * add-person form: onboarding is HR's job and this screen only decides access.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { KeyRound, ShieldAlert, UsersRound, X } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { deactivateStaff } from "../../../../lib/people-actions.js";
import { MODULE_LABEL, type ModuleId } from "../../../../lib/shell-constants.js";
import { shareOrigin, inviteLink } from "../../../../lib/invite.js";
import { CopyLink } from "./CopyLink.js";
import { GrantAccess } from "./GrantAccess.js";
import { InviteUser } from "./InviteUser.js";
import { ResetPassword } from "./ResetPassword.js";

export const dynamic = "force-dynamic";

interface StaffRow {
  id: string; name: string; email: string; role: string; active: boolean;
  account_status: string | null;
  /** Present only while an invitation is outstanding; cleared the moment the person sets a password. */
  invite_token: string | null;
  invite_expired: boolean;
  grants: { module: string; role: string }[] | null;
}
interface ResetRow { id: string; email: string; staff_id: string | null; staff_name: string | null; requested_at: string }
interface ActivityRow { id: string; action: string; actor: string | null; created_at: string; after: unknown }

const ACCESS_LABEL: Record<string, string> = {
  "grant-access": "Access granted", "revoke-access": "Access revoked", create: "User created",
  deactivate: "User deactivated", "reset-password": "Password reset", "reissue-invite": "Invitation link reissued",
};

interface InvitableRow { id: string; full_name: string; email: string | null }

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ invited?: string; granted?: string; error?: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const notice = await searchParams;
  const pool = db();
  const [{ rows: staff }, { rows: resets }, { rows: activity }, { rows: agg }, { rows: invitable }] = await Promise.all([
    pool.query<StaffRow>(
      `SELECT s.id, s.name, s.email, s.role, s.active, s.account_status, s.invite_token,
              (s.invite_expires IS NOT NULL AND s.invite_expires < now()) AS invite_expired,
              coalesce((SELECT json_agg(json_build_object('module', ma.module, 'role', ma.role) ORDER BY ma.module)
                          FROM module_access ma WHERE ma.staff_id = s.id), '[]') AS grants
         FROM staff s ORDER BY s.active DESC, s.name`),
    pool.query<ResetRow>(
      `SELECT r.id::text, r.email, r.staff_id, s.name AS staff_name, r.requested_at::text
         FROM password_reset_request r LEFT JOIN staff s ON s.id = r.staff_id
        WHERE r.status = 'open' ORDER BY r.requested_at DESC`),
    pool.query<ActivityRow>(
      `SELECT a.id::text, a.action, s.name actor, a.created_at::text, a.after
         FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id
        WHERE a.action IN ('grant-access','revoke-access','create','deactivate','reset-password')
        ORDER BY a.created_at DESC LIMIT 6`),
    pool.query<{ active_users: string; exited: string; admins: string; grants: string }>(
      `SELECT count(*) FILTER (WHERE active)::text active_users,
              count(*) FILTER (WHERE NOT active)::text exited,
              count(*) FILTER (WHERE role='admin' AND active)::text admins,
              (SELECT count(*) FROM module_access)::text grants FROM staff`),
    // People onboarded in HR who have no login account yet — these are the ones to invite.
    pool.query<InvitableRow>(
      `SELECT e.id::text, e.full_name, COALESCE(e.work_email, e.personal_email) AS email
         FROM employee e
        WHERE e.staff_id IS NULL
          AND COALESCE(e.work_email, e.personal_email) IS NOT NULL
          AND lower(COALESCE(e.work_email, e.personal_email)) NOT IN (SELECT lower(email) FROM staff)
        ORDER BY e.full_name`),
  ]);
  const a = agg[0]!;
  const origin = await shareOrigin();
  // The person just invited, so their link can be surfaced at the top rather than hunted for in the list.
  const justInvited = notice.invited ? staff.find((p) => p.id === notice.invited) : undefined;
  const noAccess = staff.filter((p) => p.active && (p.grants ?? []).length === 0).length;
  const invitableEmployees = invitable.map((e) => ({ id: e.id, name: e.full_name, email: e.email ?? "" }));

  const kpis = [
    ["Active Users", a.active_users], ["Admins", a.admins], ["Module Grants", a.grants], ["Exited", a.exited],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">People &amp; Access</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">The one place module access and role are granted. People are created in <Link href="/people/onboard" className="font-600 text-[#543CDA]">HR onboarding</Link>; invite them here to give them a login.</p>
        </div>
        <InviteUser employees={invitableEmployees} />
      </div>

      {justInvited?.invite_token ? (
        <section className="mt-4 rounded-2xl border border-[#543CDA]/30 bg-[#F6F4FE] p-4">
          <h2 className="text-[0.92rem] font-700 text-slate-900">Share this link with {justInvited.name}</h2>
          <p className="mt-0.5 text-[0.82rem] text-slate-600">They open it, set their own password, and sign in. The link works once and expires in 7 days.</p>
          <CopyLink link={inviteLink(origin, justInvited.invite_token)} />
        </section>
      ) : null}
      {notice.granted ? <p className="mt-4 rounded-lg bg-[#DCFCE7] px-3.5 py-2.5 text-[0.83rem] font-600 text-[#15803D]">Access granted.</p> : null}
      {notice.error === "reissue" ? <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.83rem] font-600 text-red-600">That account is already active, so it has no invitation to reissue. The person signs in with their own password.</p>
        : notice.error ? <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.83rem] font-600 text-red-600">That invitation could not be completed. Check the name and email and try again.</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle"><p className="text-[0.76rem] text-slate-500">{label}</p><p className="mt-1 text-[1.3rem] font-700 text-slate-900">{val}</p></div>
        ))}
      </div>

      {/* Security alerts */}
      {resets.length > 0 || noAccess > 0 || invitableEmployees.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 text-[0.9rem] font-700 text-amber-800"><ShieldAlert size={16} /> Security alerts</h2>
          <ul className="mt-2 space-y-1 text-[0.82rem] text-amber-800">
            {resets.length > 0 ? <li>{resets.length} open password reset request{resets.length === 1 ? "" : "s"} below.</li> : null}
            {noAccess > 0 ? <li>{noAccess} active user{noAccess === 1 ? "" : "s"} with no module access granted.</li> : null}
            {invitableEmployees.length > 0 ? <li>{invitableEmployees.length} employee{invitableEmployees.length === 1 ? "" : "s"} onboarded in HR without a login. Use <span className="font-700">Invite user</span> above.</li> : null}
          </ul>
        </section>
      ) : null}

      {/* Password reset requests */}
      {resets.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><KeyRound size={17} className="text-[#543CDA]" /> Password reset requests <span className="rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.72rem] font-600 text-[#543CDA]">{resets.length}</span></h2>
          <ul className="mt-3 flex flex-col gap-2">
            {resets.map((req) => (
              <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-3.5 py-2.5">
                <span className="text-[0.85rem] text-slate-800">{req.staff_name ?? req.email}{req.staff_name ? <span className="text-slate-500"> · {req.email}</span> : null}</span>
                {req.staff_id ? <ResetPassword requestId={req.id} staffId={req.staff_id} /> : <span className="text-[0.78rem] text-slate-500">No matching account</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Users + access */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <h2 className="flex items-center gap-2 px-5 pt-5 text-[0.95rem] font-700 text-slate-900"><UsersRound size={17} className="text-[#543CDA]" /> Users</h2>
        <div className="mt-3 flex flex-col divide-y divide-slate-100">
          {staff.map((person) => (
            <div key={person.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.9rem] font-600 text-slate-900">{person.name}</span>
                  {person.account_status === "invited"
                    ? <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[0.66rem] font-600 uppercase tracking-wide text-[#B45309]">Invited</span>
                    : <span className={`rounded-full px-2 py-0.5 text-[0.66rem] font-600 uppercase tracking-wide ${person.active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{person.active ? "Active" : "Exited"}</span>}
                  {person.role === "admin" ? <span className="rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.66rem] font-600 uppercase tracking-wide text-[#543CDA]">Admin</span> : null}
                </span>
                <span className="block text-[0.78rem] text-slate-500">{person.email}</span>
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  {(person.grants ?? []).length === 0 ? <span className="text-[0.76rem] text-slate-500">No module access granted</span> : (person.grants ?? []).map((grant) => (
                    <span key={grant.module} className="inline-flex items-center gap-1 rounded-full bg-[#EEEBFC] py-0.5 pl-2.5 pr-1 text-[0.72rem] font-600 text-[#543CDA]">
                      {MODULE_LABEL[grant.module as ModuleId] ?? grant.module}: {grant.role}
                      <form action="/api/access" method="post" className="inline-flex"><input type="hidden" name="action" value="revoke" /><input type="hidden" name="staffId" value={person.id} /><input type="hidden" name="module" value={grant.module} /><button type="submit" aria-label={`Revoke ${grant.module} access`} className="grid h-4 w-4 cursor-pointer place-items-center rounded-full text-[#543CDA] hover:bg-purple-200"><X size={11} strokeWidth={2.4} /></button></form>
                    </span>
                  ))}
                </span>
                {person.account_status === "invited" ? (
                  <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
                    {person.invite_token && !person.invite_expired ? (
                      <>
                        <p className="text-[0.76rem] text-amber-900">Waiting for {person.name.split(" ")[0]} to set a password. Share this link.</p>
                        <CopyLink link={inviteLink(origin, person.invite_token)} />
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[0.76rem] text-amber-900">{person.invite_expired ? "This invitation link has expired." : "No invitation link is active for this account."}</p>
                        <form action="/api/access" method="post">
                          <input type="hidden" name="action" value="reissue" />
                          <input type="hidden" name="staffId" value={person.id} />
                          <button type="submit" className="cursor-pointer rounded-lg bg-[#543CDA] px-3 py-1.5 text-[0.78rem] font-600 text-white hover:bg-[#4330B8]">Create a new link</button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {person.active ? <GrantAccess staffId={person.id} /> : null}
                {person.active && person.role !== "admin" ? (
                  <form action={deactivateStaff}><input type="hidden" name="staffId" value={person.id} /><button type="submit" className="cursor-pointer text-[0.78rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Deactivate</button></form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent access activity */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Recent access activity</h2><Link href="/audit" className="text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Full audit</Link></div>
        {activity.length === 0 ? <p className="mt-2 text-[0.82rem] text-slate-500">No access changes recorded yet.</p> : (
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {activity.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[0.83rem] text-slate-700"><span className="font-600 text-slate-900">{ACCESS_LABEL[row.action] ?? row.action}</span>{(row.after as Record<string, unknown>)?.module ? ` · ${(row.after as Record<string, unknown>).module}` : ""}</span>
                <span className="shrink-0 text-[0.76rem] text-slate-500">{row.actor ?? "System"} · {new Date(row.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
