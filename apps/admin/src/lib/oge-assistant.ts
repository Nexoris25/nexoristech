/**
 * Oge, the admin assistant - a grounded, RBAC-scoped question answerer. It never invents numbers: it
 * routes a question to an intent, checks the asker actually has access to that module (§3.2), then
 * reads the live database and answers in plain, warm words. If the asker lacks access to what they
 * asked about, Oge says so rather than leaking it. No em dashes, no jargon. This is deliberately
 * deterministic (not a free-form LLM) so an admin can trust every figure and nothing crosses a
 * permission boundary; the same shape can later call the Oge gateway when a chat endpoint exists.
 */
import { db } from "./db.js";
import { RECEIVABLE_SQL } from "./finance.js";
import type { CurrentStaff } from "./auth.js";

export interface OgeContext {
  staff: CurrentStaff;
  access: string[]; // module keys the user may see
}
export interface OgeAnswer {
  text: string;
  scoped?: boolean; // true when the answer was limited or denied by permissions
}

function has(ctx: OgeContext, moduleKey: string): boolean {
  return ctx.staff.role === "admin" || ctx.access.includes(moduleKey);
}
const naira = (v: string | number): string => `₦${Number(v).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

/** The capabilities line, scoped to what this user can actually see. */
function capabilities(ctx: OgeContext): string {
  const can: string[] = [];
  if (has(ctx, "crm")) can.push("your leads and pipeline");
  if (has(ctx, "finance")) can.push("invoices, receivables, and what customers owe");
  if (has(ctx, "finance")) can.push("NRS e-invoicing status");
  if (has(ctx, "payroll")) can.push("the latest pay run");
  if (has(ctx, "hr")) can.push("your team headcount and leave");
  const list = can.length ? can.join(", ") : "the parts of the platform you have access to";
  return `Hi, I am Oge. I can answer from your live data: ${list}. Try asking things like "how many new leads do I have", "what are we owed", or "any rejected NRS invoices". I only answer within what your role can see.`;
}

export async function askOge(question: string, ctx: OgeContext): Promise<OgeAnswer> {
  const q = question.trim().toLowerCase();
  if (!q) return { text: capabilities(ctx) };
  const pool = db();
  const salesScope = ctx.staff.role === "salesperson" ? " AND assigned_to = $1" : "";
  const salesArgs = ctx.staff.role === "salesperson" ? [ctx.staff.id] : [];

  const mentions = (...words: string[]): boolean => words.some((w) => q.includes(w));

  if (mentions("help", "what can you", "what do you do") || q === "hi" || q === "hello") {
    return { text: capabilities(ctx) };
  }

  // CRM: leads
  if (mentions("lead", "pipeline", "prospect")) {
    if (!has(ctx, "crm")) return { text: "That is CRM data, and your role does not have CRM access. Ask an admin if you need it.", scoped: true };
    const hot = mentions("hot", "warm", "cold");
    const isNew = mentions("new");
    const r = (await pool.query<{ total: string; fresh: string; hot: string }>(
      `SELECT count(*)::text total,
              count(*) FILTER (WHERE status='New')::text fresh,
              count(*) FILTER (WHERE band='Hot')::text hot
         FROM lead WHERE true${salesScope}`, salesArgs)).rows[0]!;
    const whose = ctx.staff.role === "salesperson" ? "assigned to you" : "in the pipeline";
    if (isNew) return { text: `You have ${r.fresh} new lead${r.fresh === "1" ? "" : "s"} waiting for a first response${ctx.staff.role === "salesperson" ? "" : " across the team"}.` };
    if (hot) return { text: `There ${r.hot === "1" ? "is" : "are"} ${r.hot} hot lead${r.hot === "1" ? "" : "s"} ${whose} right now.` };
    return { text: `There ${r.total === "1" ? "is" : "are"} ${r.total} lead${r.total === "1" ? "" : "s"} ${whose}, of which ${r.fresh} ${r.fresh === "1" ? "is" : "are"} new and ${r.hot} hot.` };
  }

  // Finance: receivables / overdue / owed
  if (mentions("owed", "receivable", "overdue", "unpaid", "outstanding", "collect")) {
    if (!has(ctx, "finance")) return { text: "That is Finance data, and your role does not have Finance access.", scoped: true };
    const r = (await pool.query<{ outstanding: string; overdue: string; count: string }>(
      `SELECT COALESCE(sum(total-amount_paid),0)::text outstanding,
              COALESCE(sum(total-amount_paid) FILTER (WHERE due_date < current_date),0)::text overdue,
              count(*) FILTER (WHERE total-amount_paid > 0)::text count
         FROM einvoice WHERE ${RECEIVABLE_SQL}`)).rows[0]!;
    return { text: `Customers owe you ${naira(r.outstanding)} across ${r.count} open invoice${r.count === "1" ? "" : "s"}. Of that, ${naira(r.overdue)} is overdue. You can work these in Finance under Invoices, filtered by Overdue.` };
  }

  // NRS e-invoicing status
  if (mentions("nrs", "e-invoic", "einvoic", "submission", "submitted", "rejected", "accepted", "irn")) {
    if (!has(ctx, "finance")) return { text: "That is e-invoicing data, and your role does not have Finance access.", scoped: true };
    const r = (await pool.query<{ ready: string; submitting: string; rejected: string; accepted: string }>(
      `SELECT count(*) FILTER (WHERE nrs_status='NotSubmitted' AND lifecycle_status NOT IN ('Draft','Closed'))::text ready,
              count(*) FILTER (WHERE nrs_status='Submitting')::text submitting,
              count(*) FILTER (WHERE nrs_status='Rejected')::text rejected,
              count(*) FILTER (WHERE nrs_status='Accepted')::text accepted FROM einvoice`)).rows[0]!;
    if (mentions("reject")) return { text: `${r.rejected} invoice${r.rejected === "1" ? "" : "s"} ${r.rejected === "1" ? "was" : "were"} rejected by the NRS. Fix the data in Finance, then retry them under NRS e-Invoicing, Rejected.` };
    return { text: `On NRS e-invoicing: ${r.ready} ready to submit, ${r.submitting} awaiting acknowledgement, ${r.accepted} accepted, and ${r.rejected} rejected.` };
  }

  // Payroll
  if (mentions("payroll", "pay run", "salary", "net pay", "payslip", "disburse")) {
    if (!has(ctx, "payroll")) return { text: "That is Payroll data, and your role does not have Payroll access.", scoped: true };
    const r = (await pool.query<{ period: string; status: string; net: string; count: number }>(
      "SELECT period, status, net::text, employee_count count FROM pay_run ORDER BY created_at DESC LIMIT 1")).rows[0];
    if (!r) return { text: "No pay run has been created yet. You can start one in Payroll under Pay Runs." };
    return { text: `The latest pay run is ${r.period} (${r.status}) for ${r.count} worker${r.count === 1 ? "" : "s"}, with a net pay of ${naira(r.net)}.` };
  }

  // HR
  if (mentions("employee", "headcount", "staff count", "team size", "on leave", "leave request")) {
    if (!has(ctx, "hr")) return { text: "That is HR data, and your role does not have HR access.", scoped: true };
    const r = (await pool.query<{ active: string; onleave: string }>(
      `SELECT count(*) FILTER (WHERE employment_status <> 'Exited')::text active,
              (SELECT count(*) FROM leave_request WHERE status='Approved' AND current_date BETWEEN start_date AND end_date)::text onleave
         FROM employee`)).rows[0]!;
    return { text: `You have ${r.active} active people on the team, and ${r.onleave} ${r.onleave === "1" ? "is" : "are"} on approved leave today.` };
  }

  // Expenses / payables
  if (mentions("expense", "payable", "spend", "spent")) {
    if (!has(ctx, "finance")) return { text: "That is Finance data, and your role does not have Finance access.", scoped: true };
    const r = (await pool.query<{ total: string; unpaid: string }>(
      "SELECT COALESCE(sum(amount),0)::text total, COALESCE(sum(amount) FILTER (WHERE status='Unpaid'),0)::text unpaid FROM expense")).rows[0]!;
    return { text: `Recorded expenses total ${naira(r.total)}, of which ${naira(r.unpaid)} is still unpaid. See Finance under Payables.` };
  }

  return { text: `I am not sure how to answer that one yet. ${capabilities(ctx)}` };
}
