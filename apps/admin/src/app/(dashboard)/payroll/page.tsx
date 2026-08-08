/**
 * Payroll Overview (PRD 8.12). Payroll summary, the upcoming run, payroll cost,
 * pending approvals, and recent runs, plus the compliance reminder (8.8). Reads salary live from HR;
 * stores no copy of it. Payroll Admin.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Wallet, Users2, Landmark, Clock, CalendarClock, ChevronRight, AlertTriangle } from "lucide-react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Reviewed: "bg-[#DBEAFE] text-[#1D4ED8]",
  Approved: "bg-[#EEEBFC] text-[#543CDA]",
  Disbursed: "bg-[#DCFCE7] text-[#15803D]",
  Closed: "bg-slate-100 text-slate-600",
};

function naira(v: string | number): string {
  return `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function PayrollDashboard(): Promise<ReactNode> {
  await requireAdmin();
  const pool = db();
  const [{ rows: emp }, { rows: last }, { rows: pend }, { rows: runs }, { rows: cfg }] = await Promise.all([
    pool.query<{ c: number }>("SELECT count(*)::int c FROM employee WHERE employment_status <> 'Exited'"),
    pool.query<{ net: string; gross: string; employer_cost: string; period: string }>("SELECT net::text, gross::text, employer_cost::text, period FROM pay_run WHERE status='Disbursed' ORDER BY disbursed_at DESC LIMIT 1"),
    pool.query<{ c: number }>("SELECT count(*)::int c FROM pay_run WHERE status IN ('Draft','Reviewed','Approved')"),
    pool.query<{ id: string; period: string; run_type: string; status: string; employee_count: number; net: string; created_at: string }>(
      "SELECT id, period, run_type, status, employee_count, net::text, created_at FROM pay_run ORDER BY created_at DESC LIMIT 6",
    ),
    pool.query<{ pay_day: number; tax_table_effective: string; tax_table_verified: string | null }>("SELECT pay_day, tax_table_effective::text, tax_table_verified::text FROM payroll_settings WHERE id=true"),
  ]);
  const l = last[0];
  const c = cfg[0]!;
  const now = new Date();
  const nextRun = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > c.pay_day ? 1 : 0), c.pay_day);

  const cards = [
    { label: "Active Workers", value: String(emp[0]!.c), icon: <Users2 size={16} strokeWidth={2} />, tint: "bg-[#EEEBFC] text-[#543CDA]" },
    { label: "Last Net Pay", value: l ? naira(l.net) : "—", icon: <Wallet size={16} strokeWidth={2} />, tint: "bg-[#DCFCE7] text-[#15803D]" },
    { label: "Employer Cost", value: l ? naira(l.employer_cost) : "—", icon: <Landmark size={16} strokeWidth={2} />, tint: "bg-[#FEF3C7] text-[#B45309]" },
    { label: "Pending Approvals", value: String(pend[0]!.c), icon: <Clock size={16} strokeWidth={2} />, tint: "bg-[#DBEAFE] text-[#2563EB]" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Payroll</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Runs the pay cycle. Salary is read live from HR on every run.</p>
        </div>
        <Link href="/payroll/runs" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]"><Wallet size={15} strokeWidth={2} /> Run Payroll</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="flex items-start justify-between">
              <p className="text-[0.8rem] font-500 text-slate-500">{k.label}</p>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${k.tint}`}>{k.icon}</span>
            </div>
            <p className="mt-2 font-mono text-[1.4rem] font-700 leading-none text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Recent Payroll Runs</h2>
            <Link href="/payroll/runs" className="text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View all</Link>
          </div>
          {runs.length === 0 ? (
            <p className="px-5 py-8 text-[0.88rem] text-slate-500">No runs yet. Generate the first pay run to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead><tr className="border-b border-slate-100 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-2.5 font-600">Period</th><th className="px-5 py-2.5 font-600">Type</th><th className="px-5 py-2.5 font-600">Workers</th><th className="px-5 py-2.5 font-600">Net</th><th className="px-5 py-2.5 font-600">Status</th></tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3"><Link href={`/payroll/runs/${r.id}`} className="text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.period}</Link></td>
                      <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.run_type}</td>
                      <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-700">{r.employee_count}</td>
                      <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-900">{naira(r.net)}</td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${STATUS[r.status]}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Upcoming Payroll</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEEBFC] text-[#543CDA]"><CalendarClock size={18} strokeWidth={2} /></span>
              <div>
                <p className="text-[0.9rem] font-700 text-slate-900">{nextRun.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="text-[0.78rem] text-slate-500">Pay day is the {c.pay_day}{c.pay_day === 1 ? "st" : "th"} of each month</p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-[#FEF3C7] bg-[#FFFBEB] p-5 shadow-subtle">
            <h2 className="flex items-center gap-2 text-[0.9rem] font-700 text-slate-900"><AlertTriangle size={15} strokeWidth={2} className="text-[#B45309]" /> Compliance</h2>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-slate-600">PAYE band table effective {new Date(c.tax_table_effective).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} (Nigeria Tax Act 2025). {c.tax_table_verified ? `Verified ${c.tax_table_verified}.` : "Verify against official NRS guidance before the first live run."}</p>
            <Link href="/payroll/remittances" className="mt-2 inline-flex items-center gap-1 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Compliance calendar <ChevronRight size={13} strokeWidth={2.2} /></Link>
          </section>
        </div>
      </div>
    </div>
  );
}
