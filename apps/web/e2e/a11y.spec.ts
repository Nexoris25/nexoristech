/**
 * Route-level accessibility pass (PRD 15): runs axe (WCAG 2.1 A and AA, including colour contrast)
 * against the sampled page classes in a real browser, and fails on any serious or critical
 * violation. Complements the component-level check:a11y gate.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/ai-product-development/",
  "/ai-seo-geo/",
  "/ai-chatbots-virtual-assistants/",
  "/business-process-automation/",
  "/ai-ecommerce-development/",
  "/healthcare-software/",
  "/how-we-work/",
  "/contact/",
];

for (const route of ROUTES) {
  test(`no serious or critical accessibility violations on ${route}`, async ({
    page,
  }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      blocking,
      `Violations on ${route}: ${blocking.map((v) => v.id).join(", ")}`,
    ).toEqual([]);
  });
}
