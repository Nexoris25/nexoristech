/**
 * Payroll - Statutory Remittances + compliance calendar (PRD 8.8, 8.10, 8.12).
 *
 * Every disbursed run creates a liability per authority. This aggregates the latest disbursed period and
 * then breaks it down per employee, because a remittance schedule is filed name by name: a PAYE return
 * lists each employee's tax, a pension schedule lists each contribution. A single total cannot be filed.
 *
 * Three things this screen is careful about:
 *
 *  1. **Who pays.** Employee deductions and employer costs are shown separately and never summed as
 *     though the employee bore them. NSITF and ITF are employer costs and appear on no payslip.
 *  2. **Exact amounts.** Figures are shown to the kobo. Remittances are paid to the exact amount
 *     withheld, so rounding to whole naira for display would misstate what is owed.
 *  3. **Derived from the immutable run lines**, never recomputed here, so this can never disagree with
 *     the payslips already issued.
 */
import type { ReactNode } from "react";
import { CalendarClock, Landmark, Users } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Agg {
  id: string; period: string; disbursed_at: string;
  paye: string; pension_employee: string; pension_employer: string; nhf: string; wht: string; ec: string; itf: string;
}
interface LineRow {
  employee_name: string; regime: string;
  gross: string; paye: string; pension_employee: string; nhf: string; wht: string;
  pension_employer: string; ec: string; itf: string;
}

