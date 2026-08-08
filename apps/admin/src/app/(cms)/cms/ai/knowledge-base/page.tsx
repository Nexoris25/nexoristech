/**
 * Knowledge Base Library (PRD §10.3). What Oge is grounded in, and how much of it there is.
 *
 * Document counts are real, from the published corpus. Chunk and embedding counts are not shown as
 * numbers unless the gateway can be asked for them: the previous screen produced them by multiplying
 * each source's document count by a per-document factor written into the file — 8 for the marketing
 * pages, 6 for insights, 5 for case studies — and presented the result as "Chunks" and "Embeddings"
 * alongside a "Synced" badge that nothing checked. Every one of those figures was arithmetic on a guess.
 *
 * The knowledge base itself lives with the Oge gateway, so its real state has to come from there. When
 * the gateway cannot be reached the screen says so and shows nothing in those columns.
 *
 * Sources are not added by hand, which is why there is no "Add Source" button any more: a source is
 * whatever is published, and the way to add one is to publish content.
 *
 * CMS access only. Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Boxes, FileCode, FileText, Globe, PlugZap, Scale } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { STATIC_COUNTS } from "../../../../../lib/site-pages.js";

export const dynamic = "force-dynamic";

interface Counts { insights: string; case_studies: string; legal: string; pseo: string }

/** Ask the gateway whether it can reach the knowledge base. Null when it cannot be asked at all. */
async function gatewayReachable(): Promise<boolean | null> {
  const base = process.env.OGE_GATEWAY_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return false;
    const body = (await res.json()) as { db?: boolean };
    return body.db === true;
  } catch {
    return null;
  }
}

export default async function KnowledgeBasePage(): Promise<ReactNode> {
  await requireCmsAccess();

  const [{ rows: [c] }, kbLive] = await Promise.all([
    cmsDb().query<Counts>(
      `SELECT (SELECT count(*) FROM cms_content WHERE kind='insight' AND status='published')::text insights,
              (SELECT count(*) FROM cms_content WHERE kind='case_study' AND status='published')::text case_studies,
              (SELECT count(*) FROM cms_content WHERE kind='legal_page' AND status='published')::text legal,
              (SELECT count(*) FROM cms_content WHERE kind='generated_page' AND status='published')::text pseo`),
    gatewayReachable(),
  ]);

  const ins = Number(c?.insights ?? 0);
  const cs = Number(c?.case_studies ?? 0);
  const lg = Number(c?.legal ?? 0);
  const ps = Number(c?.pseo ?? 0);

  const sources = [
    { name: "Nexoris Technologies website", type: "Website", icon: Globe, docs: STATIC_COUNTS.hardcoded, href: null },
    { name: "Service catalogue and facts", type: "Catalogue", icon: Boxes, docs: STATIC_COUNTS.services + STATIC_COUNTS.industries, href: null },
    { name: "Insights", type: "Insights", icon: BookOpen, docs: ins, href: "/cms/insights" },
    { name: "Case studies", type: "Case studies", icon: FileText, docs: cs, href: "/cms/case-studies" },
    { name: "Legal pages", type: "Legal", icon: Scale, docs: lg, href: "/cms/legal-pages" },
    { name: "Programmatic pages", type: "Programmatic", icon: FileCode, docs: ps, href: "/cms/generated-pages" },
  ];
  const totalDocs = sources.reduce((sum, s) => sum + s.docs, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Knowledge Base</h1>
          <p className="mt-1 max-w-3xl text-[0.86rem] leading-relaxed text-slate-600">
            Oge answers only from these sources. A source is whatever is published, so content is added
            by publishing it rather than by registering it here.
          </p>
        </div>
      </div>

      {kbLive !== true ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <PlugZap size={16} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-[0.8rem] leading-relaxed text-slate-600">
            {kbLive === null
              ? "The Oge gateway is not configured here, so the knowledge base cannot be queried."
              : "The Oge gateway is running but cannot reach the knowledge base, so its chunk and embedding counts are unavailable."}
            {" "}Document counts below are real and come from the published corpus. Nothing is estimated in
            place of the figures that cannot be read.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
          <p className="text-[1.5rem] font-700 text-slate-900">{sources.length}</p>
          <p className="text-[0.78rem] text-slate-600">Sources</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
          <p className="text-[1.5rem] font-700 text-slate-900">{totalDocs.toLocaleString("en-NG")}</p>
          <p className="text-[0.78rem] text-slate-600">Documents grounding Oge</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
          <p className="text-[1.5rem] font-700" style={{ color: kbLive === true ? "#15803D" : "#B45309" }}>
            {kbLive === true ? "Reachable" : "Unavailable"}
          </p>
          <p className="text-[0.78rem] text-slate-600">Knowledge base</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-600">Source</th>
                <th className="px-5 py-3 font-600">Type</th>
                <th className="px-5 py-3 font-600">Documents</th>
                <th className="px-5 py-3 font-600">Chunks</th>
                <th className="px-5 py-3 text-right font-600">Manage</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.name} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]"><s.icon size={15} /></span>
                      <span className="text-[0.85rem] font-600 text-slate-900">{s.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{s.type}</span></td>
                  <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{s.docs.toLocaleString("en-NG")}</td>
                  {/* Left blank rather than filled with docs × a guessed factor, which is what it was. */}
                  <td className="px-5 py-3 text-[0.84rem] text-slate-600">—</td>
                  <td className="px-5 py-3 text-right">
                    {s.href ? (
                      <Link href={s.href} className="inline-flex items-center gap-1 text-[0.8rem] font-600 text-[#543CDA] hover:underline">
                        Open <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <span className="text-[0.78rem] text-slate-500">Built in</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
