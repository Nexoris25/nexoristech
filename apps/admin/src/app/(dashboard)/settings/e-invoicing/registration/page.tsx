/**
 * NRS Business Registration (PRD 15). The taxpayer identity the NRS needs: company TIN, RC number, and
 * the NRS taxpayer TIN, plus the registration status derived from whether those are present. Branch
 * mapping is a single-entity note - Nexoris Technologies has one registered entity, so there are no
 * branches to map. Admin only.
 */
import type { ReactNode } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row { legal_name: string; tin: string | null; rc_number: string | null; nrs_taxpayer_tin: string | null }
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "text-[0.78rem] font-600 text-slate-700";

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const { saved } = await searchParams;
  const c = (await db().query<Row>("SELECT legal_name, tin, rc_number, nrs_taxpayer_tin FROM company_settings WHERE id=true")).rows[0]!;
  const complete = Boolean(c.tin) && Boolean(c.nrs_taxpayer_tin);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Business Registration</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">The taxpayer identity the NRS uses to recognise Nexoris Technologies.</p>
      {saved ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700">Saved.</div> : null}

      <div className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.85rem] font-600 ${complete ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        {complete ? <CheckCircle2 size={16} /> : <Circle size={16} />} Registration status: {complete ? "Complete" : "Incomplete — TIN and NRS taxpayer TIN required"}
      </div>

      <form action="/api/nrs/config" method="post" className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <input type="hidden" name="action" value="registration" />
        <h2 className="text-[0.95rem] font-700 text-slate-900">Taxpayer information</h2>
        <p className="text-[0.78rem] text-slate-500">{c.legal_name}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5"><span className={lbl}>Company TIN</span><input name="tin" defaultValue={c.tin ?? ""} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>RC number</span><input name="rc_number" defaultValue={c.rc_number ?? ""} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>NRS taxpayer TIN</span><input name="nrs_taxpayer_tin" defaultValue={c.nrs_taxpayer_tin ?? ""} className={field} /></label>
        </div>
        <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">Save</button></div>
      </form>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Branch mapping</h2>
        <p className="mt-1 text-[0.82rem] text-slate-500">Nexoris Technologies is a single registered entity, so there are no branches to map to separate NRS registrations.</p>
      </section>
    </div>
  );
}
