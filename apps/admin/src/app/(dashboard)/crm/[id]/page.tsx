/**
 * The lead detail (PRD 5.8, 5.9): the sales workspace for one lead. Header with the temperature
 * rating; contact and submission cards; the original challenge; the AI Insights panel (summary,
 * score, why-this-score, tone signals); the recommended next step; the recommended services; the
 * Oge follow-up email with Regenerate and Copy; and the activity timeline. The right rail (stage
 * and owner) is sticky so it stays in view while the workspace scrolls. Everything is grounded in
 * the lead's real data. Ratings use the shared temperature colours; brand purple stays for actions.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  History,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
  Wrench,
  X,
} from "lucide-react";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";
import { assignLead, autoAssignLead } from "../../../../lib/people-actions.js";
import { deriveInsights } from "../../../../lib/lead-insights.js";
import { followUpTemplate } from "../../../../lib/followup.js";
import { draftLeadReply, regenerateFollowUp } from "../../../../lib/crm-actions.js";
import { rating, SOURCE_LABEL } from "../../../../lib/lead-ui.js";
import { StageControl } from "./StageControl.js";
import { FollowUpPanel } from "./FollowUpPanel.js";
import { GenerateDocument } from "./GenerateDocument.js";

export const dynamic = "force-dynamic";

interface LeadDetail {
  id: string;
  source: string;
  page: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  finder: Record<string, unknown> | null;
  score: number | null;
  band: string | null;
  justification: string | null;
  scored_by: string | null;
  status: string;
  lost_reason: string | null;
  nurture_date: string | null;
  created_at: string;
  assigned_to: string | null;
  assignee_name: string | null;
  followup_stage: string | null;
  followup_draft: string | null;
  followup_drafted_by: "ai" | "template" | null;
  followup_due: string | null;
  followup_sent_at: string | null;
}

interface ActivityRow {
  type: string;
  note: string | null;
  created_at: string;
  actor: string | null;
}

function dateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-NG", {
      timeZone: "Africa/Lagos",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-NG", {
      timeZone: "Africa/Lagos",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function relTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const CARD = "rounded-card border border-purple-200 bg-white shadow-subtle";
const EYEBROW = "text-[0.75rem] font-600 uppercase tracking-wide text-neutral-600";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactNode> {
  const { id } = await params;
  const pool = db();
  const staff = await getCurrentStaff();
  const isAdmin = staff?.role === "admin";
  const canEdit = staff !== null && staff.role !== "viewer";

  const { rows } = await pool.query<LeadDetail>(
    `SELECT l.id, l.source, l.page, l.name, l.email, l.phone, l.company, l.message,
            l.finder, l.score, l.band, l.justification, l.scored_by, l.status,
            l.lost_reason, l.nurture_date, l.created_at, l.assigned_to,
            l.followup_stage, l.followup_draft, l.followup_drafted_by, l.followup_due::text,
            l.followup_sent_at, s.name AS assignee_name
       FROM lead l LEFT JOIN staff s ON s.id = l.assigned_to
      WHERE l.id = $1`,
    [id],
  );
  const lead = rows[0];
  if (!lead) notFound();

  const [salespeople, activity] = await Promise.all([
    isAdmin
      ? pool
          .query<{ id: string; name: string }>(
            "SELECT id, name FROM staff WHERE active = true AND role = 'salesperson' ORDER BY name",
          )
          .then((r) => r.rows)
      : Promise.resolve([] as { id: string; name: string }[]),
    pool
      .query<ActivityRow>(
        `SELECT la.type, la.note, la.created_at, s.name AS actor
           FROM lead_activity la LEFT JOIN staff s ON s.id = la.actor_id
          WHERE la.lead_id = $1 ORDER BY la.created_at DESC LIMIT 20`,
        [id],
      )
      .then((r) => r.rows),
  ]);

  const insights = deriveInsights(lead);
  const submitted = dateParts(lead.created_at);
  const r = rating(lead.band);
  const hasStored = lead.followup_draft !== null;
  const panelDraft =
    lead.followup_draft ??
    followUpTemplate("Contacted", {
      name: lead.name,
      company: lead.company,
      message: lead.message,
      matchedServices: insights.services.map((s) => s.label),
      industry: insights.industry,
    });

  return (
    <div className="mx-auto max-w-4xl pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-roboto text-[1.6rem] font-700 leading-tight text-ink-950">
            {lead.name ?? "Unnamed lead"}
          </h1>
          {lead.company ? (
            <p className="mt-0.5 text-[0.95rem] text-neutral-600">{lead.company}</p>
          ) : null}
          <span className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] font-700 ${r.solid}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            {r.label === "Hot" ? "Hot Deal" : r.label} lead
          </span>
        </div>
        <Link
          href="/crm"
          aria-label="Back to leads"
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-neutral-200 text-neutral-600 hover:border-purple-300 hover:bg-purple-100 hover:text-purple-700"
        >
          <X size={18} strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Contact + submission */}
          <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2">
            <div className={`${CARD} p-4`}>
              <h2 className={EYEBROW}>Contact details</h2>
              <ul className="mt-3 flex flex-col gap-3 text-[0.9rem] text-ink-950">
                {[
                  { icon: Mail, value: lead.email ?? "No email given" },
                  { icon: Phone, value: lead.phone ?? "No phone given" },
                  { icon: Building2, value: lead.company ?? "No company given" },
                  { icon: MapPin, value: SOURCE_LABEL[lead.source] ?? lead.source },
                ].map((row, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <row.icon size={16} strokeWidth={2} className="shrink-0 text-purple-600" />
                    <span className="truncate">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${CARD} p-4`}>
              <h2 className={`flex items-center gap-2 ${EYEBROW}`}>
                <CalendarDays size={15} strokeWidth={2} className="text-purple-600" />
                Submission date
              </h2>
              <p className="mt-2 text-[0.9rem] font-600 text-ink-950">{submitted.date}</p>
              <p className="text-[0.82rem] text-neutral-600">{submitted.time}</p>
              <h2 className={`mt-4 flex items-center gap-2 ${EYEBROW}`}>
                <Wrench size={15} strokeWidth={2} className="text-purple-600" />
                Service interest
              </h2>
              <p className="mt-2 text-[0.9rem] text-ink-950">
                {insights.services[0]?.label ?? "To be qualified"}
              </p>
            </div>
          </div>

          {/* Original challenge */}
          <div className={`${CARD} p-4 sm:p-5`}>
            <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-ink-950">
              <MessageSquare size={16} strokeWidth={2} className="text-purple-600" />
              Original challenge
            </h2>
            <p className="mt-2.5 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-neutral-700">
              {lead.message ?? "No message was shared. A first reply should invite them to tell us more."}
            </p>
          </div>

          {/* AI Insights */}
          <div className="overflow-hidden rounded-card bg-ink-950 p-4 shadow-medium sm:p-5">
            <h2 className="flex flex-wrap items-center gap-2 text-[0.95rem] font-700 text-white">
              <Sparkles size={17} strokeWidth={2} className="text-purple-400" />
              AI Insights
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.64rem] font-500 uppercase tracking-wide text-purple-100">
                {lead.scored_by === "ai" ? "Scored by Oge" : "Rules baseline"}
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.82rem] font-700 text-white">AI Summary</h3>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-purple-100/90">
                  {insights.summary}
                </p>
              </div>
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.82rem] font-700 text-white">Lead score</h3>
                <p className="mt-2 flex items-center gap-2 font-700" style={{ color: r.dot }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.dot }} />
                  <span className="text-[1.1rem]">{r.label === "Hot" ? "Hot Deal" : r.label}</span>
                </p>
                <p className="mt-1.5">
                  <span className="font-mono text-[2rem] font-700 leading-none text-white">
                    {lead.score ?? "–"}
                  </span>
                  <span className="text-[0.85rem] text-purple-100/60"> / 100</span>
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.82rem] font-700 text-white">Why this score</h3>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {insights.reasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-[0.86rem] text-purple-100/90">
                      <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-purple-400" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.82rem] font-700 text-white">Tone signals</h3>
                {insights.signals.length === 0 ? (
                  <p className="mt-2 text-[0.82rem] text-purple-100/60">
                    Too little detail to read tone yet.
                  </p>
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {insights.signals.map((signal) => (
                      <span
                        key={signal.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[0.76rem] font-500 text-purple-100"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                        {signal.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommended next step */}
          <div className={`${CARD} p-4 sm:p-5`}>
            <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-ink-950">
              <Target size={16} strokeWidth={2} className="text-purple-600" />
              Recommended next step
            </h2>
            <p className="mt-2.5 text-[0.92rem] font-600 text-ink-950">{insights.nextStep.headline}</p>
            <p className="mt-1 text-[0.9rem] leading-relaxed text-neutral-600">
              {insights.nextStep.detail}
            </p>
          </div>

          {/* Recommended services */}
          {insights.services.length > 0 ? (
            <div className={`${CARD} p-4 sm:p-5`}>
              <h2 className="text-[0.95rem] font-700 text-ink-950">Recommended services</h2>
              <p className="mt-1 text-[0.8rem] text-neutral-600">
                Matched deterministically from what the lead shared
                {insights.industry ? `, for ${insights.industry}` : ""}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {insights.services.map((service) => (
                  <a
                    key={service.href}
                    href={`https://nexoristech.com${service.href}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100/50 px-3 py-1.5 text-[0.82rem] font-600 text-purple-700 hover:bg-purple-100"
                  >
                    {service.label}
                    <ArrowUpRight size={13} strokeWidth={2.2} />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {/* AI follow-up email */}
          <div className={`${CARD} p-4 sm:p-5`}>
            <h2 className="flex flex-wrap items-center gap-2 text-[0.95rem] font-700 text-ink-950">
              <Mail size={16} strokeWidth={2} className="text-purple-600" />
              AI follow-up email
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[0.64rem] font-600 uppercase tracking-wide text-purple-700">
                {hasStored ? `${lead.followup_stage} stage` : "Suggested first reply"}
              </span>
            </h2>
            <div className="mt-3">
              <FollowUpPanel
                leadId={lead.id}
                initialDraft={panelDraft}
                initialDraftedBy={lead.followup_drafted_by ?? "template"}
                action={hasStored ? regenerateFollowUp : draftLeadReply}
                due={hasStored ? lead.followup_due : null}
                sent={lead.followup_sent_at !== null}
                canEdit={canEdit}
              />
            </div>
          </div>

          {/* Activity timeline */}
          <div className={`${CARD} p-4 sm:p-5`}>
            <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-ink-950">
              <History size={16} strokeWidth={2} className="text-purple-600" />
              Activity
            </h2>
            {activity.length === 0 ? (
              <p className="mt-2.5 text-[0.88rem] text-neutral-600">
                No activity logged yet. Stage changes, sent follow-ups, and notes appear here.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {activity.map((entry, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-purple-600" />
                      {i < activity.length - 1 ? (
                        <span className="w-px flex-1 bg-purple-200" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 pb-4">
                      <span className="block text-[0.88rem] text-ink-950">
                        {entry.note ?? entry.type}
                      </span>
                      <span className="block text-[0.76rem] text-neutral-600">
                        {[entry.actor, relTime(entry.created_at)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Documents */}
          {canEdit ? (
            <div className={`${CARD} p-4 sm:p-5`}>
              <h2 className="text-[0.95rem] font-700 text-ink-950">Documents</h2>
              <p className="mt-1 text-[0.8rem] text-neutral-600">
                Proposal, Scope of Work, Service Level Agreement, and Contract, in the Nexoris
                Technologies brand. Invoices are raised in Finance, never here.
              </p>
              <div className="mt-3">
                <GenerateDocument
                  {...(lead.name ? { defaultName: lead.name } : {})}
                  {...(lead.company ? { defaultCompany: lead.company } : {})}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Right rail: sticky stage + owner */}
        <aside className="lead-rail flex w-full shrink-0 flex-col gap-4 lg:w-72">
          <div className={`${CARD} p-4`}>
            <h2 className={EYEBROW}>Lifecycle stage</h2>
            <div className="mt-3">
              <StageControl leadId={lead.id} currentStatus={lead.status} />
            </div>
            {lead.status === "Lost" && lead.lost_reason ? (
              <p className="mt-3 text-[0.82rem] text-neutral-600">Reason: {lead.lost_reason}</p>
            ) : null}
            {lead.status === "Nurture" && lead.nurture_date ? (
              <p className="mt-3 text-[0.82rem] text-neutral-600">Revisit on {lead.nurture_date}</p>
            ) : null}
          </div>

          <div className={`${CARD} p-4`}>
            <h2 className={EYEBROW}>Owner</h2>
            <p className="mt-1.5 text-[0.9rem] font-600 text-ink-950">
              {lead.assignee_name ?? "Unassigned"}
            </p>
            {isAdmin ? (
              <div className="mt-4 flex flex-col gap-3">
                <form action={assignLead} className="flex flex-col gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <select
                    name="staffId"
                    defaultValue={lead.assigned_to ?? ""}
                    className="cursor-pointer rounded-card border border-neutral-200 p-2.5 text-[0.85rem] text-ink-950"
                  >
                    <option value="">Unassigned</option>
                    {salespeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-card bg-purple-600 px-3 py-2.5 text-[0.85rem] font-600 text-white hover:bg-purple-700"
                  >
                    Assign
                  </button>
                </form>
                <form action={autoAssignLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <button
                    type="submit"
                    className="cursor-pointer text-[0.82rem] font-600 text-purple-700 hover:text-purple-600"
                  >
                    Auto-assign by fit and capacity
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
