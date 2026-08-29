/**
 * Settings overview (PRD 3, 15). The hub for the shell's own screens: People & Access (§3.2), Roles,
 * the one platform Audit Log (§3.4), the Company profile (§15), and NRS e-Invoicing readiness (§15).
 * Admin only. Each card carries a live figure and links into its area. Nothing here is a second copy
 * of module data - people live in HR, access lives in the one access table.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { UsersRound, ShieldCheck, FileClock, Building2, ReceiptText, Mail, ArrowRight } from "lucide-react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { emailConfigured } from "../../../lib/email.js";

export const dynamic = "force-dynamic";

export default async function SettingsOverview(): Promise<ReactNode> {
  await requireAdmin();
  const pool = db();
  const { rows } = await pool.query<{ active_users: string; grants: string; open_resets: string; audit_today: string; nrs_enabled: boolean; nrs_env: string }>(
    `SELECT (SELECT count(*) FROM staff WHERE active)::text active_users,
            (SELECT count(*) FROM module_access)::text grants,
            (SELECT count(*) FROM password_reset_request WHERE status='open')::text open_resets,
            (SELECT count(*) FROM audit_log WHERE created_at::date = current_date)::text audit_today,
            (SELECT nrs_enabled FROM company_settings WHERE id=true) nrs_enabled,
            (SELECT nrs_environment FROM company_settings WHERE id=true) nrs_env`);
  const s = rows[0]!;
  // Whether mail actually goes out, not whether a form was filled in. The old CMS Email tab could be
  // completed in full while nothing was ever sent, so the hub says which of the two is true.
  const emailReady = await emailConfigured();

  const cards = [
    { href: "/settings/access", icon: UsersRound, title: "People & Access", desc: "Grant module access and roles. The one place access is decided.", stat: `${s.active_users} active`, sub: `${s.grants} module grants` },
    { href: "/settings/roles", icon: ShieldCheck, title: "Roles & Permissions", desc: "The platform's fixed role model and what each role can do per module.", stat: "4 modules", sub: "Read-only matrix" },
    { href: "/audit", icon: FileClock, title: "Audit", desc: "The one immutable record of who did what, across every module.", stat: `${s.audit_today} today`, sub: "Platform-wide" },
    { href: "/settings/company", icon: Building2, title: "Company", desc: "Legal profile, registration, contact, fiscal calendar, and notifications.", stat: "Nexoris Technologies", sub: "Single record" },
    { href: "/settings/email", icon: Mail, title: "Email Delivery", desc: "How invitations and password resets reach people, for every module.", stat: emailReady ? "Configured" : "Not sending", sub: emailReady ? "Mailjet over HTTPS" : "Links must be shared by hand" },
    { href: "/e-invoicing", icon: ReceiptText, title: "NRS e-Invoicing", desc: "Readiness for the Nigeria Revenue Service e-invoicing system.", stat: s.nrs_enabled ? "Enabled" : "Not live", sub: `${s.nrs_env} environment` },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Settings</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Access, roles, audit, company profile, and NRS e-invoicing.</p>

      {/* Neutral, and not amber. This said "awaiting action" and coloured itself like a problem, for
          requests that need no action at all: resets are self-service and the link is emailed to the
          person. An admin reading a warning about work that does not exist eventually stops reading
          the warnings that do. */}
      {Number(s.open_resets) > 0 ? (
        <Link href="/settings/access" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#543CDA]/40">
          <span className="text-[0.85rem] font-600 text-slate-700">{s.open_resets} recent password reset request{s.open_resets === "1" ? "" : "s"}</span>
          <ArrowRight size={16} className="text-slate-500" />
        </Link>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle hover:border-[#543CDA]/40 hover:shadow-md">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EEEBFC] text-[#543CDA]"><c.icon size={20} strokeWidth={2} /></span>
            <h2 className="mt-3 text-[0.98rem] font-700 text-slate-900">{c.title}</h2>
            <p className="mt-1 flex-1 text-[0.8rem] text-slate-500">{c.desc}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span><span className="block text-[0.85rem] font-700 text-slate-900">{c.stat}</span><span className="block text-[0.72rem] text-slate-500">{c.sub}</span></span>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-[#543CDA]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
