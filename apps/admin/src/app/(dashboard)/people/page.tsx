/**
 * HR - Employee Directory (PRD 7.10, list view). HR is the only place a person is created (3.1).
 * The directory lists everyone in the employee and contract register with their department, job
 * title, type, and lifecycle status, and links to the record. Onboarding, contract register,
 * leave, expense claims, and offboarding are reached from the sub-nav. HR Admin / HR Assistant.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Search, UserPlus, Users2, UserCheck, CalendarClock, LogOut } from "lucide-react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  full_name: string;
  staff_number: string | null;
  job_title: string | null;
  department: string | null;
  employment_type: string;
  employment_status: string;
  date_joined: string | null;
}

const STATUS: Record<string, string> = {
  Probation: "bg-[#FEF3C7] text-[#B45309]",
  Confirmed: "bg-[#DCFCE7] text-[#15803D]",
  "On Leave": "bg-[#DBEAFE] text-[#1D4ED8]",
  Exited: "bg-slate-100 text-slate-600",
};

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export default async function EmployeeDirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string; dept?: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { q, dept } = await searchParams;
  const query = (q ?? "").trim();
  const pool = db();

  const where: string[] = [];
  const params: unknown[] = [];
  if (query) { params.push(`%${query}%`); where.push(`(e.full_name ILIKE $${params.length} OR e.staff_number ILIKE $${params.length} OR e.job_title ILIKE $${params.length})`); }
  if (dept) { params.push(dept); where.push(`d.name = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [{ rows }, { rows: depts }, { rows: kpi }] = await Promise.all([
    pool.query<Row>(
      `SELECT e.id, e.full_name, e.staff_number, e.job_title, d.name AS department,
              e.employment_type, e.employment_status, e.date_joined::text
         FROM employee e LEFT JOIN hr_department d ON d.id = e.department_id
         ${whereSql} ORDER BY e.full_name LIMIT 100`,
      params,
    ),
    pool.query<{ name: string; c: number }>(
      `SELECT d.name, count(e.id)::int c FROM hr_department d LEFT JOIN employee e ON e.department_id = d.id GROUP BY d.name ORDER BY d.name`,
    ),
    pool.query<{ total: number; confirmed: number; on_leave: number; probation: number }>(
      `SELECT count(*)::int total,
              count(*) FILTER (WHERE employment_status='Confirmed')::int confirmed,
              count(*) FILTER (WHERE employment_status='On Leave')::int on_leave,
              count(*) FILTER (WHERE employment_status='Probation')::int probation
         FROM employee`,
    ),
  ]);
  const k = kpi[0]!;

  const cards = [
    { label: "Total People", value: k.total, icon: <Users2 size={16} strokeWidth={2} />, tint: "bg-[#EEEBFC] text-[#543CDA]" },
    { label: "Confirmed", value: k.confirmed, icon: <UserCheck size={16} strokeWidth={2} />, tint: "bg-[#DCFCE7] text-[#15803D]" },
    { label: "On Probation", value: k.probation, icon: <CalendarClock size={16} strokeWidth={2} />, tint: "bg-[#FEF3C7] text-[#B45309]" },
    { label: "On Leave", value: k.on_leave, icon: <LogOut size={16} strokeWidth={2} />, tint: "bg-[#DBEAFE] text-[#2563EB]" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Employee Directory</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Everyone on the Nexoris Technologies team. HR is the one place a person is created.</p>
        </div>
        <Link href="/people/onboard" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">
          <UserPlus size={15} strokeWidth={2} /> Onboard Employee
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="flex items-start justify-between">
              <p className="text-[0.8rem] font-500 text-slate-500">{c.label}</p>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${c.tint}`}>{c.icon}</span>
            </div>
            <p className="mt-2 font-mono text-[1.6rem] font-700 leading-none text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form action="/people" className="relative flex-1 min-w-[200px]">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input name="q" defaultValue={query} placeholder="Search by name, staff ID, or title..." className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[0.84rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
        </form>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-[0.92rem] font-600 text-slate-700">No employees yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[0.85rem] text-slate-500">Onboard the first person to build the register. Every module grants access against these records.</p>
            <Link href="/people/onboard" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]"><UserPlus size={15} strokeWidth={2} /> Onboard Employee</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-600">Employee</th>
                  <th className="px-5 py-3 font-600">Staff ID</th>
                  <th className="px-5 py-3 font-600">Department</th>
                  <th className="px-5 py-3 font-600">Job Title</th>
                  <th className="px-5 py-3 font-600">Type</th>
                  <th className="px-5 py-3 font-600">Status</th>
                  <th className="px-5 py-3 font-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/people/${r.id}`} className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 font-mono text-[0.64rem] font-700 text-slate-600">{initials(r.full_name)}</span>
                        <span className="text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-[0.82rem] text-slate-600">{r.staff_number ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.department ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.job_title ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.employment_type}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${STATUS[r.employment_status] ?? "bg-slate-100 text-slate-600"}`}>{r.employment_status}</span></td>
                    <td className="px-5 py-3 whitespace-nowrap text-[0.83rem] text-slate-600">{r.date_joined ? new Date(r.date_joined).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-200 px-5 py-3 text-[0.78rem] text-slate-500">Showing {rows.length} of {k.total} · {depts.map((d) => `${d.name} (${d.c})`).join(" · ")}</div>
      </div>
    </div>
  );
}
