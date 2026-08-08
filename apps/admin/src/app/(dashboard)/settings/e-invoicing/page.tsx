/**
 * NRS e-Invoicing dashboard (PRD 15). The readiness overview for the Nigeria Revenue Service
 * e-invoicing system: whether the integration is configured, today's submissions, what is pending or
 * failed, the success rate, and the latest errors. Nothing submits to the NRS yet (§17) - these read
 * from the submission and log tables, which stay empty until the live call is wired in.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, TriangleAlert, Plug, ArrowRight } from "lucide-react";
import { requireFiscal } from "../../../../lib/fiscal/permissions.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

export default async function EInvoicingDashboard(): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const pool = db();
  const [{ rows: cfg }, { rows: sub }, { rows: errs }] = await Promise.all([
    pool.query<{ nrs_enabled: boolean; nrs_environment: string; nrs_taxpayer_tin: string | null; nrs_credentials_set: boolean; nrs_last_test_ok: boolean | null }>(
      "SELECT nrs_enabled, nrs_environment, nrs_taxpayer_tin, nrs_credentials_set, nrs_last_test_ok FROM company_settings WHERE id=true"),
    // Read the live operational data so Settings and the e-Invoicing module always agree.
    pool.query<{ total: string; today: string; pending: string; failed: string; acknowledged: string }>(
      `SELECT count(*) FILTER (WHERE nrs_status IN ('Submitting','Accepted','Rejected'))::text total,
              count(*) FILTER (WHERE submitted_at::date = current_date)::text today,
              count(*) FILTER (WHERE nrs_status IN ('NotSubmitted','Submitting') AND lifecycle_status NOT IN ('Draft','Closed'))::text pending,
              count(*) FILTER (WHERE nrs_status = 'Rejected')::text failed,
              count(*) FILTER (WHERE nrs_status = 'Accepted')::text acknowledged FROM einvoice`),
    pool.query<{ id: string; summary: string; created_at: string }>(
      "SELECT id::text, summary, created_at::text FROM einvoice_event WHERE ok=false ORDER BY created_at DESC LIMIT 5"),
  ]);
  const c = cfg[0]!, s = sub[0]!;
  const configured = Boolean(c.nrs_taxpayer_tin) && c.nrs_credentials_set;
  const decided = Number(s.acknowledged) + Number(s.failed);
  const successRate = decided > 0 ? Math.round((Number(s.acknowledged) / decided) * 100) : 0;

  const kpis = [
    { label: "Today's Submissions", value: s.today, icon: Clock, tint: "text-[#543CDA]" },
    { label: "Pending", value: s.pending, icon: Clock, tint: "text-[#B45309]" },
    { label: "Failed", value: s.failed, icon: XCircle, tint: "text-[#B91C1C]" },
    { label: "Success Rate", value: `${successRate}%`, icon: CheckCircle2, tint: "text-[#15803D]" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">NRS e-Invoicing</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Readiness for the Nigeria Revenue Service e-invoicing system.</p>
        </div>
        <Link href="/settings/e-invoicing/integration" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]"><Plug size={15} /> Configure</Link>
      </div>

      {/* Integration status */}
      <section className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 shadow-subtle ${c.nrs_enabled && configured ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${c.nrs_enabled && configured ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{c.nrs_enabled && configured ? <CheckCircle2 size={22} /> : <Plug size={22} />}</span>
          <div>
            <p className="text-[0.95rem] font-700 text-slate-900">{c.nrs_enabled ? (configured ? "Ready" : "Enabled — configuration incomplete") : "Not live"}</p>
            <p className="text-[0.8rem] text-slate-500">{c.nrs_environment} environment · Taxpayer TIN {c.nrs_taxpayer_tin ? "set" : "missing"} · Credentials {c.nrs_credentials_set ? "set" : "missing"}</p>
          </div>
        </div>
        <Link href="/settings/e-invoicing/integration" className="text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Manage integration</Link>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between"><span className="text-[0.78rem] font-600 text-slate-500">{k.label}</span><k.icon size={17} className={k.tint} /></div>
            <p className={`mt-2 text-[1.5rem] font-700 ${k.tint}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Pending invoices</h2>
          <p className="mt-1 text-[0.82rem] text-slate-500">{Number(s.pending) === 0 ? "No invoices awaiting submission." : `${s.pending} awaiting submission.`}</p>
          <Link href="/settings/e-invoicing/submission-history" className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Submission history <ArrowRight size={14} /></Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><TriangleAlert size={16} className="text-[#B45309]" /> Recent errors</h2>
          {errs.length === 0 ? <p className="mt-1 text-[0.82rem] text-slate-500">No errors logged.</p> : (
            <ul className="mt-2 flex flex-col divide-y divide-slate-100">
              {errs.map((e) => <li key={e.id} className="py-2 text-[0.8rem] text-slate-600">{e.summary} <span className="text-slate-500">· {new Date(e.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span></li>)}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.8rem] text-slate-500">Every invoice already carries the nullable NRS fields (IRN, QR code, company and client TINs, submission status). Going live is a matter of wiring the submission call and flipping the flag, not restructuring data. Nothing is submitted to the NRS from here yet.</p>
    </div>
  );
}
