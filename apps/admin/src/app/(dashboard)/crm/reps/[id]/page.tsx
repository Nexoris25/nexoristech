/**
 * The Sales Rep Profile record view (PRD 5.6, 5.14). Admin-only. Shows the rep's name and contact
 * read from HR (the staff record) alongside their current open load, then the editable profile:
 * industries owned, capacity cap, territory, and weekly and monthly targets. The profile holds only
 * configuration; the person is created and granted access in People & Access, never here.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCapability } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";
import { RepProfileForm } from "./RepProfileForm.js";

export const dynamic = "force-dynamic";

interface Rep {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  industries: string[];
  capacity_cap: number | null;
  territory: string | null;
  open_count: number;
}

export default async function RepProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactNode> {
  await requireCapability("crm.assign");
  const { id } = await params;
  const pool = db();

  const [{ rows }, { rows: targetRows }] = await Promise.all([
    pool.query<Rep>(
      `SELECT s.id, s.name, s.email, s.role, s.active, s.industries, s.capacity_cap, s.territory,
              count(l.id) FILTER (WHERE l.status NOT IN ('Won','Lost'))::int AS open_count
         FROM staff s
         LEFT JOIN lead l ON l.assigned_to = s.id
        WHERE s.id = $1
        GROUP BY s.id`,
      [id],
    ),
    pool.query<{ metric: string; target: string }>(
      "SELECT metric, target::text FROM sales_target WHERE staff_id = $1",
      [id],
    ),
  ]);

  const rep = rows[0];
  if (!rep || rep.role !== "salesperson") notFound();

  const targets: Record<string, number> = {};
  for (const row of targetRows) targets[row.metric] = Number.parseInt(row.target, 10);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/crm/reps"
        className="inline-flex cursor-pointer items-center gap-1.5 text-[0.8rem] font-600 text-purple-700 hover:text-purple-600"
      >
        <ArrowLeft size={15} strokeWidth={2.2} /> Sales reps
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-roboto text-dash-title font-700 text-ink-950">{rep.name}</h1>
          <p className="mt-1 text-label text-neutral-600">
            {rep.email} · Read from HR. {rep.active ? "Active" : "Inactive"}.
          </p>
        </div>
        <span className="rounded-card border border-purple-200 bg-white px-3 py-1.5 text-label text-neutral-600">
          Open load{" "}
          <span className="font-mono font-700 text-ink-950">
            {rep.open_count}
            {rep.capacity_cap !== null ? ` / ${rep.capacity_cap}` : ""}
          </span>
        </span>
      </div>

      <div className="mt-5 rounded-card border border-purple-200 bg-white p-5 shadow-subtle">
        <RepProfileForm
          staffId={rep.id}
          industries={rep.industries}
          capacityCap={rep.capacity_cap}
          territory={rep.territory}
          targets={targets}
        />
      </div>
    </div>
  );
}
