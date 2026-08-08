/**
 * Users List (CMS Administration). Everyone who can reach the CMS, their granted role, department,
 * account status, last sign-in, and whether they have MFA.
 *
 * The row's actions are real links into the user's record. They used to be a "…" button with no
 * handler, so a user could be listed and never opened.
 *
 * MFA is shown because the column exists on the staff row, but nothing enrols anyone yet: there is no
 * MFA flow in the platform, so this reports the stored flag rather than implying a working feature.
 *
 * CMS access only. Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";
import { RecordActions } from "../../../../../components/cms/RecordActions.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  name: string;
  email: string;
  cms_department: string | null;
  account_status: string;
  last_login: string | null;
  mfa_enabled: boolean;
  cms_role: string;
}

const AVATAR = ["#543CDA", "#14B8A6", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444"];
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "#DCFCE7", fg: "#16A34A", label: "Active" },
  invited: { bg: "#DBEAFE", fg: "#2563EB", label: "Invited" },
  suspended: { bg: "#FEE2E2", fg: "#DC2626", label: "Suspended" },
};
const ROLE_TINT: Record<string, { bg: string; fg: string }> = {
  "Super Admin": { bg: "#EDE9FE", fg: "#6D28D9" },
  "CMS Admin": { bg: "#EEEBFC", fg: "#543CDA" },
  Editor: { bg: "#DBEAFE", fg: "#2563EB" },
  "Content Writer": { bg: "#DCFCE7", fg: "#16A34A" },
  "Fact-Checker": { bg: "#FEF3C7", fg: "#B45309" },
};

/** How long ago someone last signed in, which is what "last login" is actually asking. */
function ago(iso: string | null): string {
  if (!iso) return "Never";
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CmsUsersPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = db();
  // A platform admin reaches the CMS implicitly; everyone else needs the grant.
  const scope = "(s.role='admin' OR ma.staff_id IS NOT NULL)";

  const [{ rows }, { rows: [totals] }] = await Promise.all([
    pool.query<Row>(
      `SELECT s.id, s.name, s.email, s.cms_department, s.account_status, s.last_login::text, s.mfa_enabled,
              CASE WHEN s.role='admin' THEN 'Super Admin' ELSE COALESCE(ma.role, 'Member') END AS cms_role
         FROM staff s LEFT JOIN module_access ma ON ma.staff_id=s.id AND ma.module='cms'
        WHERE ${scope} ORDER BY s.created_at LIMIT 50`),
    pool.query<{ total: string; active: string; invited: string; suspended: string }>(
      `SELECT count(*)::text total,
              count(*) FILTER (WHERE s.account_status='active')::text active,
              count(*) FILTER (WHERE s.account_status='invited')::text invited,
              count(*) FILTER (WHERE s.account_status='suspended')::text suspended
         FROM staff s LEFT JOIN module_access ma ON ma.staff_id=s.id AND ma.module='cms' WHERE ${scope}`),
  ]);

  const kpis = [
    { label: "Total Users", value: totals?.total ?? "0", tint: "#EEEBFC", fg: "#543CDA" },
    { label: "Active Users", value: totals?.active ?? "0", tint: "#DCFCE7", fg: "#16A34A" },
    { label: "Invited", value: totals?.invited ?? "0", tint: "#EEEBFC", fg: "#543CDA" },
    { label: "Suspended", value: totals?.suspended ?? "0", tint: "#FEE2E2", fg: "#DC2626" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Users</h1>
          <p className="mt-1 text-[0.86rem] text-slate-600">Manage all users, their roles, and account status.</p>
        </div>
        <Link href="/cms/admin/users/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]">
          <Plus size={15} strokeWidth={2.4} /> New User
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <p className="text-[1.6rem] font-700 text-slate-900">{k.value}</p>
            <p className="text-[0.78rem] font-600" style={{ color: k.fg }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-600">User</th>
                <th className="px-5 py-3 font-600">Role</th>
                <th className="px-5 py-3 font-600">Department</th>
                <th className="px-5 py-3 font-600">Status</th>
                <th className="px-5 py-3 font-600">Last Login</th>
                <th className="px-5 py-3 font-600">MFA</th>
                <th className="px-5 py-3 text-right font-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const st = STATUS[r.account_status] ?? STATUS.active!;
                const tint = ROLE_TINT[r.cms_role] ?? { bg: "#F1F5F9", fg: "#64748B" };
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <Link href={`/cms/admin/users/${r.id}`} className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[0.64rem] font-700 text-white" style={{ background: AVATAR[i % AVATAR.length] }}>
                          {r.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.85rem] font-600 text-slate-900">{r.name}</span>
                          <span className="block truncate text-[0.74rem] text-slate-600">{r.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: tint.bg, color: tint.fg }}>{r.cms_role}</span></td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.cms_department ?? "—"}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-600">{ago(r.last_login)}</td>
                    <td className="px-5 py-3">
                      {r.mfa_enabled
                        ? <ShieldCheck size={17} className="text-[#15803D]" aria-label="MFA on" />
                        : <Minus size={17} className="text-slate-300" aria-label="MFA off" />}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {/* A CMS user is a staff record, not a CMS table, so the menu offers the two safe
                          actions and leaves removal to the access screen where the grants live. */}
                      <RecordActions entity="author" id={r.id} editHref={`/cms/admin/users/${r.id}`} label={r.name} back="/cms/admin/users" readOnly />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-600">
          <span>Showing 1 to {rows.length} of {totals?.total ?? 0} users</span>
        </div>
      </div>
    </div>
  );
}