const naira = (v: string | number): string =>
  `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** A dash rather than ₦0.00, so a dense schedule shows only what is actually owed. */
const cell = (v: string | number): string => (Number(v) === 0 ? "—" : naira(v));

const DEADLINES: { authority: string; item: string; due: string }[] = [
  { authority: "State IRS", item: "PAYE remittance", due: "10th of the following month" },
  { authority: "PenCom / PFA", item: "Pension (employee + employer)", due: "Within 7 working days of payday" },
  { authority: "FMBN", item: "NHF contribution", due: "By the last day of the following month" },
  { authority: "NRS", item: "Withholding tax", due: "21st of the following month" },
  { authority: "NSITF", item: "Employees' Compensation", due: "Within 30 days of payday" },
  { authority: "ITF", item: "Industrial Training Fund", due: "31 March, on the prior year's payroll" },
  { authority: "State IRS", item: "Annual employer return (Form H1)", due: "31 January each year" },
];

export default async function RemittancesPage(): Promise<ReactNode> {
  await requireAdmin();
  const pool = db();
  const { rows } = await pool.query<Agg>(
    `SELECT r.id, r.period, r.disbursed_at,
            sum(l.paye)::text paye, sum(l.pension_employee)::text pension_employee,
            sum(l.pension_employer)::text pension_employer, sum(l.nhf)::text nhf,
            sum(l.wht)::text wht, sum(l.ec)::text ec, sum(l.itf)::text itf
       FROM pay_run r JOIN pay_run_line l ON l.pay_run_id = r.id
      WHERE r.status = 'Disbursed'
      GROUP BY r.id, r.period, r.disbursed_at ORDER BY r.disbursed_at DESC LIMIT 1`);
  const a = rows[0];

  const { rows: lines } = a
    ? await pool.query<LineRow>(
      `SELECT employee_name, regime, gross::text, paye::text, pension_employee::text, nhf::text, wht::text,
              pension_employer::text, ec::text, itf::text
         FROM pay_run_line WHERE pay_run_id = $1 ORDER BY employee_name`, [a.id])
    : { rows: [] as LineRow[] };

  // paidBy drives the labelling: an employee never bears an employer cost, and the screen must not imply it.
  const liabilities = a ? [
    { authority: "State Internal Revenue Service", item: "PAYE", amount: Number(a.paye), paidBy: "employee" },
    { authority: "Pension Fund Administrator", item: "Pension (employee + employer)", amount: Number(a.pension_employee) + Number(a.pension_employer), paidBy: "both" },
    { authority: "Federal Mortgage Bank of Nigeria", item: "NHF", amount: Number(a.nhf), paidBy: "employee" },
    { authority: "Nigeria Revenue Service", item: "Withholding tax", amount: Number(a.wht), paidBy: "employee" },
    { authority: "Nigeria Social Insurance Trust Fund", item: "Employees' Compensation", amount: Number(a.ec), paidBy: "employer" },
    { authority: "Industrial Training Fund", item: "Industrial Training Fund", amount: Number(a.itf), paidBy: "employer" },
  ].filter((l) => l.amount > 0) : [];
  const total = liabilities.reduce((t, l) => t + l.amount, 0);
  const fromEmployees = Number(a?.paye ?? 0) + Number(a?.pension_employee ?? 0) + Number(a?.nhf ?? 0) + Number(a?.wht ?? 0);
  const fromEmployer = Number(a?.pension_employer ?? 0) + Number(a?.ec ?? 0) + Number(a?.itf ?? 0);

  const th = "px-3 py-2.5 font-600";
  const num = "px-3 py-3 text-right font-mono text-[0.8rem] tabular-nums";

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Statutory Remittances</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">What is owed to each authority for the latest disbursed run, employee by employee, and the filing calendar.</p>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><Landmark size={17} strokeWidth={2} className="text-[#543CDA]" /> Current liabilities</h2>
          {a ? <span className="text-[0.78rem] text-slate-500">{a.period}</span> : null}
        </div>
        {!a || liabilities.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.88rem] text-slate-500">No disbursed run yet. Remittances appear once payroll is disbursed.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className={th}>Authority</th><th className={th}>Item</th><th className={th}>Borne by</th><th className={`${th} text-right`}>Amount</th></tr></thead>
                <tbody>
                  {liabilities.map((l) => (
                    <tr key={l.item} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3 text-[0.85rem] font-600 text-slate-900">{l.authority}</td>
                      <td className="px-3 py-3 text-[0.83rem] text-slate-600">{l.item}</td>
                      <td className="px-3 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.68rem] font-600 uppercase tracking-wide ${l.paidBy === "employer" ? "bg-[#FEF3C7] text-[#B45309]" : l.paidBy === "both" ? "bg-[#EEEBFC] text-[#543CDA]" : "bg-slate-100 text-slate-600"}`}>
                          {l.paidBy === "employer" ? "Employer" : l.paidBy === "both" ? "Both" : "Employee"}
                        </span>
                      </td>
                      <td className={`${num} text-slate-900`}>{naira(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-[#F4F1FD]"><td className="px-3 py-3 text-[0.85rem] font-700 text-slate-900" colSpan={3}>Total to remit</td><td className={`${num} text-[0.9rem] font-700 text-[#543CDA]`}>{naira(total)}</td></tr></tfoot>
              </table>
            </div>
            <div className="grid grid-cols-1 gap-2 border-t border-slate-100 px-5 py-3.5 sm:grid-cols-2">
              <p className="text-[0.78rem] text-slate-600">Withheld from employees <span className="ml-1 font-mono font-600 text-slate-900">{naira(fromEmployees)}</span></p>
              <p className="text-[0.78rem] text-slate-600">Paid by Nexoris Technologies on top <span className="ml-1 font-mono font-600 text-slate-900">{naira(fromEmployer)}</span></p>
            </div>
          </>
        )}
      </section>

      {/* Per employee: what a PAYE or pension schedule is actually filed as. */}
      {lines.length > 0 ? (
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><Users size={17} strokeWidth={2} className="text-[#543CDA]" /> Breakdown by employee</h2>
            <span className="text-[0.78rem] text-slate-500">{lines.length} {lines.length === 1 ? "person" : "people"}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[0.68rem] uppercase tracking-wide text-slate-500">
                  <th className={th}>Employee</th>
                  <th className={`${th} text-right`}>Gross</th>
                  <th className={`${th} text-right`}>PAYE</th>
                  <th className={`${th} text-right`}>Pension</th>
                  <th className={`${th} text-right`}>NHF</th>
                  <th className={`${th} text-right`}>WHT</th>
                  <th className={`${th} border-l border-slate-200 text-right`}>Pension (er)</th>
                  <th className={`${th} text-right`}>NSITF</th>
                  <th className={`${th} text-right`}>ITF</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={`${l.employee_name}-${i}`} className="border-b border-slate-100 last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-3 text-[0.83rem] font-600 text-slate-900">
                      {l.employee_name}
                      {l.regime === "WHT" ? <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.62rem] font-600 uppercase text-slate-600">WHT</span> : null}
                    </td>
                    <td className={`${num} text-slate-600`}>{cell(l.gross)}</td>
                    <td className={`${num} text-slate-900`}>{cell(l.paye)}</td>
                    <td className={`${num} text-slate-900`}>{cell(l.pension_employee)}</td>
                    <td className={`${num} text-slate-900`}>{cell(l.nhf)}</td>
                    <td className={`${num} text-slate-900`}>{cell(l.wht)}</td>
                    <td className={`${num} border-l border-slate-200 text-slate-600`}>{cell(l.pension_employer)}</td>
                    <td className={`${num} text-slate-600`}>{cell(l.ec)}</td>
                    <td className={`${num} text-slate-600`}>{cell(l.itf)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F1FD] text-[0.82rem] font-700 text-slate-900">
                  <td className="px-3 py-3">Total</td>
                  <td className={num}>{naira(lines.reduce((t, l) => t + Number(l.gross), 0))}</td>
                  <td className={num}>{naira(a?.paye ?? 0)}</td>
                  <td className={num}>{naira(a?.pension_employee ?? 0)}</td>
                  <td className={num}>{naira(a?.nhf ?? 0)}</td>
                  <td className={num}>{naira(a?.wht ?? 0)}</td>
                  <td className={`${num} border-l border-slate-200`}>{naira(a?.pension_employer ?? 0)}</td>
                  <td className={num}>{naira(a?.ec ?? 0)}</td>
                  <td className={num}>{naira(a?.itf ?? 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="border-t border-slate-100 px-5 py-3 text-[0.74rem] text-slate-500">
            The three columns to the right of the divider are employer costs. They are never deducted from an employee and appear on no payslip.
          </p>
        </section>
      ) : null}

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="border-b border-slate-100 px-5 py-3.5"><h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><CalendarClock size={17} strokeWidth={2} className="text-[#543CDA]" /> Compliance calendar</h2></div>
        <div className="divide-y divide-slate-100">
          {DEADLINES.map((d) => (
            <div key={d.item} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div><p className="text-[0.85rem] font-600 text-slate-900">{d.item}</p><p className="text-[0.78rem] text-slate-500">{d.authority}</p></div>
              <span className="shrink-0 rounded-full bg-[#EEEBFC] px-3 py-1 text-[0.74rem] font-600 text-[#543CDA]">{d.due}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
