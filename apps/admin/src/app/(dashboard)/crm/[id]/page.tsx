/**
 * The lead detail (PRD 5.8, 5.9): the sales workspace for a single lead. Header with the score
 * band; contact and submission cards; the lead's original challenge in its own words; the AI
 * Insights panel (summary, lead score, the reasons behind the score, and the tone signals detected
 * in the lead's message); the recommended next step; and the Oge follow-up email with Regenerate
 * and Copy. The right rail holds the lifecycle stage control and ownership. Everything is grounded
 * in the lead's real data. Brand tokens only.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Check,
  Flame,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";
import { assignLead, autoAssignLead } from "../../../../lib/people-actions.js";
import { deriveInsights } from "../../../../lib/lead-insights.js";
import { followUpTemplate } from "../../../../lib/followup.js";
import { draftLeadReply, regenerateFollowUp } from "../../../../lib/crm-actions.js";
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

const SOURCE_LABEL: Record<string, string> = {
  "contact-form": "Contact form",
  "oge-chat": "Oge chat",
  "solution-finder": "Solution Finder",
  whatsapp: "WhatsApp",
  email: "Email",
  referral: "Referral",
};

const BAND_META: Record<string, { label: string; className: string }> = {
  Hot: { label: "Hot Deal", className: "bg-purple-100 text-purple-700" },
  Warm: { label: "Warm", className: "bg-purple-100/70 text-purple-700" },
  Cold: { label: "Cold", className: "bg-neutral-100 text-neutral-600" },
};

const SIGNAL_CLASS: Record<string, string> = {
  urgent: "border-purple-300 text-purple-700",
  growth: "border-purple-300 text-purple-700",
  goal: "border-purple-300 text-purple-700",
  budget: "border-purple-300 text-purple-700",
  detail: "border-purple-300 text-purple-700",
};

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
            l.followup_stage, l.followup_draft, l.followup_drafted_by, l.followup_due,
            l.followup_sent_at, s.name AS assignee_name
       FROM lead l
       LEFT JOIN staff s ON s.id = l.assigned_to
      WHERE l.id = $1`,
    [id],
  );
  const lead = rows[0];
  if (!lead) notFound();

  const salespeople = isAdmin
    ? (
        await pool.query<{ id: string; name: string }>(
          "SELECT id, name FROM staff WHERE active = true AND role = 'salesperson' ORDER BY name",
        )
      ).rows
    : [];

  const insights = deriveInsights(lead);
  const submitted = dateParts(lead.created_at);
  const band = BAND_META[lead.band ?? ""] ?? { label: "Unscored", className: "bg-neutral-100 text-neutral-600" };

  // The follow-up panel always has a draft. An advanced lead has a stored, stage-specific one with
  // a send-by date; a New lead shows a ready opening reply and regenerates through the reply action.
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
    <div className="mx-auto max-w-4xl pb-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-roboto text-dash-title font-700 text-ink-950">
            {lead.name ?? "Unnamed lead"}
          </h1>
          {lead.company ? (
            <p className="mt-0.5 text-label text-neutral-600">{lead.company}</p>
          ) : null}
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.78rem] font-600 ${band.className}`}
          >
            <Flame size={13} strokeWidth={2} />
            {band.label}
          </span>
        </div>
        <Link
          href="/crm"
          aria-label="Back to leads"
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-neutral-200 text-neutral-600 hover:border-purple-300 hover:text-purple-700"
        >
          <X size={17} strokeWidth={2} />
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Contact + submission */}
          <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2">
            <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
              <h2 className="text-[0.72rem] font-600 uppercase tracking-wide text-neutral-600">
                Contact details
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5 text-dash-data text-ink-950">
                <li className="flex items-center gap-2.5">
                  <Mail size={15} strokeWidth={2} className="shrink-0 text-purple-600" />
                  <span className="truncate">{lead.email ?? "No email given"}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone size={15} strokeWidth={2} className="shrink-0 text-purple-600" />
                  <span className="truncate">{lead.phone ?? "No phone given"}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Building2 size={15} strokeWidth={2} className="shrink-0 text-purple-600" />
                  <span className="truncate">{lead.company ?? "No company given"}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin size={15} strokeWidth={2} className="shrink-0 text-purple-600" />
                  <span className="truncate">{SOURCE_LABEL[lead.source] ?? lead.source}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
              <h2 className="flex items-center gap-2 text-[0.72rem] font-600 uppercase tracking-wide text-neutral-600">
                <CalendarDays size={14} strokeWidth={2} className="text-purple-600" />
                Submission date
              </h2>
              <p className="mt-2 text-dash-data font-600 text-ink-950">{submitted.date}</p>
              <p className="text-[0.78rem] text-neutral-600">{submitted.time}</p>
              <h2 className="mt-4 flex items-center gap-2 text-[0.72rem] font-600 uppercase tracking-wide text-neutral-600">
                <Wrench size={14} strokeWidth={2} className="text-purple-600" />
                Service interest
              </h2>
              <p className="mt-2 text-dash-data text-ink-950">
                {insights.services[0]?.label ?? "To be qualified"}
              </p>
            </div>
          </div>

          {/* Original challenge */}
          <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="flex items-center gap-2 text-[0.85rem] font-700 text-ink-950">
              <MessageSquare size={15} strokeWidth={2} className="text-purple-600" />
              Original challenge
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-dash-data leading-relaxed text-neutral-600">
              {lead.message ?? "No message was shared. A first reply should invite them to tell us more."}
            </p>
          </div>

          {/* AI Insights */}
          <div className="overflow-hidden rounded-card bg-ink-950 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[0.85rem] font-700 text-white">
              <Sparkles size={16} strokeWidth={2} className="text-purple-400" />
              AI Insights
              <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[0.62rem] font-500 uppercase tracking-wide text-purple-100">
                {lead.scored_by === "ai" ? "Scored by Oge" : "Rules baseline"}
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.78rem] font-700 text-white">AI Summary</h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-purple-100/85">
                  {insights.summary}
                </p>
              </div>
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.78rem] font-700 text-white">Lead score</h3>
                <p className="mt-2 flex items-center gap-1.5 text-purple-300">
                  <Flame size={16} strokeWidth={2} />
                  <span className="text-[1.05rem] font-700">{band.label}</span>
                </p>
                <p className="mt-1">
                  <span className="font-mono text-[1.75rem] font-700 leading-none text-white">
                    {lead.score ?? "–"}
                  </span>
                  <span className="text-[0.8rem] text-purple-100/60"> / 100</span>
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.78rem] font-700 text-white">Why this score</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {insights.reasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-[0.82rem] text-purple-100/85">
                      <Check size={15} strokeWidth={2.4} className="mt-0.5 shrink-0 text-purple-400" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-card bg-white/[0.06] p-4">
                <h3 className="text-[0.78rem] font-700 text-white">Tone signals</h3>
                {insights.signals.length === 0 ? (
                  <p className="mt-2 text-[0.78rem] text-purple-100/60">
                    Too little detail to read tone yet.
                  </p>
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {insights.signals.map((signal) => (
                      <span
                        key={signal.label}
                        className={`inline-flex items-center gap-1.5 rounded-full border bg-white/[0.04] px-2.5 py-1 text-[0.72rem] font-500 text-purple-100 ${SIGNAL_CLASS[signal.tone]}`}
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
          <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="flex items-center gap-2 text-[0.85rem] font-700 text-ink-950">
              <MessageSquare size={15} strokeWidth={2} className="text-purple-600" />
              Recommended next step
            </h2>
            <p className="mt-2 text-dash-data font-600 text-ink-950">
              {insights.nextStep.headline}
            </p>
            <p className="mt-1 text-dash-data leading-relaxed text-neutral-600">
              {insights.nextStep.detail}
            </p>
          </div>

          {/* AI follow-up email */}
          <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="flex flex-wrap items-center gap-2 text-[0.85rem] font-700 text-ink-950">
              <Mail size={15} strokeWidth={2} className="text-purple-600" />
              AI follow-up email
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[0.62rem] font-600 uppercase tracking-wide text-purple-700">
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

          {/* Documents */}
          {canEdit ? (
            <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
              <h2 className="text-[0.85rem] font-700 text-ink-950">Documents</h2>
              <p className="mt-1 text-[0.78rem] text-neutral-600">
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

        {/* Right rail: stage + ownership */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-72">
          <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
            <h2 className="text-[0.72rem] font-600 uppercase tracking-wide text-neutral-600">
              Lifecycle stage
            </h2>
            <div className="mt-3">
              <StageControl leadId={lead.id} currentStatus={lead.status} />
            </div>
            {lead.status === "Lost" && lead.lost_reason ? (
              <p className="mt-3 text-[0.78rem] text-neutral-600">Reason: {lead.lost_reason}</p>
            ) : null}
            {lead.status === "Nurture" && lead.nurture_date ? (
              <p className="mt-3 text-[0.78rem] text-neutral-600">
                Revisit on {lead.nurture_date}
              </p>
            ) : null}
          </div>

          <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
            <h2 className="text-[0.72rem] font-600 uppercase tracking-wide text-neutral-600">
              Owner
            </h2>
            <p className="mt-1.5 text-dash-data font-600 text-ink-950">
              {lead.assignee_name ?? "Unassigned"}
            </p>
            {isAdmin ? (
              <div className="mt-4 flex flex-col gap-3">
                <form action={assignLead} className="flex flex-col gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <select
                    name="staffId"
                    defaultValue={lead.assigned_to ?? ""}
                    className="cursor-pointer rounded-card border border-neutral-200 p-2 text-[0.8rem] text-ink-950"
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
                    className="cursor-pointer rounded-card bg-purple-600 px-3 py-2 text-[0.8rem] font-600 text-white hover:bg-purple-700"
                  >
                    Assign
                  </button>
                </form>
                <form action={autoAssignLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <button
                    type="submit"
                    className="cursor-pointer text-[0.78rem] font-600 text-purple-700 hover:text-purple-600"
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
