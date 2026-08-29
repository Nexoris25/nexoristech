/**
 * The permission model.
 *
 * These are mostly separation tests. The reason to grant somebody a module role instead of making
 * them an admin is that some things should stay out of reach, so the tests that matter are the ones
 * asserting what a role does NOT hold. A model where every role quietly holds everything passes any
 * test that only checks the happy path, and that is exactly the state this replaced.
 */
import { describe, expect, it } from "vitest";
import {
  CAPABILITIES,
  CAPABILITY_LABEL,
  MODULE_ROLE_CAPABILITIES,
  moduleOf,
  roleAllows,
  rolesFor,
  type Capability,
} from "./permissions.js";
import { MODULES, MODULE_ROLES } from "./shell-constants.js";

describe("the model is internally consistent", () => {
  it("gives every capability a label", () => {
    for (const c of CAPABILITIES) expect(CAPABILITY_LABEL[c], c).toBeTruthy();
  });

  it("only grants capabilities that exist", () => {
    for (const module of MODULES) {
      for (const [role, caps] of Object.entries(MODULE_ROLE_CAPABILITIES[module])) {
        for (const c of caps) {
          expect(CAPABILITIES, `${module}/${role} grants unknown ${c}`).toContain(c);
        }
      }
    }
  });

  it("only grants a module capabilities that belong to that module", () => {
    for (const module of MODULES) {
      for (const [role, caps] of Object.entries(MODULE_ROLE_CAPABILITIES[module])) {
        for (const c of caps) {
          expect(moduleOf(c), `${module}/${role} grants ${c} from another module`).toBe(module);
        }
      }
    }
  });

  it("offers exactly the roles the access screen validates against", () => {
    // The grant route rejects any role not in MODULE_ROLES, so a role defined here but missing there
    // could never be granted, and one listed there but undefined here would grant nothing.
    for (const module of MODULES) {
      if (module === "cms") continue;
      expect([...MODULE_ROLES[module]].sort()).toEqual(rolesFor(module).sort());
    }
  });

  it("covers every capability with at least one role that holds it", () => {
    const held = new Set<string>();
    for (const module of MODULES) {
      for (const caps of Object.values(MODULE_ROLE_CAPABILITIES[module])) {
        for (const c of caps) held.add(c);
      }
    }
    for (const c of CAPABILITIES) expect(held, `nobody can ${c}`).toContain(c);
  });
});

describe("roles are actually separated", () => {
  const denies = (module: Parameters<typeof roleAllows>[0], role: string, cap: Capability): void => {
    expect(roleAllows(module, role, cap), `${role} should not hold ${cap}`).toBe(false);
  };
  const holds = (module: Parameters<typeof roleAllows>[0], role: string, cap: Capability): void => {
    expect(roleAllows(module, role, cap), `${role} should hold ${cap}`).toBe(true);
  };

  it("lets a Finance Officer bill without letting them change how tax is calculated", () => {
    holds("finance", "Finance Officer", "finance.invoice.raise");
    holds("finance", "Finance Officer", "finance.payment.record");
    denies("finance", "Finance Officer", "finance.settings");
  });

  it("keeps a Finance Viewer to reading", () => {
    holds("finance", "Finance Viewer", "finance.read");
    denies("finance", "Finance Viewer", "finance.invoice.raise");
    denies("finance", "Finance Viewer", "finance.payment.record");
  });

  it("separates preparing a payroll run from approving one", () => {
    holds("payroll", "Payroll Officer", "payroll.prepare");
    denies("payroll", "Payroll Officer", "payroll.approve");
    holds("payroll", "Payroll Admin", "payroll.approve");
  });

  it("keeps fiscal configuration away from the person transmitting documents", () => {
    // The credentials that identify this company to the tax authority are not a daily-use control.
    holds("einvoicing", "Tax Officer", "einvoicing.transmit");
    denies("einvoicing", "Tax Officer", "einvoicing.config");
    holds("einvoicing", "e-Invoicing Admin", "einvoicing.config");
  });

  it("keeps offboarding with the HR Admin", () => {
    holds("hr", "HR Officer", "hr.onboard");
    denies("hr", "HR Officer", "hr.offboard");
    holds("hr", "HR Admin", "hr.offboard");
  });

  it("lets a Sales Manager reassign without reshaping the process", () => {
    holds("crm", "Sales Manager", "crm.assign");
    denies("crm", "Sales Manager", "crm.settings");
    denies("crm", "Salesperson", "crm.assign");
  });

  it("treats an unknown or missing role as holding nothing", () => {
    // This is the fallback that decides what happens to a legacy grant. It must deny, not allow:
    // rows holding the literal 'admin' existed, and reading that as full access would be the worst
    // possible reading of a value the model does not recognise.
    expect(roleAllows("finance", "admin", "finance.read")).toBe(false);
    expect(roleAllows("finance", "Something Invented", "finance.read")).toBe(false);
    expect(roleAllows("finance", null, "finance.read")).toBe(false);
  });

  it("gives every module's first-listed role every capability of that module", () => {
    for (const module of MODULES) {
      if (module === "cms") continue;
      const [adminRole] = rolesFor(module);
      const all = CAPABILITIES.filter((c) => moduleOf(c) === module);
      for (const c of all) holds(module, adminRole as string, c);
    }
  });
});
