/**
 * Every shell reaches the account menu through the same component.
 *
 * The CMS shell used to draw its own: a name, a role and a chevron inside a plain div. It looked
 * exactly like the dashboard's menu, so people clicked it, and nothing happened — which meant every
 * /cms route had no way to open a profile and no way to sign out. The dashboard's two copies had
 * drifted apart as well, offering different items in the sidebar and the top bar.
 *
 * A rendering test would need jsdom and testing-library, which the admin does not carry and which is
 * a lot of dependency for one component. These are source-level assertions instead, in the same
 * spirit as the dependency floors: they cannot prove the menu opens, but they do fail the moment a
 * shell starts drawing its own account chip again, which is the mistake that actually happened.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const here = import.meta.dirname;
const read = (p: string): string => readFileSync(resolve(here, p), "utf8");

const SHELLS = [
  ["AdminShell", "./AdminShell.tsx"],
  ["CmsShell", "./cms/CmsShell.tsx"],
] as const;

describe("every shell uses the shared account menu", () => {
  for (const [name, path] of SHELLS) {
    const source = read(path);

    it(`${name} imports AccountMenu`, () => {
      expect(source).toMatch(/import \{ AccountMenu \} from "\.[^"]*AccountMenu\.js"/);
    });

    it(`${name} renders it rather than its own chip`, () => {
      expect(source).toContain("<AccountMenu");
    });

    it(`${name} no longer carries its own initials helper`, () => {
      // The giveaway that a shell has started drawing the person itself again.
      expect(source).not.toMatch(/function initials\(/);
    });

    it(`${name} shows the account in the top bar and at the foot of the sidebar`, () => {
      // Both, in both shells: the CMS had neither, and someone working there could not sign out.
      expect(source).toMatch(/variant="header"/);
      expect(source).toMatch(/variant="sidebar"/);
    });
  }
});

describe("the account menu offers a way out on every route", () => {
  const source = read("./AccountMenu.tsx");

  it("posts to the logout route with a form, not a link", () => {
    // A link would let a prefetch or a crawler sign someone out.
    expect(source).toMatch(/<form action="\/api\/auth\/logout" method="post"/);
    expect(source).not.toMatch(/<Link href="\/api\/auth\/logout"/);
  });

  it("offers the profile", () => {
    expect(source).toContain('href="/complete-profile"');
  });

  it("names its trigger for screen readers", () => {
    expect(source).toMatch(/buttonLabel=\{`Account menu for \$\{staff\.name\}`\}/);
  });

  it("lets a shell point Settings at its own screen", () => {
    // The CMS settings page and the dashboard's are different routes, and the dashboard's bounces a
    // CMS-only user back to /cms, so one shared href would hand some people a dead link.
    expect(source).toContain("settingsHref");
  });
});
