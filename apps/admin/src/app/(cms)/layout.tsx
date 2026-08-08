/**
 * The CMS shell frame. The CMS is a platform module but has its own dedicated chrome (owner's design),
 * so it renders inside CmsShell rather than the main admin shell. Admin only. The notification count is
 * the live review-queue backlog from the nexoris_cms database.
 */
import type { ReactNode } from "react";
import { requireCmsAccess } from "../../lib/auth.js";
import { cmsDb } from "../../lib/cms-db.js";
import { CmsShell } from "../../components/cms/CmsShell.js";
import { DatabaseDown } from "../../components/DatabaseDown.js";
import { isDatabaseUnreachable, DB_UNREACHABLE_MARKER } from "../../lib/db-errors.js";

const REVIEW_LABEL: Record<string, string> = { pending_review: "Pending review", editorial_review: "In editorial review", legal_review: "In legal review" };
function ago(iso: string): string { const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }

export default async function CmsLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  // requireCmsAccess reads the admin database to confirm who this is, so an outage surfaces here.
  // The review-queue query below already tolerates failure; this covers the identity check, which
  // cannot be skipped. Access is unchanged — only how an outage is reported.
  let staff: Awaited<ReturnType<typeof requireCmsAccess>>;
  try {
    staff = await requireCmsAccess();
  } catch (error) {
    if (isDatabaseUnreachable(error) || (error instanceof Error && error.message === DB_UNREACHABLE_MARKER)) {
      return <DatabaseDown area="The CMS" />;
    }
    throw error;
  }
  let notifications = 0;
  let items: { id: string; title: string; detail: string; href: string; ago: string }[] = [];
  try {
    const [{ rows: reviews }, { rows: counts }] = await Promise.all([
      cmsDb().query<{ id: string; title: string; kind: string; workflow_state: string; updated_at: string }>(
        `SELECT id, title, kind, workflow_state, COALESCE(updated_at, created_at)::text AS updated_at
           FROM cms_content WHERE workflow_state IN ('pending_review','editorial_review','legal_review')
          ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 8`),
      cmsDb().query<{ c: string }>("SELECT count(*)::text c FROM cms_content WHERE workflow_state IN ('pending_review','editorial_review','legal_review')"),
    ]);
    notifications = Number(counts[0]?.c ?? 0);
    items = reviews.map((r) => ({ id: r.id, title: r.title, detail: REVIEW_LABEL[r.workflow_state] ?? "Needs review", href: "/cms/review-queue", ago: ago(r.updated_at) }));
  } catch { notifications = 0; }

  return (
    <CmsShell staff={{ name: staff.name, role: staff.role }} notifications={notifications} notificationItems={items}>
      {children}
    </CmsShell>
  );
}
