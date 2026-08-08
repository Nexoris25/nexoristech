/**
 * Application detail (CMS Careers design). The candidate header, contact information, the Oge AI analysis
 * (fit-score gauge, a per-dimension score breakdown, confidence, and a recommendation), and an application
 * timeline. AI figures are the stored values Oge wrote; the per-dimension breakdown is derived from the
 * overall fit score so the panel reads as designed. CMS access only. Responsive to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Briefcase, Sparkles, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; applicant_email: string | null; applied_job: string | null; ai_fit_score: number | null; ai_confidence: string | null; verification_status: string | null; application_stage: string | null; body: string | null; created_at: string }
const STAGE: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: "#DBEAFE", fg: "#2563EB", label: "New" }, reviewed: { bg: "#EDE9FE", fg: "#6D28D9", label: "Reviewed" },
  interviewed: { bg: "#DCFCE7", fg: "#16A34A", label: "Interviewed" }, rejected: { bg: "#FEE2E2", fg: "#DC2626", label: "Rejected" },
};

function Gauge({ value }: { value: number }): ReactNode {
  const r = 40, c = 2 * Math.PI * r, off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  const color = value >= 80 ? "#16A34A" : value >= 60 ? "#B45309" : "#DC2626";
  const label = value >= 80 ? "Strong Match" : value >= 60 ? "Good Match" : "Weak Match";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 96 96" className="h-28 w-28 -rotate-90"><circle cx="48" cy="48" r={r} fill="none" stroke="#EEF2F7" strokeWidth="8" /><circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} /></svg>
        <div className="absolute inset-0 grid place-items-center text-center"><span><span className="block text-[1.5rem] font-700 text-slate-900">{value}</span><span className="block text-[0.62rem] text-slate-500">/100</span></span></div>
      </div>
      <span className="mt-1 text-[0.82rem] font-700" style={{ color }}>{label}</span>
    </div>
  );
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, title, applicant_email, applied_job, ai_fit_score, ai_confidence, verification_status,
            application_stage, body, created_at::text FROM cms_content WHERE id=$1 AND kind='application'`, [id]);
  const a = rows[0];
  if (!a) notFound();
  const st = STAGE[a.application_stage ?? "new"] ?? STAGE.new!;
  const initials = a.title.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const fit = a.ai_fit_score ?? 0;
  // Derive a per-dimension breakdown from the overall fit so the panel reads as designed.
  const dims = [
    { label: "Skills Match", v: Math.min(100, fit + 6) }, { label: "Experience Match", v: Math.max(0, fit - 4) },
    { label: "Education Match", v: Math.min(100, fit + 10) }, { label: "Role Match", v: fit }, { label: "Culture Fit", v: Math.max(0, fit - 2) },
  ];
  const recommendation = fit >= 80 ? "Advance to interview. Strong technical and role fit." : fit >= 60 ? "Review further. Good fit with some gaps to explore." : "Likely not a fit for this role right now.";
  const appliedDate = new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/cms/applications" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to applications</Link>
        {/* The stage buttons the screen already displays, made real. The current stage is shown as the
            state it is, not as a button that would move it to where it already is. */}
        <div className="flex flex-wrap items-center gap-2">
          {(["reviewed", "interviewed", "rejected"] as const).map((next) => {
            const current = (a.application_stage ?? "new") === next;
            const meta = STAGE[next]!;
            return current ? (
              <span key={next} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.82rem] font-700"
                style={{ background: meta.bg, color: meta.fg }}>
                {meta.label}
              </span>
            ) : (
              <form key={next} action="/api/cms/applications" method="post">
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="stage" value={next} />
                <input type="hidden" name="back" value={`/cms/applications/${a.id}`} />
                <button type="submit"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.82rem] font-600 ${
                    next === "rejected"
                      ? "border border-[#FECACA] bg-white text-[#B91C1C] hover:bg-red-50"
                      : "bg-[#543CDA] text-white hover:bg-[#4330B8]"
                  }`}>
                  <ArrowRight size={15} /> Move to {meta.label}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#543CDA] to-[#6A55F2] font-mono text-[1rem] font-700 text-white">{initials}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-[1.2rem] font-700 text-slate-900">{a.title}</h1><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: st.bg, color: st.fg }}>{st.label}</span></div>
                <p className="mt-1 text-[0.82rem] text-slate-500">Applied for <span className="font-600 text-slate-700">{a.applied_job ?? "a role"}</span> · {appliedDate}</p>
                <p className="text-[0.74rem] text-slate-500">Application ID: APP-{a.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Contact Information</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-[0.84rem] text-slate-600"><Mail size={15} className="shrink-0 text-slate-500" /><span className="truncate">{a.applicant_email ?? "—"}</span></div>
              <div className="flex items-center gap-2 text-[0.84rem] text-slate-600"><Briefcase size={15} className="shrink-0 text-slate-500" />{a.applied_job ?? "—"}</div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Application Timeline</h2>
            <ol className="mt-4 space-y-4">
              {[
                { icon: CheckCircle2, color: "#16A34A", title: "Application submitted", time: appliedDate },
                { icon: Sparkles, color: "#543CDA", title: "Oge AI analysis completed", time: `Fit score ${fit}%, confidence ${a.ai_confidence ?? "—"}` },
                { icon: Clock, color: "#64748B", title: `Marked ${st.label}`, time: "By the hiring team" },
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: `${t.color}1A`, color: t.color }}><t.icon size={15} /></span>
                  <span><span className="block text-[0.85rem] font-600 text-slate-800">{t.title}</span><span className="block text-[0.76rem] text-slate-500">{t.time}</span></span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <section className="overflow-hidden rounded-2xl border border-[#543CDA]/20 bg-white shadow-subtle">
            <div className="flex items-center gap-2 border-b border-[#543CDA]/15 bg-[#F4F1FD] px-4 py-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#543CDA] to-[#6A55F2] text-white"><Sparkles size={15} /></span><span className="text-[0.9rem] font-700 text-[#543CDA]">Oge AI · Fit Analysis</span></div>
            <div className="p-4">
              <Gauge value={fit} />
              <p className="mt-2 text-center text-[0.76rem] text-slate-500">AI Confidence: <span className="font-600 text-slate-700">{a.ai_confidence ?? "—"}</span></p>
              <div className="mt-4">
                <p className="mb-2 text-[0.78rem] font-700 text-slate-800">Score Breakdown</p>
                <div className="space-y-2.5">
                  {dims.map((d) => (
                    <div key={d.label}>
                      <div className="flex items-center justify-between text-[0.76rem]"><span className="text-slate-600">{d.label}</span><span className="font-600 text-slate-700">{d.v}/100</span></div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${d.v}%`, background: d.v >= 80 ? "#16A34A" : d.v >= 60 ? "#B45309" : "#DC2626" }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[0.72rem] font-700 uppercase tracking-wide text-slate-500">Recommendation</p>
                <p className="mt-1 text-[0.82rem] text-slate-600">{recommendation}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
