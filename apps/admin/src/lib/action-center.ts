/**
 * The Action Center builder (PRD 11.2): the deterministic, priority-tagged alerts computed live
 * from CRM data, shared by the dashboard panel and the dedicated Action Center screen so both stay
 * in step. Today it watches the CRM (SLA, hot leads, unassigned, follow-ups due, nurture revivals);
 * Finance, HR, and Payroll feed the same list as they land. No AI, no invented data.
 */
import type pg from "pg";
import { businessDayDeadline } from "./business-days.js";
import type { Priority } from "./lead-ui.js";

export interface ActionItem {
  id: string;
  priority: Priority;
  module: "CRM" | "Finance" | "HR" | "Payroll";
  title: string;
  detail: string;
  href: string;
  assignee: string;
  band: string | null;
}

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

function hoursLabel(ms: number): string {
  return `${Math.abs(Math.round(ms / 3_600_000))}h`;
}

interface AlertRow {
  id: string;
  name: string | null;
  company: string | null;
  band: string | null;
  status: string;
  followup_stage: string | null;
  followup_due: string | null;
  assigned_name: string | null;
  created_at: string;
}

/** Build the full, sorted Action Center list. Scope to a salesperson's own leads when given. */
export async function buildActionCenter(
  pool: pg.Pool,
  now: Date,
  scopeStaffId?: string,
): Promise<ActionItem[]> {
  const scoped = scopeStaffId ? "AND l.assigned_to = $1" : "";
  const params = scopeStaffId ? [scopeStaffId] : [];
  const { rows } = await pool.query<AlertRow>(
    `SELECT l.id, l.name, l.company, l.band, l.status, l.followup_stage,
            l.followup_due::text, s.name AS assigned_name, l.created_at
       FROM lead l LEFT JOIN staff s ON s.id = l.assigned_to
      WHERE (l.status = 'New'
         OR (l.status = 'Nurture' AND l.nurture_date IS NOT NULL AND l.nurture_date <= current_date)
         OR (l.followup_due IS NOT NULL AND l.followup_due <= current_date AND l.followup_sent_at IS NULL))
        ${scoped}
      ORDER BY l.created_at ASC LIMIT 100`,
    params,
  );

  const items: ActionItem[] = [];
  for (const lead of rows) {
    const label = lead.name ?? "Unnamed lead";
    const assignee = lead.assigned_name ?? "Unassigned";
    const href = `/crm/${lead.id}`;
    const base = { module: "CRM" as const, href, assignee, band: lead.band };

    if (lead.followup_due !== null && new Date(lead.followup_due) <= now && lead.status !== "New") {
      items.push({
        ...base,
        id: `${lead.id}-followup`,
        priority: lead.band === "Hot" ? "High" : "Medium",
        title: `Follow-up due: ${label}`,
        detail: `${lead.followup_stage ?? "Stage"} follow-up ready, no reply logged`,
      });
    }
    if (lead.status === "New") {
      const due = businessDayDeadline(new Date(lead.created_at), 1);
      if (now > due) {
        items.push({
          ...base,
          id: `${lead.id}-sla`,
          priority: "High",
          title: `First-response SLA breached: ${label}`,
          detail: `Breached by ${hoursLabel(now.getTime() - due.getTime())}`,
        });
      } else if (due.getTime() - now.getTime() <= 24 * 3_600_000) {
        items.push({
          ...base,
          id: `${lead.id}-due`,
          priority: lead.band === "Hot" ? "High" : "Medium",
          title: `First response due: ${label}`,
          detail: `Due in ${hoursLabel(due.getTime() - now.getTime())}${lead.band === "Hot" ? " · scored Hot by Oge" : ""}`,
        });
      } else if (lead.band === "Hot") {
        items.push({
          ...base,
          id: `${lead.id}-hot`,
          priority: "Medium",
          title: `Hot lead awaiting first response: ${label}`,
          detail: "Scored Hot by Oge on arrival",
        });
      }
      if (!lead.assigned_name) {
        items.push({
          ...base,
          id: `${lead.id}-unassigned`,
          priority: "Medium",
          title: `Unassigned lead: ${label}`,
          detail: lead.company ?? "No company given",
          assignee: "Admin",
        });
      }
    } else if (lead.status === "Nurture") {
      items.push({
        ...base,
        id: `${lead.id}-nurture`,
        priority: "Low",
        title: `Nurture revival due: ${label}`,
        detail: "The revival date has arrived",
      });
    }
  }

  items.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.title.localeCompare(b.title),
  );
  return items;
}
