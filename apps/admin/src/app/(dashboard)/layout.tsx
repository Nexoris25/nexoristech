/**
 * The signed-in dashboard frame. Requires a valid session (unauthenticated visitors are redirected
 * to the login page), computes the live notification count, and renders the AdminShell: the ink
 * sidebar, the top bar, and the page content. The visual standard is the approved dashboard design
 * shown in the website's homepage product mockup.
 */
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireStaff } from "../../lib/auth.js";
import { db } from "../../lib/db.js";
import { AdminShell } from "../../components/AdminShell.js";
import { DatabaseDown } from "../../components/DatabaseDown.js";
import { isDatabaseUnreachable, DB_UNREACHABLE_MARKER } from "../../lib/db-errors.js";
import { buildActionCenter, type ActionItem } from "../../lib/action-center.js";
import { readItemIds } from "../../lib/notification-read.js";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactNode> {
  // Everything below needs the database. When it is unreachable the honest answer is to say so:
  // redirecting to /login would claim the session ended, and the login form cannot work either.
  // Access is not granted here — requireStaff still runs and still refuses anyone without a valid
  // session; this only changes how an outage is reported.
  let staff: Awaited<ReturnType<typeof requireStaff>>;
  let unread: ActionItem[];
  let granted: string[];
  try {
    staff = await requireStaff();
    // The bell counts what this person has not yet read, not how many rows happen to exist. Anything
    // else makes the badge a number that never goes down, which is what it was before.
    const [items, read, { rows: grants }] = await Promise.all([
      buildActionCenter(db(), new Date(), staff.role === "salesperson" ? staff.id : undefined),
      readItemIds(staff.id),
      db().query<{ module: string }>("SELECT DISTINCT module FROM module_access WHERE staff_id = $1", [staff.id]),
    ]);
    unread = items.filter((i) => !read.has(i.id));
    granted = grants.map((g) => g.module);
  } catch (error) {
    if (isDatabaseUnreachable(error) || (error instanceof Error && error.message === DB_UNREACHABLE_MARKER)) {
      return <DatabaseDown area="The dashboard" />;
    }
    throw error;
  }
  // RBAC: a CMS-only user (granted the CMS and nothing else, and not an admin) never sees the admin
  // dashboard — they are sent straight to the CMS, which has its own shell.
  if (staff.role !== "admin" && granted.includes("cms") && granted.every((m) => m === "cms")) {
    redirect("/cms");
  }
  // An admin sees every module; everyone else sees only the modules they were granted (§3.2). The CMS
  // opens in its own shell, so it is not one of the dark-shell modules listed here.
  const access = staff.role === "admin"
    ? ["crm", "finance", "hr", "payroll"]
    : granted.filter((m) => m !== "cms");

  return (
    <AdminShell
      staff={{ name: staff.name, role: staff.role }}
      unread={unread.length}
      notifications={unread.slice(0, 5).map((i) => ({
        id: i.id,
        title: i.title,
        detail: `${i.module} · ${i.detail}`,
        href: i.href,
      }))}
      access={access}
    >
      {children}
    </AdminShell>
  );
}
