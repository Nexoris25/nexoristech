/**
 * HR - Departments (PRD 7.2). A simple, expandable list; every employee belongs to exactly one.
 * Department is descriptive organizational data and does not by itself grant module access (3.2).
 */
import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage(): Promise<ReactNode> {
  await requireAdmin();
  const { rows } = await db().query<{ id: string; name: string; description: string | null; c: number }>(
    `SELECT d.id, d.name, d.description, count(e.id)::int c
       FROM hr_department d LEFT JOIN employee e ON e.department_id = d.id
      GROUP BY d.id ORDER BY d.name`,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Departments</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Every employee belongs to one department. It does not grant module access on its own.</p>

      <div className="mt-5 flex flex-col gap-2.5">
        {rows.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEEBFC] text-[#543CDA]"><Building2 size={18} strokeWidth={2} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9rem] font-600 text-slate-900">{d.name}</p>
              {d.description ? <p className="truncate text-[0.8rem] text-slate-500">{d.description}</p> : null}
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 font-mono text-[0.74rem] font-700 text-slate-600">{d.c} {d.c === 1 ? "person" : "people"}</span>
          </div>
        ))}
      </div>

      <form action="/api/hr/departments" method="post" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.9rem] font-700 text-slate-900">Add a department</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input name="name" required placeholder="Department name" className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
          <input name="description" placeholder="Description (optional)" className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
          <button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.86rem] font-600 text-white hover:bg-[#4330B8]">Add</button>
        </div>
      </form>
    </div>
  );
}
