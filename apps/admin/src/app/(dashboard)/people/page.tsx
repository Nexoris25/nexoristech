/**
 * People management (PRD 2.5): the staff list with open-lead counts, an add-staff form, and
 * deactivation. Admin-only. History is preserved; deactivation just ends access and returns open
 * leads to the admin queue.
 */
import type { ReactNode } from "react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { deactivateStaff } from "../../../lib/people-actions.js";
import { AddStaffForm } from "./AddStaffForm.js";

export const dynamic = "force-dynamic";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  capacity_cap: number | null;
  open_count: string;
}

export default async function PeoplePage(): Promise<ReactNode> {
  await requireAdmin();

  const { rows } = await db().query<StaffRow>(
    `SELECT s.id, s.name, s.email, s.role, s.active, s.capacity_cap,
            count(l.id) FILTER (WHERE l.status NOT IN ('Won', 'Lost'))::text AS open_count
       FROM staff s
       LEFT JOIN lead l ON l.assigned_to = s.id
      GROUP BY s.id
      ORDER BY s.active DESC, s.name`,
  );

  return (
    <div>
      <h1 className="font-jakarta text-section font-700 text-ink-950">People</h1>
      <p className="mt-1 text-label text-neutral-600">
        Manage the sales team. Deactivating preserves history and returns open
        leads to the queue.
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-neutral-200">
        <table className="w-full text-left text-label">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-600">Name</th>
              <th className="px-4 py-3 font-600">Role</th>
              <th className="px-4 py-3 font-600">Open leads</th>
              <th className="px-4 py-3 font-600">Capacity</th>
              <th className="px-4 py-3 font-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((staff) => (
              <tr key={staff.id} className="border-t border-neutral-200">
                <td className="px-4 py-3">
                  <span className="block font-600 text-ink-950">
                    {staff.name}
                  </span>
                  <span className="text-neutral-600">{staff.email}</span>
                </td>
                <td className="px-4 py-3 capitalize text-neutral-700">
                  {staff.role}
                </td>
                <td className="px-4 py-3 text-neutral-700">{staff.open_count}</td>
                <td className="px-4 py-3 text-neutral-700">
                  {staff.capacity_cap ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {staff.active ? (
                    <span className="text-green-700">Active</span>
                  ) : (
                    <span className="text-neutral-500">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {staff.active && staff.role !== "admin" ? (
                    <form action={deactivateStaff}>
                      <input type="hidden" name="staffId" value={staff.id} />
                      <button
                        type="submit"
                        className="cursor-pointer text-purple-700 underline hover:text-purple-600"
                      >
                        Deactivate
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10 rounded-card border border-neutral-200 p-5">
        <h2 className="font-jakarta text-subhead font-700 text-ink-950">
          Add a salesperson
        </h2>
        <div className="mt-4">
          <AddStaffForm />
        </div>
      </section>
    </div>
  );
}
