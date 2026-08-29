/**
 * CRM - Leads (Batch 3, screen 1). Manage and track all leads: a tabbed status bar with live
 * counts, a table with the lead, company, contact, Oge lead score, status, source, and created
 * date, and pagination. Every figure is live from the CRM; Oge scores each lead on arrival. A
 * salesperson sees their own leads; admins and viewers see all.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Search, Upload, Plus, ArrowUpRight } from "lucide-react";
import { requireCapability } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { SOURCE_LABEL } from "../../../lib/lead-ui.js";

export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  score: number | null;
  band: string | null;
  status: string;
  source: string;
  created_at: string;
}

const BAND_STYLE: Record<string, { badge: string; dot: string }> = {
  Hot: { badge: "bg-[#FEE2E2] text-[#B91C1C]", dot: "#EF4444" },
  Warm: { badge: "bg-[#FEF3C7] text-[#B45309]", dot: "#F59E0B" },
  Cold: { badge: "bg-[#DBEAFE] text-[#1D4ED8]", dot: "#3B82F6" },
};

function bandOf(band: string | null): { badge: string; dot: string } {
  return BAND_STYLE[band ?? ""] ?? { badge: "bg-slate-100 text-slate-600", dot: "#94A3B8" };
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

const TABS = [
  { key: "all", label: "All Leads" },
  { key: "New", label: "New" },
  { key: "Hot", label: "Hot" },
  { key: "Warm", label: "Warm" },
  { key: "Cold", label: "Cold" },
  { key: "Qualified", label: "Qualified" },
  { key: "Won", label: "Converted" },
  { key: "Lost", label: "Lost" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}): Promise<ReactNode> {
  const staff = await requireCapability("crm.read");
  const { tab = "all", q } = await searchParams;
  const query = (q ?? "").trim();
  const mine = staff.role === "salesperson";
  const pool = db();

  const scope: string[] = [];
  const scopeParams: unknown[] = [];
  if (mine) {
    scopeParams.push(staff.id);
    scope.push(`assigned_to = $${scopeParams.length}`);
  }
  const scopeWhere = scope.length ? `WHERE ${scope.join(" AND ")}` : "";

  const conditions = [...scope];
  const params = [...scopeParams];
  if (["New", "Qualified", "Won", "Lost"].includes(tab)) {
    params.push(tab);
    conditions.push(`status = $${params.length}`);
  } else if (["Hot", "Warm", "Cold"].includes(tab)) {
    params.push(tab);
    conditions.push(`band = $${params.length}`);
  }
  if (query) {
    params.push(`%${query}%`);
    conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR company ILIKE $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [{ rows }, { rows: counts }] = await Promise.all([
    pool.query<LeadRow>(
      `SELECT id, name, company, email, phone, score, band, status, source, created_at
         FROM lead ${where} ORDER BY score DESC NULLS LAST, created_at DESC LIMIT 50`,
      params,
    ),
    pool.query<{ total: number; nw: number; hot: number; warm: number; cold: number; qualified: number; won: number; lost: number }>(
      `SELECT count(*)::int total,
              count(*) FILTER (WHERE status='New')::int nw,
              count(*) FILTER (WHERE band='Hot')::int hot,
              count(*) FILTER (WHERE band='Warm')::int warm,
              count(*) FILTER (WHERE band='Cold')::int cold,
              count(*) FILTER (WHERE status='Qualified')::int qualified,
              count(*) FILTER (WHERE status='Won')::int won,
              count(*) FILTER (WHERE status='Lost')::int lost
         FROM lead ${scopeWhere}`,
      scopeParams,
    ),
  ]);
  const c = counts[0]!;
  const tabCount: Record<string, number> = { all: c.total, New: c.nw, Hot: c.hot, Warm: c.warm, Cold: c.cold, Qualified: c.qualified, Won: c.won, Lost: c.lost };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Leads</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Manage and track all your leads in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <form action="/crm" className="relative hidden sm:block">
            <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input name="q" defaultValue={query} placeholder="Search leads..." className="w-52 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[0.83rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
          </form>
          <Link href="/crm/create" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">
            <Upload size={15} strokeWidth={2} /> Import Leads
          </Link>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/crm" : `/crm?tab=${t.key}`}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[0.83rem] font-600 transition-colors ${
                active ? "border-[#543CDA] text-[#543CDA]" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[0.68rem] font-700 ${active ? "bg-[#EEEBFC] text-[#543CDA]" : "bg-slate-100 text-slate-600"}`}>
                {tabCount[t.key] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <span className="text-[0.78rem] text-slate-500">{rows.length} shown</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.88rem] text-slate-500">No leads match this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-600">Lead</th>
                  <th className="px-5 py-3 font-600">Company</th>
                  <th className="px-5 py-3 font-600">Lead Score</th>
                  <th className="px-5 py-3 font-600">Status</th>
                  <th className="px-5 py-3 font-600">Source</th>
                  <th className="px-5 py-3 font-600" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const b = bandOf(l.band);
                  return (
                    <tr key={l.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link href={`/crm/${l.id}`} className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 font-mono text-[0.64rem] font-700 text-slate-600">{initials(l.name)}</span>
                          <span className="text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{l.name ?? "Unnamed"}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[0.83rem] text-slate-600">{l.company ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex min-w-[34px] justify-center rounded-md px-2 py-1 font-mono text-[0.76rem] font-700 ${b.badge}`}>{l.score ?? "–"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-600 text-slate-700">
                          <span className="h-2 w-2 rounded-full" style={{ background: b.dot }} />
                          {l.band ?? l.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[0.82rem] text-slate-600">{SOURCE_LABEL[l.source] ?? l.source}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/crm/${l.id}`} aria-label="View" className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-[#F4F1FD] hover:text-[#543CDA]"><ArrowUpRight size={16} strokeWidth={2} /></Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <span className="text-[0.78rem] text-slate-500">Showing 1 to {rows.length} of {c.total} leads</span>
          <Link href="/crm/board" className="inline-flex items-center gap-1 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">
            <Plus size={13} strokeWidth={2.2} /> Pipeline view
          </Link>
        </div>
      </div>
    </div>
  );
}
