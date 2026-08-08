"use client";
/**
 * The interactive pipeline board. Each column is a stage; cards are draggable between them. Dropping a
 * card in another column moves the lead there and optimistically updates the board, then persists via
 * /api/crm/stage (which also regenerates the Oge follow-up for the new stage). Won, Lost, and Nurture
 * need extra input, so a drop there sends the user to the lead page to finish the move. A click (not a
 * drag) opens the lead. Viewers see the board but cannot drag.
 */
import { useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { rating } from "../../../../lib/lead-ui.js";

export interface BoardLead {
  id: string; name: string | null; company: string | null; score: number | null;
  band: string | null; status: string; assigned_name: string | null; deal_value: string | null;
}
const NEEDS_DETAIL = new Set(["Won", "Lost", "Nurture"]);

function naira(value: string | null): string | null {
  const n = value === null ? NaN : Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 1_000_000) return `NGN ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `NGN ${(n / 1_000).toFixed(0)}k`;
  return `NGN ${n.toLocaleString("en-NG")}`;
}

export function PipelineBoard({ initialLeads, stages, canDrag }: { initialLeads: BoardLead[]; stages: readonly string[]; canDrag: boolean }): ReactNode {
  const router = useRouter();
  const [leads, setLeads] = useState<BoardLead[]>(initialLeads);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  async function move(leadId: string, target: string): Promise<void> {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === target) return;
    if (NEEDS_DETAIL.has(target)) {
      // Deal value / lost reason / revival date are captured on the lead page.
      router.push(`/crm/${leadId}`);
      return;
    }
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, status: target } : l))); // optimistic
    try {
      const res = await fetch("/api/crm/stage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, status: target }) });
      const data = (await res.json()) as { ok?: boolean; needsDetail?: boolean; error?: string };
      if (data.needsDetail) { router.push(`/crm/${leadId}`); return; }
      if (!res.ok || !data.ok) { setLeads(prev); return; }
      router.refresh();
    } catch {
      setLeads(prev); // revert on failure
    }
  }

  function onDrop(e: DragEvent, stage: string): void {
    e.preventDefault();
    setOverStage(null);
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDragId(null);
    if (id) void move(id, stage);
  }

  return (
    <div className="mt-5 flex gap-3 overflow-x-auto pb-3">
      {stages.map((stage) => {
        const inStage = leads.filter((l) => l.status === stage);
        const wonValue = stage === "Won" ? inStage.reduce((s, l) => s + (Number.parseFloat(l.deal_value ?? "0") || 0), 0) : 0;
        const isOver = overStage === stage && canDrag && dragId !== null;
        return (
          <section
            key={stage}
            onDragOver={canDrag ? (e) => { e.preventDefault(); setOverStage(stage); } : undefined}
            onDragLeave={canDrag ? () => setOverStage((s) => (s === stage ? null : s)) : undefined}
            onDrop={canDrag ? (e) => onDrop(e, stage) : undefined}
            className={`flex w-64 shrink-0 flex-col rounded-card border bg-neutral-50 transition-colors ${isOver ? "border-[#543CDA] bg-[#F4F1FD] ring-1 ring-[#543CDA]/30" : "border-purple-200"}`}
          >
            <header className="flex items-center justify-between gap-2 border-b border-purple-200 px-3 py-2.5">
              <h2 className="truncate text-[0.82rem] font-700 text-ink-950">{stage}</h2>
              <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 font-mono text-[0.68rem] font-700 text-purple-700">{inStage.length}</span>
            </header>
            {stage === "Won" && wonValue > 0 ? (
              <p className="border-b border-purple-200 px-3 py-1.5 text-[0.72rem] text-neutral-600">Sales Won Value <span className="font-mono font-700 text-ink-950">{naira(String(wonValue))}</span></p>
            ) : null}
            <div className="flex flex-1 flex-col gap-2 p-2">
              {inStage.length === 0 ? (
                <p className="px-1 py-6 text-center text-[0.72rem] text-neutral-500">{isOver ? "Drop to move here" : "No leads here."}</p>
              ) : (
                inStage.map((lead) => {
                  const r = rating(lead.band);
                  const dealText = naira(lead.deal_value);
                  const dragging = dragId === lead.id;
                  return (
                    <div
                      key={lead.id}
                      draggable={canDrag}
                      onDragStart={canDrag ? (e) => { e.dataTransfer.setData("text/plain", lead.id); e.dataTransfer.effectAllowed = "move"; setDragId(lead.id); } : undefined}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      onClick={() => router.push(`/crm/${lead.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/crm/${lead.id}`); }}
                      className={`rounded-card border border-purple-200 bg-white p-2.5 shadow-subtle transition-all hover:border-purple-300 hover:bg-purple-100/40 ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${dragging ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 flex-1 truncate text-[0.82rem] font-600 text-ink-950">{lead.name ?? "Unnamed"}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[0.62rem] font-700 ${r.solid}`}>{lead.score ?? "–"}</span>
                      </div>
                      {lead.company ? <span className="mt-0.5 block truncate text-[0.72rem] text-neutral-600">{lead.company}</span> : null}
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[0.68rem] text-neutral-600">
                        <span className="truncate">{lead.assigned_name ?? "Unassigned"}</span>
                        {dealText ? <span className="shrink-0 font-mono font-700 text-purple-700">{dealText}</span> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
