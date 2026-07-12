/**
 * Sales Rep Profiles (PRD 5.6). Admin-only. The CRM roster: each salesperson granted CRM access,
 * with the Sales Rep Profile configuration that drives round-robin assignment (industries owned,
 * capacity cap) and their current open-lead load against that cap. The profile holds only
 * configuration; the name and contact are read live from HR. People are created and granted access
 * in People & Access, never here.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { UserCog } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface RepRow {
  id: string;
  name: string;
  email: string;
  industries: string[];
  capacity_cap: number | null;
  open_count: number;
}

function industryLabel(slug: string): string {
  return slug
    .replace(/-software$|-solutions$/g, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function SalesRepsPage(): Promise<ReactNode> {
  await requireAdmin();

  const { rows } = await db().query<RepRow>(
    `SELECT s.id, s.name, s.email, s.industries, s.capacity_cap,
            count(l.id) FILTER (WHERE l.status NOT IN ('Won','Lost'))::int AS open_count
       FROM staff s
       LEFT JOIN lead l ON l.assigned_to = s.id
      WHERE s.active = true AND s.role = 'salesperson'
      GROUP BY s.id
      ORDER BY s.name`,
  );

  const configured = rows.filter((r) => r.capacity_cap !== null || r.industries.length > 0);
  const unconfigured = rows.filter((r) => r.capacity_cap === null && r.industries.length === 0);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-roboto text-dash-title font-700 text-ink-950">Sales reps</h1>
          <p className="mt-1 text-label text-neutral-600">
            The CRM roster and each rep&apos;s capacity and industries. Configured in People &amp;
            Access.
          </p>
        </div>
        <Link
          href="/people"
          className="rounded-card bg-purple-600 px-3 py-2 text-[0.8rem] font-600 text-white hover:bg-purple-700"
        >
          People &amp; Access
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-purple-200 bg-white py-10 text-center">
          <UserCog size={24} strokeWidth={1.8} className="text-purple-600" />
          <p className="max-w-sm text-label text-neutral-600">
            No salespeople yet. Grant a person from HR the Salesperson role in People &amp; Access,
            then set their capacity and industries.
          </p>
        </div>
      ) : (
        <>
          {unconfigured.length > 0 ? (
            <p className="mt-5 rounded-card border border-purple-200 bg-purple-100/50 px-4 py-3 text-[0.8rem] text-ink-950">
              <span className="font-600">{unconfigured.length} unconfigured rep{unconfigured.length === 1 ? "" : "s"}.</span>{" "}
              Until a capacity or industries are set, they are excluded from the round-robin.
            </p>
          ) : null}

          <div className="mt-5 overflow-x-auto rounded-card border border-purple-200 bg-white shadow-subtle">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-purple-200 text-dash-table-header text-neutral-600">
                  <th className="px-4 py-2.5 font-600 sm:px-5">Salesperson</th>
                  <th className="px-4 py-2.5 font-600">Industries owned</th>
                  <th className="px-4 py-2.5 font-600">Capacity</th>
                  <th className="px-4 py-2.5 font-600">Open load</th>
                </tr>
              </thead>
              <tbody>
                {[...configured, ...unconfigured].map((rep) => {
                  const overCap =
                    rep.capacity_cap !== null && rep.open_count >= rep.capacity_cap;
                  return (
                    <tr key={rep.id} className="border-b border-purple-200/50 last:border-b-0">
                      <td className="px-4 py-3 sm:px-5">
                        <span className="block text-dash-data font-600 text-ink-950">{rep.name}</span>
                        <span className="block text-[0.72rem] text-neutral-600">{rep.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        {rep.industries.length === 0 ? (
                          <span className="text-[0.78rem] text-neutral-600">Any</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {rep.industries.slice(0, 3).map((slug) => (
                              <span
                                key={slug}
                                className="rounded-full bg-purple-100 px-2 py-0.5 text-[0.68rem] font-600 text-purple-700"
                              >
                                {industryLabel(slug)}
                              </span>
                            ))}
                            {rep.industries.length > 3 ? (
                              <span className="text-[0.7rem] text-neutral-600">
                                +{rep.industries.length - 3}
                              </span>
                            ) : null}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[0.8rem] text-neutral-600">
                        {rep.capacity_cap ?? "Not set"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-[0.8rem] font-700 ${
                            overCap ? "text-purple-700" : "text-ink-950"
                          }`}
                        >
                          {rep.open_count}
                          {rep.capacity_cap !== null ? ` / ${rep.capacity_cap}` : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
