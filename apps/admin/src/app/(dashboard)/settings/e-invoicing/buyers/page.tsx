/**
 * NRS Buyer Validation (PRD 15). The directory of buyers we bill, each with a TIN that can be checked.
 * Verification is recorded, not performed live (§17) - the screen is ready for the real NRS TIN lookup
 * to be wired in. Admin only.
 */
import type { ReactNode } from "react";
import { CheckCircle2, Contact } from "lucide-react";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Buyer { id: string; name: string; tin: string | null; verified: boolean; last_checked: string | null }
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none";
const lbl = "text-[0.78rem] font-600 text-slate-700";

export default async function BuyersPage(): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const { rows } = await db().query<Buyer>("SELECT id, name, tin, verified, last_checked::text FROM nrs_buyer ORDER BY name");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Buyer Validation</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Buyers we bill and their TIN status. Verification is recorded here until the live NRS lookup is wired in.</p>

      <form action="/api/nrs/buyers" method="post" className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <input type="hidden" name="action" value="add" />
        <label className="flex flex-1 flex-col gap-1.5"><span className={lbl}>Buyer name</span><input name="name" required className={field} /></label>
        <label className="flex flex-1 flex-col gap-1.5"><span className={lbl}>TIN</span><input name="tin" className={field} /></label>
        <button className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">Add Buyer</button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><Contact size={22} /></span><p className="text-[0.9rem] font-600 text-slate-700">No buyers yet</p></div>
        ) : (
          <table className="w-full text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Buyer</th><th className="px-5 py-3 font-600">TIN</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600" aria-label="Action" /></tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-900">{b.name}</td>
                  <td className="px-5 py-3 font-mono text-[0.82rem] text-slate-600">{b.tin ?? "—"}</td>
                  <td className="px-5 py-3">{b.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[0.72rem] font-600 text-[#15803D]"><CheckCircle2 size={12} /> Verified</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-600 text-slate-600">Unverified</span>}</td>
                  <td className="px-5 py-3 text-right">
                    {!b.verified && b.tin ? (
                      <form action="/api/nrs/buyers" method="post"><input type="hidden" name="action" value="verify" /><input type="hidden" name="id" value={b.id} /><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[0.78rem] font-600 text-slate-700 hover:bg-slate-50">Verify TIN</button></form>
                    ) : b.last_checked ? <span className="text-[0.74rem] text-slate-500">Checked {new Date(b.last_checked).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
