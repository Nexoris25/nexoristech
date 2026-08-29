/**
 * Shell constants (PRD 3, 4): the modules the access model grants into, and the roles allowed per
 * module. One access table, one place these live. Kept plain so a "use server" file may import it.
 */
import { rolesFor } from "./permissions.js";
import { MODULES, MODULE_LABEL, type ModuleId } from "./modules.js";

// Re-exported so every existing importer of shell-constants keeps working unchanged.
export { MODULES, MODULE_LABEL };
export type { ModuleId };
/** The CMS roles, named here so shell-constants does not have to import the CMS model. */
export const CMS_ROLE_NAMES = ["CMS Admin", "Editor", "Content Writer", "Fact-Checker"] as const;


/**
 * The roles each module recognises.
 *
 * These are no longer written out by hand. They were, and the list drifted from what the code did:
 * the access screen offered "Viewer" for CRM and "Payroll Admin" as the only payroll role, while
 * nothing anywhere read either. The names now come from the capability model in permissions.ts, so a
 * role can only be offered if there is a definition of what holding it permits.
 *
 * The CMS keeps its own list. Its model predates the platform-wide one, is enforced, and is tested;
 * pointing it at a second definition would be churn for the one module that was never broken.
 */
export const MODULE_ROLES: Record<ModuleId, readonly string[]> = {
  crm: rolesFor("crm"),
  finance: rolesFor("finance"),
  einvoicing: rolesFor("einvoicing"),
  hr: rolesFor("hr"),
  payroll: rolesFor("payroll"),
  cms: CMS_ROLE_NAMES,
};

export interface AccessState {
  error?: string;
  ok?: boolean;
}

export interface SettingsState {
  error?: string;
  ok?: boolean;
}
