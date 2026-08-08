/**
 * NRS Submission History & Retry queue (PRD 15). Every attempt to submit an invoice to the NRS, by
 * status: Acknowledged (successful), Pending/Submitted, and Rejected/Failed (the retry queue). Nothing
 * submits yet (§17), so this reads the submission table, which stays empty until the live call exists.
 * A rejected row is where Retry will live once the call is wired in.
 */
import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row { id: string; seq: string; customer_name: string; irn: string | null; nrs_status: string; error: string | null; submitted_at: string | null; created_at: string }
const STATUS: Record<string, string> = {
  NotSubmitted: "bg-slate-100 text-slate-600", Submitting: "bg-[#DBEAFE] text-[#1D4ED8]",
  Accepted: "bg-[#DCFCE7] text-[#15803D]", Rejected: "bg-[#FEE2E2] text-[#B91C1C]",
};
const LABEL: Record<string, string> = { Submitting: "Submitting", Accepted: "Accepted", Rejected: "Rejected", NotSubmitted: "Not submitted" };
const TABS = [["All", ""], ["Successful", "Accepted"], ["Submitting", "Submitting"], ["Rejected", "Rejected"]] as const;

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const { status } = await searchParams;
  const filter = ["Accepted", "Submitting", "Rejected"].includes(status ?? "") ? status! : "";

  // Read the live operational data - the same einvoice rows the module works with.
  const { rows } = await db().query<Row>(
    `SELECT id::text, seq::text, customer_name, irn, nrs_status,
            (validation_messages->>0) AS error, submitted_at::text, created_at::text
       FROM einvoice
      WHERE nrs_status IN ('Submitting','Accepted','Rejected')${filter ? " AND nrs_status = $1" : ""}
      ORDER BY submitted_at DESC NULLS LAST, created_at DESC LIMIT 200`,
    filter ? [filter] : []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Submission History</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Every invoice submission to the NRS, by status. Rejected rows are the retry queue.</p>

      <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        {TABS.map(([label, val]) => {
          const active = (val === "" && !filter) || val === filter;
          return <a key={label} href={val ? `/settings/e-invoicing/submission-history?status=${val}` : "/settings/e-invoicing/submission-history"} className={`rounded-md px-3.5 py-1.5 text-[0.8rem] font-600 ${active ? "bg-[#543CDA] text-white" : "text-slate-600 hover:bg-slate-50"}`}>{label}</a>;
        })}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><FileText size={22} /></span><p className="text-[0.9rem] font-600 text-slate-700">No submissions</p><p className="max-w-sm text-[0.82rem] text-slate-500">Submissions appear here once the live NRS call is enabled. The data shape is ready.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Invoice</th><th className="px-5 py-3 font-600">Client</th><th className="px-5 py-3 font-600">IRN</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">When</th><th className="px-5 py-3 font-600" aria-label="Action" /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-3 font-mono text-[0.82rem] font-600 text-slate-900">INV-{r.seq.padStart(5, "0")}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-700">{r.customer_name}</td>
                    <td className="px-5 py-3 font-mono text-[0.78rem] text-slate-500">{r.irn ?? "—"}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${STATUS[r.nrs_status]}`}>{LABEL[r.nrs_status] ?? r.nrs_status}</span></td>
                    <td className="px-5 py-3 text-[0.78rem] text-slate-500">{new Date(r.submitted_at ?? r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-3 text-right">{r.nrs_status === "Rejected" ? <a href="/e-invoicing/rejected" className="text-[0.76rem] font-600 text-[#543CDA]" title={r.error ?? ""}>Retry</a> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
