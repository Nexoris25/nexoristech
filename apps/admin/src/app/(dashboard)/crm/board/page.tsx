/**
 * The pipeline board (PRD 5.14): the lead and deal pipeline as a stage-by-stage board, the visual
 * companion to the list at /crm. Each column is a lifecycle stage; each card is a lead, hottest first.
 * Cards drag between stages to move a lead (PipelineBoard, client). A salesperson sees their own leads;
 * admins and viewers see the team. Won columns show the Sales Won Value, never labelled Revenue.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { STAGES } from "../../../../lib/crm-constants.js";
import { PipelineBoard, type BoardLead } from "./PipelineBoard.js";

export const dynamic = "force-dynamic";

export default async function PipelineBoardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }): Promise<ReactNode> {
  const staff = await requireStaff();
  const asList = (await searchParams).view === "list";
  const mine = staff.role === "salesperson";
  const where = mine ? "WHERE l.assigned_to = $1" : "";
  const params = mine ? [staff.id] : [];

  const { rows } = await db().query<BoardLead>(
    `SELECT l.id, l.name, l.company, l.score, l.band, l.status, l.deal_value::text,
            s.name AS assigned_name
       FROM lead l LEFT JOIN staff s ON s.id = l.assigned_to
      ${where}
      ORDER BY l.score DESC NULLS LAST, l.created_at DESC`,
    params,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-roboto text-dash-title font-700 text-ink-950">Pipeline board</h1>
          <p className="mt-1 text-label text-neutral-600">
            {mine ? "Your pipeline by stage, hottest first." : "The team pipeline by stage."}
            {staff.role !== "viewer" ? " Drag a card to move a lead." : ""}
          </p>
        </div>
        {/* Board and List are two views of this same pipeline, not two different screens. */}
        <div className="flex items-center gap-1 rounded-card border border-purple-200 bg-white p-1 text-[0.78rem] font-600">
          <Link href="/crm/board" aria-current={!asList ? "page" : undefined}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 ${!asList ? "bg-purple-600 text-white" : "text-neutral-600 hover:bg-purple-100 hover:text-purple-700"}`}>
            <LayoutGrid size={14} strokeWidth={2.2} /> Board
          </Link>
          <Link href="/crm/board?view=list" aria-current={asList ? "page" : undefined}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 ${asList ? "bg-purple-600 text-white" : "text-neutral-600 hover:bg-purple-100 hover:text-purple-700"}`}>
            <List size={14} strokeWidth={2.2} /> List
          </Link>
        </div>
      </div>

      {asList ? <PipelineList leads={rows} /> : <PipelineBoard initialLeads={rows} stages={STAGES} canDrag={staff.role !== "viewer"} />}
    </div>
  );
}

/** The same pipeline as a grouped list: one section per stage, in stage order, hottest lead first. */
function PipelineList({ leads }: { leads: BoardLead[] }): ReactNode {
  const money = (v: string | null): string => (v ? `₦${Number(v).toLocaleString("en-NG")}` : "—");
  return (
    <div className="mt-5 flex flex-col gap-4">
      {STAGES.map((stage) => {
        const inStage = leads.filter((l) => l.status === stage);
        if (inStage.length === 0) return null;
        return (
          <section key={stage} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="text-[0.9rem] font-700 text-slate-900">{stage}</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.72rem] font-600 text-slate-600">{inStage.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-2.5 font-600">Lead</th><th className="px-5 py-2.5 font-600">Company</th><th className="px-5 py-2.5 font-600">Owner</th><th className="px-5 py-2.5 text-right font-600">Score</th><th className="px-5 py-2.5 text-right font-600">Value</th></tr></thead>
                <tbody>
                  {inStage.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                      <td className="px-5 py-2.5"><Link href={`/crm/${l.id}`} className="text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{l.name}</Link></td>
                      <td className="px-5 py-2.5 text-[0.82rem] text-slate-600">{l.company ?? "—"}</td>
                      <td className="px-5 py-2.5 text-[0.82rem] text-slate-600">{l.assigned_name ?? "Unassigned"}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-[0.82rem] font-600 tabular-nums text-slate-800">{l.score ?? "—"}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{money(l.deal_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
