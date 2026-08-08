/**
 * AI Configuration (CMS Oge AI Workspace design, PRD §10.1-10.2). Shows the real model architecture the
 * Oge gateway runs: each group's primary model and its two-level fallback chain, mirrored from
 * apps/oge/src/config/models.ts. The fallback chain means no visitor or editor ever sees a broken AI
 * feature. Provider keys live only in the gateway. CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import { Sparkles, ArrowDown, KeyRound } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { MODEL_GROUPS, PROVIDER_META, type ModelSlot } from "../../../../../lib/ai-models.js";

export const dynamic = "force-dynamic";

function Slot({ slot, tier }: { slot: ModelSlot; tier: string }): ReactNode {
  const p = PROVIDER_META[slot.provider];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <span className="rounded-md px-2 py-0.5 text-[0.66rem] font-700 uppercase tracking-wide" style={{ background: `${p.color}1A`, color: p.color }}>{tier}</span>
      <span className="min-w-0 flex-1"><span className="block text-[0.85rem] font-600 text-slate-800">{slot.label}</span><span className="block truncate font-mono text-[0.72rem] text-slate-500">{slot.model}</span></span>
      <span className="text-[0.74rem] font-600 text-slate-500">{p.label}</span>
    </div>
  );
}

export default async function AiConfigurationPage(): Promise<ReactNode> {
  await requireCmsAccess();
  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">AI Configuration</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">The models Oge runs, with a two-level fallback chain per group so no AI feature ever breaks.</p>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#543CDA]/20 bg-[#F4F1FD] p-3">
        <KeyRound size={16} className="mt-0.5 shrink-0 text-[#543CDA]" />
        <p className="text-[0.8rem] leading-relaxed text-slate-600">All AI runs server-side in the Oge gateway; the browser never calls a provider. Model identifiers are pinned in <span className="font-mono text-[0.76rem]">apps/oge/src/config/models.ts</span> and provider keys live only there. Each call walks the chain on a rate limit or outage.</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {MODEL_GROUPS.map((g) => (
          <section key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#543CDA] to-[#6A55F2] text-white"><Sparkles size={15} /></span>
              <h2 className="text-[0.95rem] font-700 text-slate-900">{g.name}</h2>
            </div>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-slate-500">{g.purpose}</p>
            <div className="mt-3 flex flex-col gap-2">
              <Slot slot={g.primary} tier="Primary" />
              {g.backups.map((b, i) => (
                <div key={b.model + i} className="flex flex-col gap-2">
                  <span className="mx-auto text-slate-300"><ArrowDown size={14} /></span>
                  <Slot slot={b} tier={`Backup ${i + 1}`} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
