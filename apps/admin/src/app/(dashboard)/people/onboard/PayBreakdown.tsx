"use client";
/**
 * The pay section of HR onboarding (PRD 8). HR enters gross pay and ticks the deductions that apply to
 * this employee. Everything below that is read-only and recalculates as they type: the employer
 * obligations and the true cost of employing the person.
 *
 * The read-only half exists because those figures are frequently misunderstood. NSITF and ITF are
 * employer costs, never deducted from anyone's salary, and PAYE is not a separate "State IRS" deduction,
 * it is the same tax shown once and remitted to the employee's state. Presenting them as read-only makes
 * that unambiguous while still showing HR the full cost.
 *
 * HR also classifies the employee into a salary band from the Nigeria Tax Act 2025 table. The band is
 * recorded and cross-checked; it never drives the calculation. The Act's bands are on chargeable income
 * — gross less pension, NHF and Rent Relief — so two people on identical gross can sit in different
 * bands, and a band chosen by eye is exactly the kind of mistake worth catching. When the selection
 * disagrees with what the employee's own figures produce, the form says so and shows both.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { computeStatutory, STATUTORY_RATES, REMITTANCE_AUTHORITIES } from "../../../../lib/payroll-statutory.js";
import { SALARY_BANDS, checkBand, TAX_TABLE_EFFECTIVE } from "../../../../lib/salary-bands.js";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const naira = (n: number): string => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PayBreakdown({
  initialGross = 0, initialPaye = true, initialPension = true, initialNhf = false, initialRent = 0,
  initialBand = "",
  fieldClass, labelClass,
}: {
  initialGross?: number; initialPaye?: boolean; initialPension?: boolean; initialNhf?: boolean; initialRent?: number;
  initialBand?: string;
  fieldClass: string; labelClass: string;
}): ReactNode {
  const [gross, setGross] = useState(initialGross ? String(initialGross) : "");
  const [annualRent, setAnnualRent] = useState(initialRent ? String(initialRent) : "");
  const [paye, setPaye] = useState(initialPaye);
  const [pension, setPension] = useState(initialPension);
  const [nhf, setNhf] = useState(initialNhf);
  const [band, setBand] = useState(initialBand);

  const r = computeStatutory({
    gross: Number(gross) || 0,
    payeApplies: paye, pensionApplies: pension, nhfApplies: nhf,
    annualRent: Number(annualRent) || 0,
  });

  // Cross-check only. `r` above is the calculation, and it is unchanged by whatever band is chosen.
  const check = checkBand({
    grossMonthly: Number(gross) || 0,
    chargeableAnnual: r.detail.chargeableAnnual,
    payeMonthly: r.employee.paye,
    selectedBandId: band || null,
  });

  const row = (label: string, value: number, note?: string): ReactNode => (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 last:border-b-0">
      <span className="text-[0.82rem] text-slate-600">{label}{note ? <span className="ml-1 text-[0.72rem] text-slate-500">{note}</span> : null}</span>
      <span className="shrink-0 font-mono text-[0.84rem] font-600 tabular-nums text-slate-900">{naira(value)}</span>
    </div>
  );
  const toggle = (label: string, note: string, checked: boolean, onChange: (v: boolean) => void, name: string): ReactNode => (
    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#543CDA]" />
      <span><span className="block text-[0.83rem] font-600 text-slate-800">{label}</span><span className="block text-[0.73rem] text-slate-500">{note}</span></span>
    </label>
  );

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Gross pay (monthly) <span className="text-[#EF4444]">*</span></span>
        <input name="gross_pay" type="number" min={0} step="0.01" required value={gross} onChange={(e) => setGross(e.target.value)} placeholder="0.00" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Annual rent paid</span>
        <input name="annual_rent" type="number" min={0} step="0.01" value={annualRent} onChange={(e) => setAnnualRent(e.target.value)} placeholder="0.00" className={fieldClass} />
        <span className="text-[0.72rem] text-slate-500">Used for Rent Relief: 20% of rent, capped at ₦500,000 a year.</span>
      </label>

      <div className="sm:col-span-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Salary band <span className="text-[0.72rem] font-400 text-slate-500">(Nigeria Tax Act 2025, effective {TAX_TABLE_EFFECTIVE})</span></span>
          <select name="salary_band" value={band} onChange={(e) => setBand(e.target.value)} className={`cursor-pointer ${fieldClass}`}>
            <option value="">Not classified</option>
            {SALARY_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </label>

        {Number(gross) > 0 && paye ? (
          <div className={`mt-2 flex items-start gap-2.5 rounded-lg border p-3 ${check.mismatch ? "border-[#FDE68A] bg-[#FFFBEB]" : "border-slate-200 bg-slate-50/70"}`}>
            {check.mismatch
              ? <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#B45309]" />
              : <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#15803D]" />}
            <p className="text-[0.78rem] leading-relaxed text-slate-700">
              {check.exempt ? (
                <>This employee is at or below the national minimum wage, so no PAYE is due whatever band is selected.</>
              ) : check.mismatch ? (
                <>
                  These figures fall in <strong className="font-700">{check.actual.label}</strong>, not the band selected.
                  The bands are on chargeable income after pension, NHF and Rent Relief, so gross alone does not decide them.
                  PAYE is calculated from the figures either way; correct the selection so the record matches.
                </>
              ) : (
                <>
                  These figures fall in <strong className="font-700">{check.actual.label}</strong>.
                  That {check.marginalRate}% is the marginal rate on the top slice of income; this employee&apos;s
                  tax is <strong className="font-700">{check.effectiveRate}%</strong> of gross.
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <p className="text-[0.8rem] font-600 text-slate-700">Deductions that apply to this employee</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {toggle("PAYE", "Remitted to the State Internal Revenue Service", paye, setPaye, "paye_applies")}
          {toggle("Pension", `${STATUTORY_RATES.pensionEmployee}% employee, ${STATUTORY_RATES.pensionEmployer}% employer`, pension, setPension, "pension_applies")}
          {toggle("NHF", "Voluntary for private-sector staff", nhf, setNhf, "nhf_applies")}
        </div>
      </div>

      {/* Read-only. Recalculates live so HR sees the real cost before saving. */}
      <div className="sm:col-span-2 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-3">
        <div>
          <p className="text-[0.7rem] font-700 uppercase tracking-wide text-slate-500">Deducted from the employee</p>
          <div className="mt-1.5">
            {row("PAYE", r.employee.paye)}
            {row("Pension", r.employee.pension, `${STATUTORY_RATES.pensionEmployee}%`)}
            {row("NHF", r.employee.nhf, `${STATUTORY_RATES.nhf}%`)}
            <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-slate-300 pt-1.5">
              <span className="text-[0.82rem] font-700 text-slate-700">Net pay</span>
              <span className="font-mono text-[0.9rem] font-700 tabular-nums text-[#15803D]">{naira(r.netPay)}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[0.7rem] font-700 uppercase tracking-wide text-slate-500">Employer pays (not deducted)</p>
          <div className="mt-1.5">
            {row("Pension", r.employer.pension, `${STATUTORY_RATES.pensionEmployer}%`)}
            {row("NSITF", r.employer.nsitf, `${STATUTORY_RATES.nsitf}%`)}
            {row("ITF", r.employer.itf, `${STATUTORY_RATES.itf}%`)}
            <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-slate-300 pt-1.5">
              <span className="text-[0.82rem] font-700 text-slate-700">Employer total</span>
              <span className="font-mono text-[0.9rem] font-700 tabular-nums text-slate-900">{naira(r.employer.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#543CDA]/25 bg-white p-3.5">
          <p className="text-[0.7rem] font-700 uppercase tracking-wide text-[#543CDA]">Total cost to the company</p>
          <p className="mt-1.5 font-mono text-[1.35rem] font-700 leading-none text-slate-900">{naira(r.companyCost)}</p>
          <p className="mt-1.5 text-[0.74rem] leading-relaxed text-slate-500">Gross pay plus every employer obligation. Chargeable income this year: {naira(r.detail.chargeableAnnual)}.</p>
        </div>
      </div>

      <div className="sm:col-span-2">
        <p className="text-[0.7rem] font-700 uppercase tracking-wide text-slate-500">Where these are remitted</p>
        <ul className="mt-1.5 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {REMITTANCE_AUTHORITIES.map((a) => (
            <li key={a.key} className="flex items-baseline justify-between gap-3 text-[0.75rem]">
              <span className="text-slate-600">{a.label}</span>
              <span className="shrink-0 text-right text-slate-500">{a.authority}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
