/**
 * What each granted role may do, for every module outside the CMS.
 *
 * The CMS already had a model like this in cms-roles.ts and enforced it. Nothing else did. Roles for
 * the other five modules were listed in shell-constants, offered in the access screen, written into
 * module_access, and then read by nothing: the pages behind them asked one of two questions, "is
 * anyone signed in" or "is this the admin", and neither of those is the question the grant answers.
 *
 * That produced two failures pulling in opposite directions.
 *
 * Too open. CRM pages called requireStaff, which is satisfied by any signed-in account. Somebody
 * granted only the CMS module could type /crm/board and read the pipeline. The sidebar hid the link,
 * which is not access control, it is decoration over access control.
 *
 * Too closed. Finance, Payroll and HR pages called requireAdmin. Granting "Finance Viewer" therefore
 * changed nothing at all: the person still could not open Finance, because the page wanted the base
 * admin role rather than the grant. The one screen whose job is to hand out access could not hand out
 * any.
 *
 * So the roles were simultaneously unenforced and unusable. This file is the single definition, and
 * `can` in auth.ts is what the gates now consult.
 *
 * Two rules worth stating because they are easy to erode:
 *
 *   * A capability is a thing a person does, not a page they visit. Pages come and go; "approve a
 *     payroll run" is stable, and expressing the model in those terms is what stops it drifting back
 *     into a list of URLs.
 *
 *   * Reading is not writing and writing is not approving. Every module here separates them, because
 *     the whole reason to grant somebody Finance rather than admin is that they should be able to
 *     raise an invoice without also being able to change the tax configuration.
 */
import { MODULES, type ModuleId } from "./modules.js";

/**
 * Everything a person can be permitted to do outside the CMS.
 *
 * Namespaced by module so a capability name is unambiguous on its own, which matters when one is
 * being read out of an audit row months later.
 */
