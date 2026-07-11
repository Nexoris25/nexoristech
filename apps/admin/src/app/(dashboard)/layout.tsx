/**
 * The signed-in dashboard frame. Requires a valid session (unauthenticated visitors are redirected
 * to the login page), computes the live notification count, and renders the AdminShell: the ink
 * sidebar, the top bar, and the page content. The visual standard is the approved dashboard design
 * shown in the website's homepage product mockup.
 */
import type { ReactNode } from "react";
import { requireStaff } from "../../lib/auth.js";
import { signOut } from "../../lib/auth-actions.js";
import { db } from "../../lib/db.js";
import { AdminShell } from "../../components/AdminShell.js";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactNode> {
  const staff = await requireStaff();
  const { rows } = await db().query<{ count: string }>(
    "SELECT count(*) FROM lead WHERE status = 'New'",
  );
  const newLeadCount = Number(rows[0]?.count ?? 0);

  return (
    <AdminShell
      staff={{ name: staff.name, role: staff.role }}
      newLeadCount={newLeadCount}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}
