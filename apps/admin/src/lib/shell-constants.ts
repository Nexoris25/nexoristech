/**
 * Shell constants (PRD 3, 4): the modules the access model grants into, and the roles allowed per
 * module. One access table, one place these live. Kept plain so a "use server" file may import it.
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

/** The roles each module recognises (PRD 5.5, 6.9, 7.9, 8.11). CMS roles per the CMS design. */
export const MODULE_ROLES: Record<ModuleId, readonly string[]> = {
  crm: ["CRM Admin", "Salesperson", "Viewer"],
  finance: ["Finance Admin", "Finance Viewer"],
  einvoicing: ["e-Invoicing Admin", "e-Invoicing Viewer"],
  hr: ["HR Admin", "HR Assistant"],
  payroll: ["Payroll Admin"],
  cms: ["CMS Admin", "Editor", "Content Writer", "Fact-Checker"],
};

export interface AccessState {
  error?: string;
  ok?: boolean;
}

export interface SettingsState {
  error?: string;
  ok?: boolean;
}
