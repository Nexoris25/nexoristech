/**
 * Payroll Settings - the statutory deduction toggle panel (PRD 8.3, 8.12 record view). A master
 * switch per deduction, each defaulting on for its regime; turning one off is deliberate and logged.
 * Also carries the rates, the pay day, and a read-only view of the Nigeria Tax Act 2025 PAYE band
 * table (8.4) with its effective and verified dates. Payroll Admin only.
 */
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { PAYE_BANDS } from "../../../../lib/tax-engine.js";

export const dynamic = "force-dynamic";

interface Settings {
  paye_enabled: boolean; pension_enabled: boolean; nhf_enabled: boolean; wht_enabled: boolean; ec_enabled: boolean; itf_enabled: boolean;
  pension_employee_rate: string; pension_employer_rate: string; nhf_rate: string; wht_rate: string; ec_rate: string; itf_rate: string;
  pay_day: number; tax_table_effective: string; tax_table_verified: string | null;
}

const TOGGLES: { key: keyof Settings; name: string; desc: string }[] = [
  { key: "paye_enabled", name: "PAYE", desc: "Income tax for employees. Off flags a compliance risk." },
  { key: "pension_enabled", name: "Pension", desc: "8% employee, 10% employer, on basic + housing + transport." },
  { key: "nhf_enabled", name: "NHF", desc: "2.5% of basic, for registered employees." },
  { key: "wht_enabled", name: "Withholding tax", desc: "For Contract and Consultant workers only." },
  { key: "ec_enabled", name: "Employees' Compensation (NSITF)", desc: "1% of payroll, employer cost, not on the payslip." },
  { key: "itf_enabled", name: "Industrial Training Fund (ITF)", desc: "1% of payroll, employer cost, for 5+ employees or turnover from ₦50m. Not on the payslip." },
];

function naira(n: number): string {
  return n === Infinity ? "and above" : `₦${n.toLocaleString("en-NG")}`;
}

export default async function PayrollSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }): Promise<ReactNode> {
  await requireCapability("payroll.settings");
  const { saved } = await searchParams;
  const s = (await db().query<Settings>("SELECT * FROM payroll_settings WHERE id=true")).rows[0]!;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Payroll Settings</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">The statutory deduction toggle panel and rates. Each toggle defaults on; turning one off is logged.</p>

      {saved ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700"><CheckCircle2 size={16} strokeWidth={2} /> Settings saved.</div>
      ) : null}

      <form action="/api/payroll/settings" method="post" className="mt-5 flex flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Deductions</h2>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {TOGGLES.map((t) => (
              <label key={t.key} className="flex cursor-pointer items-center gap-3 py-3">
                <input type="checkbox" name={t.key} defaultChecked={s[t.key] as boolean} className="h-4 w-4 shrink-0 cursor-pointer rounded accent-[#543CDA]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.87rem] font-600 text-slate-900">{t.name}</span>
                  <span className="block text-[0.78rem] text-slate-500">{t.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Rates &amp; schedule</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              ["Pension (employee) %", "pension_employee_rate", s.pension_employee_rate],
              ["Pension (employer) %", "pension_employer_rate", s.pension_employer_rate],
              ["NHF %", "nhf_rate", s.nhf_rate],
              ["Withholding tax %", "wht_rate", s.wht_rate],
              ["Employees' Comp %", "ec_rate", s.ec_rate],
              ["Industrial Training Fund %", "itf_rate", s.itf_rate],
              ["Pay day (of month)", "pay_day", String(s.pay_day)],
            ].map(([label, name, val]) => (
              <label key={name} className="flex flex-col gap-1.5">
                <span className="text-[0.78rem] font-600 text-slate-700">{label}</span>
                <input name={name} type="number" step="0.1" min="0" defaultValue={val} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end"><button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.86rem] font-600 text-white hover:bg-[#4330B8]">Save Settings</button></div>
      </form>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[0.95rem] font-700 text-slate-900">PAYE rate table</h2>
          <span className="text-[0.76rem] text-slate-500">Nigeria Tax Act 2025 · effective {new Date(s.tax_table_effective).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}{s.tax_table_verified ? ` · verified ${s.tax_table_verified}` : " · not yet verified"}</span>
        </div>
        <table className="mt-3 w-full text-left">
          <thead><tr className="border-b border-slate-100 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="py-2 font-600">Annual chargeable income</th><th className="py-2 text-right font-600">Rate</th></tr></thead>
          <tbody>
            {PAYE_BANDS.map((b, i) => {
              const from = i === 0 ? 0 : PAYE_BANDS[i - 1]!.upTo;
              return (
                <tr key={i} className="border-b border-slate-50 last:border-b-0">
                  <td className="py-2 font-mono text-[0.8rem] text-slate-700">{b.upTo === Infinity ? `${naira(from)} and above` : `${naira(from)} – ${naira(b.upTo)}`}</td>
                  <td className="py-2 text-right font-mono text-[0.8rem] font-700 text-slate-900">{Math.round(b.rate * 100)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-[0.76rem] text-slate-500">Rent Relief (lower of 20% of annual rent or ₦500,000) replaces the old Consolidated Relief Allowance. Pension is deducted before tax on basic + housing + transport only. Workers at or below the minimum wage pay no PAYE.</p>
      </section>
    </div>
  );
}
