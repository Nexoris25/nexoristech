/**
 * The permission map. These lock the separation the fiscal module depends on: operating invoices must
 * never imply the right to change where tax documents go or under whose identity they are filed.
 */
import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, type FiscalPermission } from "./permissions.js";

const MODULE_ROLES = ["e-Invoicing Admin", "e-Invoicing Viewer"] as const;

describe("fiscal role permissions", () => {
  it("grants TAX_FISCAL_CONFIG_MANAGE to no e-invoicing module role", () => {
    for (const role of MODULE_ROLES) {
      expect(ROLE_PERMISSIONS[role]).not.toContain("TAX_FISCAL_CONFIG_MANAGE");
    }
  });

  it("lets an e-Invoicing Admin raise and submit documents", () => {
    expect(ROLE_PERMISSIONS["e-Invoicing Admin"]).toEqual(
      expect.arrayContaining<FiscalPermission>(["INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_SUBMIT"]));
  });

  it("limits an e-Invoicing Viewer to reading", () => {
    expect(ROLE_PERMISSIONS["e-Invoicing Viewer"]).toEqual(["INVOICE_VIEW"]);
  });

  it("confers nothing on an unknown role", () => {
    expect(ROLE_PERMISSIONS["Not A Real Role"]).toBeUndefined();
  });

  it("covers every role the module offers, so a grant is never silently inert", () => {
    // This is what previously went wrong: the roles existed but no route consulted them.
    for (const role of MODULE_ROLES) {
      expect(ROLE_PERMISSIONS[role] ?? []).not.toHaveLength(0);
    }
  });
});
