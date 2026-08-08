/**
 * User Profile (CMS Administration design). A banner header with the user's identity and status, key
 * facts (role, department, email, last login, MFA), and an inline edit form (name, role, department,
 * status) that saves via /api/cms/users. Reads the real user from the admin database. CMS access only.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Briefcase, ShieldCheck, Clock } from "lucide-react";
import { requireCmsAccess } from "../../../../../../lib/auth.js";
import { db } from "../../../../../../lib/db.js";
import { shareOrigin, inviteLink } from "../../../../../../lib/invite.js";
import { CopyLink } from "../../../../../(dashboard)/settings/access/CopyLink.js";
import { UserForm } from "../UserForm.js";

export const dynamic = "force-dynamic";

interface Row { id: string; name: string; email: string; role: string; cms_role: string | null; cms_department: string | null; account_status: string; last_login: string | null; mfa_enabled: boolean; invite_token: string | null; invite_expired: boolean }
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "#DCFCE7", fg: "#16A34A", label: "Active" }, invited: { bg: "#DBEAFE", fg: "#2563EB", label: "Invited" }, suspended: { bg: "#FEE2E2", fg: "#DC2626", label: "Suspended" },
};

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { rows } = await db().query<Row>(
    `SELECT s.id, s.name, s.email, s.role, ma.role AS cms_role, s.cms_department, s.account_status, s.last_login::text, s.mfa_enabled,
            s.invite_token, (s.invite_expires IS NOT NULL AND s.invite_expires < now()) AS invite_expired
       FROM staff s LEFT JOIN module_access ma ON ma.staff_id=s.id AND ma.module='cms' WHERE s.id=$1`, [id]);
  const u = rows[0];
  if (!u) notFound();
  const origin = await shareOrigin();
  const st = STATUS[u.account_status] ?? STATUS.active!;
  const displayRole = u.role === "admin" ? "Super Admin" : (u.cms_role ?? "Member");
  const [first, ...rest] = u.name.split(/\s+/);
  const initials = u.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const lastLogin = u.last_login ? new Date(u.last_login).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Never";

  return (
    <div>
      <Link href="/cms/admin/users" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Users</Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="h-20 bg-gradient-to-r from-[#543CDA] to-[#6A55F2]" />
        <div className="px-6 pb-6">
          <div className="-mt-8 flex flex-wrap items-end gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#543CDA] to-[#6A55F2] font-mono text-[1rem] font-700 text-white shadow">{initials}</span>
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-[1.25rem] font-700 text-slate-900">{u.name}</h1><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: st.bg, color: st.fg }}>{st.label}</span></div>
              <p className="mt-0.5 text-[0.82rem] text-slate-500">{displayRole}{u.cms_department ? ` · ${u.cms_department}` : ""}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-[0.82rem] text-slate-600"><Mail size={15} className="shrink-0 text-slate-500" /><span className="truncate">{u.email}</span></div>
            <div className="flex items-center gap-2 text-[0.82rem] text-slate-600"><Briefcase size={15} className="shrink-0 text-slate-500" />{u.cms_department ?? "—"}</div>
            <div className="flex items-center gap-2 text-[0.82rem] text-slate-600"><Clock size={15} className="shrink-0 text-slate-500" />Last login {lastLogin}</div>
            <div className="flex items-center gap-2 text-[0.82rem] text-slate-600"><ShieldCheck size={15} className={u.mfa_enabled ? "text-[#15803D]" : "text-slate-300"} />MFA {u.mfa_enabled ? "enabled" : "off"}</div>
          </div>
        </div>
      </div>

      {u.account_status === "invited" && u.invite_token && !u.invite_expired ? (
        <section className="mt-4 rounded-2xl border border-[#543CDA]/30 bg-[#F6F4FE] p-4">
          <h2 className="text-[0.92rem] font-700 text-slate-900">Share this link with {first}</h2>
          <p className="mt-0.5 text-[0.82rem] text-slate-600">They open it, set their own password, and sign in to the CMS. The link works once and expires in 7 days.</p>
          <CopyLink link={inviteLink(origin, u.invite_token)} />
        </section>
      ) : null}

      <h2 className="mt-6 text-[1rem] font-700 text-slate-900">Edit User</h2>
      <div className="mt-3">
        <UserForm initial={{ id: u.id, firstName: first ?? "", lastName: rest.join(" "), email: u.email, role: displayRole, department: u.cms_department ?? "Content", status: u.account_status }} />
      </div>
    </div>
  );
}