export const CAPABILITIES = [
  // CRM
  "crm.read", "crm.write", "crm.assign", "crm.delete", "crm.settings",
  // Finance
  "finance.read", "finance.invoice.raise", "finance.payment.record",
  "finance.reconcile", "finance.report", "finance.settings",
  // NRS e-invoicing. Transmission and configuration are deliberately separate: signing the platform
  // up to a tax authority is not the same act as sending today's invoice, and the person who does
  // the second every day should not be able to do the first by accident.
  "einvoicing.read", "einvoicing.prepare", "einvoicing.transmit", "einvoicing.config",
  // HR
  "hr.read", "hr.write", "hr.onboard", "hr.leave.decide", "hr.expense.decide", "hr.offboard", "hr.settings",
  // Payroll. Preparing a run and approving one are different people wherever that is affordable.
  "payroll.read", "payroll.prepare", "payroll.approve", "payroll.remit", "payroll.settings",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABEL: Record<Capability, string> = {
  "crm.read": "View leads and pipeline",
  "crm.write": "Create and update leads",
  "crm.assign": "Assign and reassign leads",
  "crm.delete": "Delete leads",
  "crm.settings": "Change CRM settings, SLAs and templates",
  "finance.read": "View finance records",
  "finance.invoice.raise": "Raise and edit invoices",
  "finance.payment.record": "Record payments and receipts",
  "finance.reconcile": "Reconcile transactions",
  "finance.report": "Run finance reports",
  "finance.settings": "Change finance settings",
  "einvoicing.read": "View fiscal documents",
  "einvoicing.prepare": "Prepare credit and debit notes",
  "einvoicing.transmit": "Transmit documents to the tax authority",
  "einvoicing.config": "Change fiscal configuration and credentials",
  "hr.read": "View people records",
  "hr.write": "Create and update people records",
  "hr.onboard": "Onboard new employees",
  "hr.leave.decide": "Approve or decline leave",
  "hr.expense.decide": "Approve, reject or reimburse expense claims",
  "hr.offboard": "Offboard an employee",
  "hr.settings": "Change HR settings and departments",
  "payroll.read": "View payroll",
  "payroll.prepare": "Prepare payroll runs",
  "payroll.approve": "Approve payroll runs",
  "payroll.remit": "Record statutory remittances",
  "payroll.settings": "Change payroll settings and salary bands",
};

/**
 * The roles each module grants, and what each one holds.
 *
 * Named for the job rather than the software: "Finance Officer" is a person somebody in this company
 * actually is, where "Finance Level 2" is a thing only a permissions table believes in.
 *
 * The first role of each module is its administrator. Order is the order the access screen offers.
 */
export const MODULE_ROLE_CAPABILITIES: Record<ModuleId, Record<string, readonly Capability[]>> = {
  crm: {
    "CRM Admin": ["crm.read", "crm.write", "crm.assign", "crm.delete", "crm.settings"],
    // Runs the desk: sees every rep's pipeline and moves work between them, but the shape of the
    // process (SLAs, templates) stays with the admin.
    "Sales Manager": ["crm.read", "crm.write", "crm.assign"],
    Salesperson: ["crm.read", "crm.write"],
    "CRM Viewer": ["crm.read"],
  },
  finance: {
    "Finance Admin": [
      "finance.read", "finance.invoice.raise", "finance.payment.record",
      "finance.reconcile", "finance.report", "finance.settings",
    ],
    // Day-to-day billing. Raises invoices and records what comes in, and cannot change the settings
    // that decide how tax is calculated on them.
    "Finance Officer": ["finance.read", "finance.invoice.raise", "finance.payment.record", "finance.report"],
    Accountant: ["finance.read", "finance.reconcile", "finance.report"],
    "Finance Viewer": ["finance.read"],
  },
  einvoicing: {
    "e-Invoicing Admin": ["einvoicing.read", "einvoicing.prepare", "einvoicing.transmit", "einvoicing.config"],
    // Sends documents to the tax authority all day and never touches the credentials that identify
    // us to it.
    "Tax Officer": ["einvoicing.read", "einvoicing.prepare", "einvoicing.transmit"],
    "e-Invoicing Viewer": ["einvoicing.read"],
  },
  hr: {
    "HR Admin": [
      "hr.read", "hr.write", "hr.onboard", "hr.leave.decide", "hr.expense.decide",
      "hr.offboard", "hr.settings",
    ],
    // Everything day to day, including the decisions. Offboarding stays with the admin: it ends
    // someone's employment, feeds their final settlement to Payroll, and revokes their access.
    "HR Officer": ["hr.read", "hr.write", "hr.onboard", "hr.leave.decide", "hr.expense.decide"],
    "HR Assistant": ["hr.read", "hr.write"],
    "HR Viewer": ["hr.read"],
  },
  payroll: {
    "Payroll Admin": ["payroll.read", "payroll.prepare", "payroll.approve", "payroll.remit", "payroll.settings"],
    // Prepares a run and hands it to someone else to approve. Separating these is the only reason a
    // payroll role model is worth having.
    "Payroll Officer": ["payroll.read", "payroll.prepare", "payroll.remit"],
    "Payroll Viewer": ["payroll.read"],
  },
  // The CMS keeps its own model in cms-roles.ts, which predates this file, is already enforced, and
  // is already tested. Duplicating it here to look tidy would create a second source of truth for
  // the one module that never had that problem.
  cms: {},
};

/** The roles a module offers, in the order the access screen should list them. */
export function rolesFor(module: ModuleId): string[] {
  return Object.keys(MODULE_ROLE_CAPABILITIES[module]);
}

/** Whether a granted role in a module holds a capability. Unknown roles hold nothing. */
export function roleAllows(module: ModuleId, role: string | null, capability: Capability): boolean {
  if (!role) return false;
  return (MODULE_ROLE_CAPABILITIES[module][role] ?? []).includes(capability);
}

/** The module a capability belongs to, so a gate can be given the capability alone. */
export function moduleOf(capability: Capability): ModuleId {
  const prefix = capability.split(".")[0] as string;
  const found = MODULES.find((m) => m === prefix);
  // "einvoicing" and "hr" match their prefixes directly; this only ever fails if a capability is
  // added with a prefix that is not a module id, which the type system cannot catch on its own.
  if (!found) throw new Error(`Capability ${capability} has no matching module.`);
  return found;
}
