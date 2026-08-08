/**
 * NRS Integration (PRD 15). Provider choice, environment (sandbox / production), the non-secret Business
 * ID and Service ID, and a readiness "connection test" that records status without calling the NRS.
 *
 * Secrets never appear here. The cryptographic key and API secret live in the environment, are never
 * stored in the database, never returned by an API and never rendered — this screen shows only whether
 * each is present, by name. Requires TAX_FISCAL_CONFIG_MANAGE, which no e-invoicing module role carries.
 */
import type { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { credentialsPresent } from "../../../../../lib/fiscal/provider.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Cfg {
  nrs_enabled: boolean; nrs_environment: string; nrs_partner: string | null; nrs_partner_type: string | null;
  nrs_business_id: string | null; nrs_service_id: string | null; nrs_last_test_at: string | null; nrs_last_test_ok: boolean | null;
}
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "text-[0.78rem] font-600 text-slate-700";

export default async function IntegrationPage({ searchParams }: { searchParams: Promise<{ saved?: string; tested?: string }> }): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const { saved, tested } = await searchParams;
  const c = (await db().query<Cfg>(
    "SELECT nrs_enabled, nrs_environment, nrs_partner, nrs_partner_type, nrs_business_id, nrs_service_id, nrs_last_test_at::text, nrs_last_test_ok FROM company_settings WHERE id=true")).rows[0]!;

  // Presence only. The values themselves are never read into the page.
  const credsReady = credentialsPresent();
  const CREDENTIAL_VARS = ["NRS_SIAPP_BUSINESS_ID", "NRS_SIAPP_SERVICE_ID", "NRS_SIAPP_CRYPTO_KEY", "NRS_SIAPP_ENDPOINT"] as const;
  const missingVars = CREDENTIAL_VARS.filter((v) => !process.env[v]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Integration</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Provider, environment, and credentials for the NRS connection.</p>
      {saved ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700">Saved.</div> : null}
      {tested ? (
        <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[0.84rem] ${c.nrs_last_test_ok ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-[#B91C1C]"}`}>
          {c.nrs_last_test_ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {c.nrs_last_test_ok ? "Readiness check passed." : "Readiness check failed. See the Integration Log for what is missing."}
        </div>
      ) : null}

      <form action="/api/nrs/config" method="post" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <input type="hidden" name="action" value="integration" />
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" name="nrs_enabled" defaultChecked={c.nrs_enabled} className="h-4 w-4 cursor-pointer rounded accent-[#543CDA]" />
          <span className="text-[0.88rem] font-600 text-slate-900">Enable NRS e-invoicing readiness</span>
        </label>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className={lbl}>Environment</span>
            <select name="nrs_environment" defaultValue={c.nrs_environment} className={`cursor-pointer ${field}`}><option value="sandbox">Sandbox</option><option value="production">Production</option></select>
          </label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Partner type</span>
            <select name="nrs_partner_type" defaultValue={c.nrs_partner_type ?? ""} className={`cursor-pointer ${field}`}><option value="">Not chosen</option><option value="SI">System Integrator (SI)</option><option value="APP">Access Point Provider (APP)</option></select>
          </label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Provider / partner name</span><input name="nrs_partner" defaultValue={c.nrs_partner ?? ""} placeholder="To be selected" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Business ID</span>
            <input name="nrs_business_id" defaultValue={c.nrs_business_id ?? ""} placeholder="Issued by your provider" className={field} />
            <span className="text-[0.72rem] text-slate-500">Separate from the Service ID. Do not reuse one for the other.</span>
          </label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Service ID</span>
            <input name="nrs_service_id" defaultValue={c.nrs_service_id ?? ""} placeholder="Issued by your provider" className={field} />
            <span className="text-[0.72rem] text-slate-500">Non-secret identifier for the service you were provisioned.</span>
          </label>
        </div>

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-start gap-2.5">
            {credsReady ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#15803D]" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-[#B45309]" />}
            <div>
              <p className="text-[0.85rem] font-600 text-slate-900">{credsReady ? "Credentials are present in the environment" : "Credentials are not configured"}</p>
              <p className="text-[0.76rem] text-slate-500">Read from the environment at request time, so this cannot be set by hand. Secrets are never stored here, never sent to the browser, and never shown after configuration.</p>
              {missingVars.length > 0 ? (
                <p className="mt-1.5 text-[0.74rem] text-[#B45309]">Missing: {missingVars.join(", ")}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">Save</button></div>
      </form>

      <form action="/api/nrs/config" method="post" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <input type="hidden" name="action" value="test" />
        <div>
          <h2 className="text-[0.9rem] font-700 text-slate-900">Connection test</h2>
          <p className="text-[0.78rem] text-slate-500">{c.nrs_last_test_at ? `Last checked ${new Date(c.nrs_last_test_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · ${c.nrs_last_test_ok ? "passed" : "failed"}` : "Not yet tested. Records readiness without calling the NRS."}</p>
        </div>
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-[0.83rem] font-600 text-slate-700 hover:bg-slate-50">Run test</button>
      </form>
    </div>
  );
}
