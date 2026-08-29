/**
 * The modules the access model grants into.
 *
 * Its own file to break a cycle, which is worth recording because the cycle typechecked cleanly and
 * failed only at runtime. shell-constants needed the role names from permissions, permissions needed
 * the module ids from shell-constants, and MODULE_ROLES is built at module load: whichever side
 * loaded second found the other half-initialised and threw "Cannot access before initialization".
 *
 * Both now depend on this, and this depends on nothing.
 */
export const MODULES = ["crm", "finance", "einvoicing", "hr", "payroll", "cms"] as const;
export type ModuleId = (typeof MODULES)[number];

export const MODULE_LABEL: Record<ModuleId, string> = {
  crm: "CRM",
  finance: "Finance",
  einvoicing: "NRS e-Invoicing",
  hr: "HR",
  payroll: "Payroll",
  cms: "CMS",
};
