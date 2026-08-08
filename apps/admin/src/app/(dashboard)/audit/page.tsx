/**
 * The Audit Log (PRD 3.4): the one immutable, platform-wide record of who did what, when, with the
 * before and after. Admin only. Views scope the same one table - never a separate log per module: All,
 * Access changes, and Data changes. Each module's "view audit log" is a scoped read of this table.
 * Append-only by policy; export is read-only.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { FileClock, Download } from "lucide-react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

interface AuditRow { id: string; action: string; entity: string; before: unknown; after: unknown; actor: string | null; created_at: string }

const ACTION_LABEL: Record<string, string> = {
  "stage-change": "Stage change", assign: "Lead assigned", "auto-assign": "Lead auto-assigned",
  create: "Staff created", deactivate: "Staff deactivated", "grant-access": "Access granted",
  "revoke-access": "Access revoked", "update-settings": "Settings updated", "reset-password": "Password reset",
  "follow-up-sent": "Follow-up sent", "invoice-raised": "Invoice raised", "invoice-payment": "Invoice payment",
  "invoice-send": "Invoice sent", "invoice-void": "Invoice voided", "expense-recorded": "Expense recorded",
  "payroll-generate": "Payroll generated", "payroll-post-finance": "Payroll posted", offboard: "Employee offboarded",
};
const VIEWS = [["All", ""], ["Access", "access"], ["Data changes", "data"]] as const;

function summarise(row: AuditRow): string {
  const after = (row.after ?? {}) as Record<string, unknown>;
  const before = (row.before ?? {}) as Record<string, unknown>;
  switch (row.action) {
    case "stage-change": return `${before.status ?? "?"} → ${after.status ?? "?"}`;
    case "grant-access": return `${after.module ?? ""} · ${after.role ?? ""}`;
    case "revoke-access": return `${after.module ?? before.module ?? ""}`;
    case "invoice-raised": return `${after.client ?? ""} · ₦${Number(after.total ?? 0).toLocaleString("en-NG")}`;
    case "invoice-payment": return `₦${Number(after.amount ?? 0).toLocaleString("en-NG")} · ${after.status ?? ""}`;
    default: return row.entity;
  }
}

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ view?: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { view } = await searchParams;
  const v = view === "access" || view === "data" ? view : "";
  const where = v === "access"
    ? "a.action IN ('grant-access','revoke-access','create','deactivate','reset-password','update-settings')"
    : v === "data" ? "a.action NOT IN ('grant-access','revoke-access','create','deactivate','reset-password','update-settings')" : "";

  const [{ rows }, { rows: stat }] = await Promise.all([
    db().query<AuditRow>(
      `SELECT a.id::text, a.action, a.entity, a.before, a.after, s.name AS actor, a.created_at::text
         FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id ${where ? `WHERE ${where}` : ""}
        ORDER BY a.created_at DESC LIMIT 200`),
    db().query<{ total: string; today: string; access: string }>(
      `SELECT count(*)::text total, count(*) FILTER (WHERE created_at::date=current_date)::text today,
              count(*) FILTER (WHERE action IN ('grant-access','revoke-access','create','deactivate','reset-password','update-settings'))::text access FROM audit_log`),
  ]);
  const st = stat[0]!;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Audit</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Every change across the platform — immutable: who, what, and when.</p>
        </div>
        <a href="/api/audit/export" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.83rem] font-600 text-slate-700 hover:bg-slate-50"><Download size={15} /> Export CSV</a>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-lg">
        {[["Total entries", st.total], ["Today", st.today], ["Access changes", st.access]].map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle"><p className="text-[0.74rem] text-slate-500">{label}</p><p className="mt-1 text-[1.2rem] font-700 text-slate-900">{val}</p></div>
        ))}
      </div>

      <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        {VIEWS.map(([label, val]) => {
          const active = (val === "" && !v) || val === v;
          return <Link key={label} href={val ? `/audit?view=${val}` : "/audit"} className={`rounded-md px-3.5 py-1.5 text-[0.8rem] font-600 ${active ? "bg-[#543CDA] text-white" : "text-slate-600 hover:bg-slate-50"}`}>{label}</Link>;
        })}
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center"><FileClock size={26} strokeWidth={1.8} className="text-[#543CDA]" /><p className="text-[0.88rem] text-slate-500">No matching audit entries.</p></div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <table className="w-full min-w-[620px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">When</th><th className="px-4 py-3 font-600">Action</th><th className="px-4 py-3 font-600">Detail</th><th className="px-4 py-3 font-600">By</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="whitespace-nowrap px-5 py-3 text-[0.8rem] text-slate-500">{new Date(row.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-[#EEEBFC] px-2.5 py-0.5 text-[0.74rem] font-600 text-[#543CDA]">{ACTION_LABEL[row.action] ?? row.action}</span></td>
                  <td className="px-4 py-3 text-[0.84rem] text-slate-800">{summarise(row)}</td>
                  <td className="px-4 py-3 text-[0.84rem] text-slate-500">{row.actor ?? "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
