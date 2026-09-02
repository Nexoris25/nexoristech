/**
 * CRM - Lead Details (Batch 3, screen 2 + AI Lead Score). The lead header with the Oge score, a
 * contact card, the activity timeline, and the Oge AI panel: the lead score, the reasons behind it,
 * the recommended next best action, and the matched services. Everything is grounded in the lead's
 * real data and Oge's real scoring output.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Quote,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  MapPin,
  CalendarDays,
  Check,
  Sparkles,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";
import { deriveInsights } from "../../../../lib/lead-insights.js";
import { followUpTemplate } from "../../../../lib/followup.js";
import { regenerateFollowUp } from "../../../../lib/crm-actions.js";
import { CopyEmail } from "./CopyEmail.js";
import { StageControl } from "./StageControl.js";
import { FollowUpPanel } from "./FollowUpPanel.js";
import { SOURCE_LABEL } from "../../../../lib/lead-ui.js";
import { requireUuid } from "../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string;
  page: string | null;
  score: number | null;
  band: string | null;
  justification: string | null;
  scored_by: string | null;
  status: string;
  created_at: string;
  finder: Record<string, unknown> | null;
  owner: string | null;
  followup_stage: string | null;
  followup_draft: string | null;
  followup_drafted_by: string | null;
  followup_due: string | null;
  followup_sent_at: string | null;
}

const NO_FOLLOWUP = new Set(["Won", "Lost"]);

const BAND: Record<string, { ring: string; badge: string }> = {
  Hot: { ring: "#EF4444", badge: "bg-[#FEE2E2] text-[#B91C1C]" },
  Warm: { ring: "#F59E0B", badge: "bg-[#FEF3C7] text-[#B45309]" },
  Cold: { ring: "#3B82F6", badge: "bg-[#DBEAFE] text-[#1D4ED8]" },
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}


/**
 * The finder answers a visitor submitted, as readable label/value pairs. The Solution Finder stores its
 * own keys, so anything unrecognised is skipped rather than shown as a raw key to a sales rep.
 */
