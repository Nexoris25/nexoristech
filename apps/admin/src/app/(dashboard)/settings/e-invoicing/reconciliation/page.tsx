/**
 * Fiscal Reconciliation. Runs every consistency check over the ledger and reports what disagrees.
 *
 * Read-only by design. It names the problem and links to the document; correcting it is a person's
 * decision because every correction has a tax consequence. Nothing on this screen writes fiscal status.
 *
 * This is the check that would have caught the fabricated IRNs the audit found, so a clean result here
 * is meaningful: it says every accepted document has a real submission behind it.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { runReconciliation } from "../../../../../lib/fiscal/reconcile-run.js";

export const dynamic = "force-dynamic";

export default async function ReconciliationPage(): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const report = await runReconciliation();
  const critical = report.discrepancies.filter((d) => d.severity === "critical");
  const warnings = report.discrepancies.filter((d) => d.severity === "warning");

  const stat = (label: string, value: string | number, tint = "text-slate-900"): ReactNode => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
      <p className="text-[0.76rem] text-slate-500">{label}</p>
      <p className={`mt-1 text-[1.3rem] font-700 ${tint}`}>{value}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Reconciliation</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">
        Checks every document against its own lines, its tax rule, and the submissions recorded behind it.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat("Documents checked", report.checked)}
        {stat("Critical", critical.length, critical.length > 0 ? "text-[#B91C1C]" : "text-[#15803D]")}
        {stat("Warnings", warnings.length, warnings.length > 0 ? "text-[#B45309]" : "text-slate-900")}
        {stat("Checked with the service", report.providerConfigured ? report.providerChecked : "—")}
      </div>

      {!report.providerConfigured ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.83rem] leading-relaxed text-amber-900">
          No accredited SI/APP is configured, so documents cannot be checked against the Nigeria Revenue Service. The internal checks below still ran in full.
        </p>
      ) : null}

      {report.discrepancies.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#15803D]" />
          <div>
            <p className="text-[0.92rem] font-700 text-[#15803D]">Everything agrees</p>
            <p className="mt-0.5 text-[0.83rem] text-[#15803D]">
              Every total follows from its lines, every VAT figure matches the rule that priced it, and no document claims an acceptance without a submission behind it.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {report.discrepancies.map((d, i) => (
            <li
              key={`${d.einvoiceId}-${d.code}-${i}`}
              className={`flex items-start gap-3 rounded-xl border p-3.5 ${d.severity === "critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
              <span className={`mt-0.5 shrink-0 ${d.severity === "critical" ? "text-[#B91C1C]" : "text-[#B45309]"}`}>
                {d.severity === "critical" ? <AlertOctagon size={17} /> : <AlertTriangle size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[0.85rem] font-600 text-slate-900">
                  <Link href={`/e-invoicing/doc/${d.einvoiceId}`} className="font-mono text-[#543CDA] hover:text-[#4330B8]">{d.reference}</Link>
                  <span className={`rounded-full px-2 py-0.5 text-[0.66rem] font-600 uppercase tracking-wide ${d.severity === "critical" ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-[#FEF3C7] text-[#B45309]"}`}>{d.code.replace(/_/g, " ")}</span>
                </p>
                <p className={`mt-0.5 text-[0.8rem] leading-relaxed ${d.severity === "critical" ? "text-[#B91C1C]" : "text-[#B45309]"}`}>{d.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-start gap-2 text-[0.76rem] leading-relaxed text-slate-500">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-slate-500" />
        This report never changes a document. Correcting a discrepancy has tax consequences and is a decision for a person.
      </p>
    </div>
  );
}
