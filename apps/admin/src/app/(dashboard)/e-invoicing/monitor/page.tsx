/**
 * Integration Monitor (PRD 15): the health of the NRS connection - service status, connection health
 * from the last readiness check, recent API activity, error logs, and synchronisation history. Reads
 * the integration config, the document lifecycle events, and the NRS log. Nothing calls the NRS live
 * (§17); this shows the readiness signals and the simulated activity.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import { requireFiscal } from "../../../../lib/fiscal/permissions.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Cfg { nrs_enabled: boolean; nrs_environment: string; nrs_credentials_set: boolean; nrs_taxpayer_tin: string | null; nrs_last_test_at: string | null; nrs_last_test_ok: boolean | null }
interface Event { id: string; kind: string; summary: string; ok: boolean; created_at: string }

export default async function MonitorPage(): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  const pool = db();
  const [{ rows: cfg }, { rows: activity }, { rows: errors }, { rows: syncRows }] = await Promise.all([
    pool.query<Cfg>("SELECT nrs_enabled, nrs_environment, nrs_credentials_set, nrs_taxpayer_tin, nrs_last_test_at::text, nrs_last_test_ok FROM company_settings WHERE id=true"),
    pool.query<Event>("SELECT id::text, kind, summary, ok, created_at::text FROM einvoice_event ORDER BY created_at DESC LIMIT 12"),
    pool.query<Event>("SELECT id::text, kind, summary, ok, created_at::text FROM einvoice_event WHERE ok=false ORDER BY created_at DESC LIMIT 8"),
    pool.query<{ last_sync: string | null; count: string }>("SELECT max(created_at)::text last_sync, count(*)::text FROM einvoice_event"),
  ]);
  const c = cfg[0]!;
  const configured = Boolean(c.nrs_taxpayer_tin) && c.nrs_credentials_set;
  const health = configured && c.nrs_last_test_ok ? "Healthy" : configured ? "Degraded" : "Not configured";
  const sync = syncRows[0]!;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Integration Monitor</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Service status, connection health, and API activity for the NRS integration.</p>

      {/* Service status + connection health */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`rounded-2xl border p-5 shadow-subtle ${c.nrs_enabled ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}>
          <p className="text-[0.76rem] font-600 text-slate-500">Service Status</p>
          <p className={`mt-1 text-[1.1rem] font-700 ${c.nrs_enabled ? "text-[#15803D]" : "text-slate-500"}`}>{c.nrs_enabled ? "Enabled" : "Disabled"}</p>
          <p className="mt-0.5 text-[0.74rem] text-slate-500">{c.nrs_environment} environment</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <p className="text-[0.76rem] font-600 text-slate-500">Connection Health</p>
          <p className={`mt-1 text-[1.1rem] font-700 ${health === "Healthy" ? "text-[#15803D]" : health === "Degraded" ? "text-[#B45309]" : "text-slate-500"}`}>{health}</p>
          <p className="mt-0.5 text-[0.74rem] text-slate-500">{c.nrs_last_test_at ? `Checked ${new Date(c.nrs_last_test_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}` : "Not yet tested"} · <Link href="/settings/e-invoicing/integration" className="text-[#543CDA]">Manage</Link></p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <p className="text-[0.76rem] font-600 text-slate-500">Synchronisation</p>
          <p className="mt-1 text-[1.1rem] font-700 text-slate-900">{sync.count} events</p>
          <p className="mt-0.5 text-[0.74rem] text-slate-500">{sync.last_sync ? `Last ${new Date(sync.last_sync).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : "No activity yet"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* API activity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><Activity size={16} className="text-[#543CDA]" /> API Activity</h2>
          {activity.length === 0 ? <p className="mt-2 text-[0.82rem] text-slate-500">No activity yet.</p> : (
            <ul className="mt-3 flex flex-col divide-y divide-slate-100">
              {activity.map((e) => (
                <li key={e.id} className="flex items-center gap-2 py-2">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${e.ok ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"}`}>{e.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}</span>
                  <span className="min-w-0 flex-1 truncate text-[0.8rem] text-slate-700">{e.summary}</span>
                  <span className="shrink-0 text-[0.72rem] text-slate-500">{new Date(e.created_at).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Error logs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><XCircle size={16} className="text-[#B91C1C]" /> Error Logs</h2>
          {errors.length === 0 ? <p className="mt-2 text-[0.82rem] text-slate-500">No errors logged.</p> : (
            <ul className="mt-3 flex flex-col divide-y divide-slate-100">
              {errors.map((e) => (
                <li key={e.id} className="py-2"><p className="text-[0.8rem] text-[#B91C1C]">{e.summary}</p><p className="text-[0.72rem] text-slate-500">{new Date(e.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