const FINDER_LABEL: Record<string, string> = {
  headache: "Main problem", industry: "Industry", companySize: "Company size",
  urgency: "Timeline", budget: "Budget", role: "Their role", services: "Matched services",
};
function finderRows(finder: Record<string, unknown> | null): { label: string; value: string }[] {
  if (!finder) return [];
  return Object.entries(finder)
    .filter(([k]) => FINDER_LABEL[k] && k !== "role")
    .map(([k, v]) => ({
      label: FINDER_LABEL[k]!,
      value: Array.isArray(v) ? v.join(", ") : String(v ?? "").replace(/-/g, " "),
    }))
    .filter((r) => r.value && r.value !== "null" && r.value !== "undefined");
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  const { id } = await params;
  requireUuid(id);
  const staff = await getCurrentStaff();
  const pool = db();

  const { rows } = await pool.query<Lead>(
    `SELECT l.id, l.name, l.email, l.phone, l.company, l.message, l.source, l.page, l.score, l.band,
            l.justification, l.scored_by, l.status, l.created_at, l.finder, s.name AS owner,
            l.followup_stage, l.followup_draft, l.followup_drafted_by, l.followup_due::text, l.followup_sent_at::text
       FROM lead l LEFT JOIN staff s ON s.id = l.assigned_to WHERE l.id = $1`,
    [id],
  );
  const lead = rows[0];
  if (!lead) notFound();

  const { rows: activity } = await pool.query<{ type: string; note: string | null; created_at: string; actor: string | null }>(
    `SELECT la.type, la.note, la.created_at, s.name AS actor
       FROM lead_activity la LEFT JOIN staff s ON s.id = la.actor_id
      WHERE la.lead_id = $1 ORDER BY la.created_at DESC LIMIT 12`,
    [id],
  );

  const insights = deriveInsights(lead);
  const canEdit = Boolean(staff) && staff!.role !== "viewer";
  const stage = lead.followup_stage ?? lead.status;
  const hasFollowUp = !NO_FOLLOWUP.has(stage);
  const initialDraft = lead.followup_draft
    ?? (hasFollowUp ? followUpTemplate(stage, { name: lead.name, company: lead.company, message: lead.message, matchedServices: insights.services.map((s) => s.label), industry: null }) : "");
  const b = BAND[lead.band ?? ""] ?? { ring: "#94A3B8", badge: "bg-slate-100 text-slate-600" };
  const score = lead.score ?? 0;
  const created = new Date(lead.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const jobTitle = typeof lead.finder?.role === "string" ? (lead.finder.role as string) : null;
  const contactRows = [
    { icon: <Mail size={15} strokeWidth={2} />, label: "Email", value: lead.email ?? "—" },
    { icon: <Phone size={15} strokeWidth={2} />, label: "Phone", value: lead.phone ?? "—" },
    { icon: <Building2 size={15} strokeWidth={2} />, label: "Company", value: lead.company ?? "—" },
    { icon: <MapPin size={15} strokeWidth={2} />, label: "Source", value: SOURCE_LABEL[lead.source] ?? lead.source },
    { icon: <CalendarDays size={15} strokeWidth={2} />, label: "Created", value: created },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/crm" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">
        <ArrowLeft size={15} strokeWidth={2.2} /> Leads
      </Link>

      {/* Header */}
      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 font-mono text-[1rem] font-700 text-slate-600">
            {(lead.name ?? "?").split(/\s+/).map((p) => p[0]).join("").slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.25rem] font-700 text-slate-900">{lead.name ?? "Unnamed lead"}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${b.badge}`}>{lead.band ?? lead.status}</span>
            </div>
            <p className="mt-0.5 text-[0.86rem] text-slate-500">{[jobTitle, lead.company].filter(Boolean).join(" at ") || lead.status}</p>
            <div className="mt-3 flex gap-1.5">
              {[Mail, Phone, MessageSquare].map((Icon, i) => (
                <span key={i} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-[#543CDA] hover:text-[#543CDA]">
                  <Icon size={15} strokeWidth={2} />
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-full" style={{ background: `conic-gradient(${b.ring} ${score * 3.6}deg, #EEF2F7 0deg)` }}>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white font-mono text-[1.05rem] font-700 text-slate-900">{score}</span>
            </div>
            <span className="mt-1 text-[0.68rem] font-600 uppercase tracking-wide text-slate-500">Oge Score</span>
          </div>
        </div>
      </div>

      {/* What the prospect actually said. This sits directly under the header, ahead of Oge's score and
          drafts, because a rep should read the enquiry in the prospect's own words before judging what
          Oge made of it. */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900">
            <Quote size={16} className="text-[#543CDA]" /> Original enquiry
          </h2>
          <span className="flex flex-wrap items-center gap-2 text-[0.72rem] text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-600">{SOURCE_LABEL[lead.source] ?? lead.source}</span>
            {lead.page ? <span className="max-w-[16rem] truncate font-mono">{lead.page}</span> : null}
            <span>{created}</span>
          </span>
        </div>

        <div className="p-5">
          {lead.message ? (
            // A chat lead's message is the conversation, one turn per line. Without pre-line the
            // browser folds it into a single paragraph and the two speakers run together.
            <blockquote className="whitespace-pre-line border-l-[3px] border-[#543CDA] bg-[#F8F7FE] px-4 py-3.5 text-[0.92rem] leading-relaxed text-slate-800">
              {lead.message}
            </blockquote>
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-3.5 text-[0.86rem] text-slate-500">
              This lead arrived without a written message. The details below are what they told the Solution Finder.
            </p>
          )}

          {finderRows(lead.finder).length > 0 ? (
            <div className="mt-4">
              <p className="text-[0.7rem] font-700 uppercase tracking-wide text-slate-500">What they told the finder</p>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {finderRows(lead.finder).map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-1.5">
                    <dt className="shrink-0 text-[0.78rem] text-slate-500">{row.label}</dt>
                    <dd className="min-w-0 text-right text-[0.82rem] font-600 capitalize text-slate-800">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Contact + timeline */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">Contact information</h2>
            <dl className="mt-4 flex flex-col gap-3">
              {contactRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500">{r.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[0.7rem] text-slate-500">{r.label}</span>
                    {r.label === "Email" && lead.email
                      ? <CopyEmail email={lead.email} />
                      : <span className="block truncate text-[0.84rem] font-600 text-slate-900">{r.value}</span>}
                  </span>
                </div>
              ))}
              {lead.owner ? (
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500"><Target size={15} strokeWidth={2} /></span>
                  <span><span className="block text-[0.7rem] text-slate-500">Lead owner</span><span className="block text-[0.84rem] font-600 text-slate-900">{lead.owner}</span></span>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">Activity timeline</h2>
            {activity.length === 0 ? (
              <p className="mt-3 text-[0.84rem] text-slate-500">No activity yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col">
                {activity.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#543CDA]" />
                      {i < activity.length - 1 ? <span className="w-px flex-1 bg-slate-200" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 pb-4">
                      <span className="block text-[0.84rem] text-slate-800">{a.note ?? a.type}</span>
                      <span className="block text-[0.74rem] text-slate-500">{[a.actor, timeAgo(a.created_at)].filter(Boolean).join(" · ")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Oge AI panel */}
        <section className="overflow-hidden rounded-2xl border border-[#DDD6FE] bg-white shadow-subtle">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-[#543CDA] to-[#6A55F2] px-5 py-3.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/20 text-white"><Sparkles size={15} strokeWidth={2} /></span>
            <h2 className="text-[0.95rem] font-700 text-white">Oge AI Lead Score</h2>
            <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[0.64rem] font-600 text-white">
              {lead.scored_by === "ai" ? "Scored by Oge" : "Rules baseline"}
            </span>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${b.ring} ${score * 3.6}deg, #EEF2F7 0deg)` }}>
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white font-mono text-[1.4rem] font-700 text-slate-900">{score}</span>
              </div>
              <div>
                <p className="text-[0.95rem] font-700 text-slate-900">{lead.band ?? "Unscored"}</p>
                <p className="mt-0.5 max-w-sm text-[0.82rem] leading-relaxed text-slate-500">{insights.summary}</p>
              </div>
            </div>

            <h3 className="mt-6 text-[0.82rem] font-700 text-slate-900">Why this score</h3>
            <ul className="mt-2.5 flex flex-col gap-2">
              {insights.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[0.83rem] text-slate-600">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-green-500 text-white"><Check size={11} strokeWidth={3} /></span>
                  {r}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl bg-[#F4F1FD] p-4">
              <h3 className="flex items-center gap-1.5 text-[0.82rem] font-700 text-[#543CDA]"><Target size={14} strokeWidth={2.2} /> Next best action</h3>
              <p className="mt-1.5 text-[0.86rem] font-600 text-slate-900">{insights.nextStep.headline}</p>
              <p className="mt-0.5 text-[0.82rem] leading-relaxed text-slate-600">{insights.nextStep.detail}</p>
            </div>

            {insights.services.length > 0 ? (
              <>
                <h3 className="mt-6 text-[0.82rem] font-700 text-slate-900">Recommended services</h3>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {insights.services.map((s) => (
                    <a key={s.href} href={`https://nexoristech.com${s.href}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-[#F4F1FD] px-3 py-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:bg-[#EEEBFC]">
                      {s.label} <ArrowUpRight size={13} strokeWidth={2.2} />
                    </a>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>

      {/* Stage control + Oge follow-up email (drafts only; nothing sends from here) */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.9rem] font-700 text-slate-900">Update stage</h2>
          <p className="mt-1 text-[0.8rem] text-slate-500">Moving the lead forward prompts Oge to draft the right follow-up for the new stage.</p>
          <div className="mt-3">
            {canEdit
              ? <StageControl leadId={lead.id} currentStatus={lead.status} />
              : <p className="text-[0.82rem] text-slate-500">Current stage: <span className="font-600 text-slate-800">{lead.status}</span></p>}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#DDD6FE] bg-white shadow-subtle">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-[#543CDA] to-[#6A55F2] px-5 py-3.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/20 text-white"><Sparkles size={15} strokeWidth={2} /></span>
            <h2 className="text-[0.95rem] font-700 text-white">Oge follow-up email · {stage}</h2>
          </div>
          <div className="p-5">
            {hasFollowUp ? (
              <FollowUpPanel
                leadId={lead.id}
                initialDraft={initialDraft}
                initialDraftedBy={lead.followup_drafted_by === "ai" ? "ai" : "template"}
                action={regenerateFollowUp}
                due={lead.followup_due}
                sent={Boolean(lead.followup_sent_at)}
                canEdit={canEdit}
              />
            ) : (
              <p className="text-[0.84rem] text-slate-500">There is no follow-up email at the {stage} stage. Move the lead to an active stage and Oge will draft one.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
