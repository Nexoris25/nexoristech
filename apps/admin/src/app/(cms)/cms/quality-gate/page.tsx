/**
 * Quality Gate (PRD §9.7 — the non-negotiable gate before a programmatic page can publish).
 *
 * Every check here is RUN against the real corpus. The previous version listed 16 checks with fixed
 * verdicts — "Structured Data: failed", "Grammar: no issues detected" — none of which anything had
 * evaluated. A gate that reports invented results is not a gate; it is a picture of one, and it grants
 * confidence that nothing earned.
 *
 * Each row now counts how many of the generated pages actually satisfy a condition the database can
 * answer, and says how many failed. Checks the platform cannot perform — grammar, broken links,
 * near-duplicate detection — are absent rather than assumed to pass.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, ListChecks, MinusCircle } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { MIN_BODY_WORDS, MIN_READINESS } from "../../../../lib/pseo-gate.js";

export const dynamic = "force-dynamic";

type Status = "passed" | "warning" | "failed" | "none";
const MAP: Record<Status, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  passed: { icon: CheckCircle2, color: "#15803D", bg: "#DCFCE7", label: "Passing" },
  warning: { icon: AlertTriangle, color: "#B45309", bg: "#FEF3C7", label: "Partial" },
  failed: { icon: XCircle, color: "#DC2626", bg: "#FEE2E2", label: "Failing" },
  none: { icon: MinusCircle, color: "#64748B", bg: "#F1F5F9", label: "Not assessed" },
};

function Gauge({ value, sub }: { value: number; sub: string }): ReactNode {
  const r = 40, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  const color = value >= 80 ? "#15803D" : value >= 60 ? "#B45309" : "#DC2626";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 96 96" className="h-28 w-28 -rotate-90" role="img" aria-label={`Quality ${value} of 100`}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="#EEF2F7" strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <span><span className="block text-[1.5rem] font-700 text-slate-900">{value}</span><span className="block text-[0.62rem] text-slate-500">/100</span></span>
        </div>
      </div>
      <span className="mt-1 text-[0.82rem] font-700" style={{ color }}>{sub}</span>
    </div>
  );
}

interface Row {
  total: string; body_ok: string; author_ok: string; meta_ok: string;
  readiness_ok: string; image_ok: string; keyword_ok: string; seo_ok: string;
}

export default async function QualityGatePage(): Promise<ReactNode> {
  await requireCmsAccess();

  // One pass over the corpus. Each column counts the pages satisfying one gate condition, so the
  // checklist below reports measurements rather than assertions.
  const { rows } = await cmsDb().query<Row>(`
    SELECT
      count(*)::text AS total,
      -- Words of visible text, not characters of markup, so this column agrees with the gate the
      -- editor is held to. The backslashes are doubled because this is a template literal.
      count(*) FILTER (
        WHERE array_length(regexp_split_to_array(
          btrim(regexp_replace(regexp_replace(coalesce(body,''), '<[^>]+>', ' ', 'g'), '\\s+', ' ', 'g')),
          ' '), 1) >= $1)::text AS body_ok,
      count(*) FILTER (WHERE author_id IS NOT NULL)::text AS author_ok,
      count(*) FILTER (WHERE coalesce(meta_description,'') <> '')::text AS meta_ok,
      count(*) FILTER (WHERE coalesce(readiness_score,0) >= $2)::text AS readiness_ok,
      count(*) FILTER (WHERE coalesce(featured_image,'') <> '')::text AS image_ok,
      count(*) FILTER (WHERE coalesce(target_keyword,'') <> '')::text AS keyword_ok,
      count(*) FILTER (WHERE coalesce(seo_score,0) >= 70)::text AS seo_ok
    FROM cms_content WHERE kind = 'generated_page'
  `, [MIN_BODY_WORDS, MIN_READINESS]);

  const r = rows[0]!;
  const total = Number(r.total);
  const n = (v: string): number => Number(v);

  const checks: { label: string; ok: number; note: string }[] = [
    { label: "Body substance", ok: n(r.body_ok), note: `At least ${MIN_BODY_WORDS.toLocaleString("en-NG")} words of body copy` },
    { label: "Author attributed", ok: n(r.author_ok), note: "Named author on the page, for E-E-A-T" },
    { label: "Meta description", ok: n(r.meta_ok), note: "A written meta description, not an empty field" },
    { label: "Readiness score", ok: n(r.readiness_ok), note: `Data-readiness record complete (${MIN_READINESS})` },
    { label: "Featured image", ok: n(r.image_ok), note: "A cover image is set" },
    { label: "Target keyword", ok: n(r.keyword_ok), note: "The page states the term it targets" },
    { label: "SEO score", ok: n(r.seo_ok), note: "Scored 70 or above" },
  ];

  const statusOf = (ok: number): Status => {
    // With no pages there is nothing to measure, so nothing is failing. Reporting seven failures
    // against an empty corpus told the owner the platform was broken when it was simply empty.
    if (total === 0) return "none";
    const pct = (ok / total) * 100;
    return pct >= 95 ? "passed" : pct >= 50 ? "warning" : "failed";
  };

  // The score is the share of all condition-checks the corpus satisfies, not an average of verdicts.
  const satisfied = checks.reduce((sum, c) => sum + c.ok, 0);
  const score = total === 0 ? 0 : Math.round((satisfied / (total * checks.length)) * 100);
  const sub = total === 0 ? "No pages yet" : score >= 80 ? "Publishable" : score >= 60 ? "Needs work" : "Not ready";
  const counts = {
    passed: checks.filter((c) => statusOf(c.ok) === "passed").length,
    warning: checks.filter((c) => statusOf(c.ok) === "warning").length,
    failed: checks.filter((c) => statusOf(c.ok) === "failed").length,
    none: checks.filter((c) => statusOf(c.ok) === "none").length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Quality Gate</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">
            Every generated page measured against the §9.7 conditions. {total.toLocaleString("en-NG")} pages checked.
          </p>
        </div>
        <Link href="/cms/generated-pages" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]">
          <ListChecks size={15} /> Review pages
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <Gauge value={score} sub={sub} />
          <p className="mt-3 text-center text-[0.76rem] text-slate-600">
            Share of all conditions the corpus satisfies
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-[#DCFCE7] p-2"><p className="text-[1.1rem] font-700 text-[#15803D]">{counts.passed}</p><p className="text-[0.7rem] font-600 text-[#15803D]">Passing</p></div>
            <div className="rounded-lg bg-[#FEF3C7] p-2"><p className="text-[1.1rem] font-700 text-[#B45309]">{counts.warning}</p><p className="text-[0.7rem] font-600 text-[#B45309]">Partial</p></div>
            <div className="rounded-lg bg-[#FEE2E2] p-2"><p className="text-[1.1rem] font-700 text-[#DC2626]">{counts.failed}</p><p className="text-[0.7rem] font-600 text-[#DC2626]">Failing</p></div>
            {counts.none > 0 ? <div className="rounded-lg bg-[#F1F5F9] p-2"><p className="text-[1.1rem] font-700 text-slate-600">{counts.none}</p><p className="text-[0.7rem] font-600 text-slate-600">Not assessed</p></div> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Gate conditions</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Counted across every generated page. Conditions the platform cannot evaluate are not listed.</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {checks.map((c) => {
              const m = MAP[statusOf(c.ok)];
              const missing = total - c.ok;
              return (
                <li key={c.label} className="flex items-center gap-3 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: m.bg, color: m.color }}>
                    <m.icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-600 text-slate-900">{c.label}</span>
                    <span className="block text-[0.76rem] text-slate-600">{c.note}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[0.78rem] font-700" style={{ color: m.color }}>
                      {c.ok.toLocaleString("en-NG")} / {total.toLocaleString("en-NG")}
                    </span>
                    <span className="block text-[0.72rem] text-slate-500">
                      {missing > 0 ? `${missing.toLocaleString("en-NG")} missing` : "all pages"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
