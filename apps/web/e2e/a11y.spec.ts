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
  "/ai-systems-integration/",
  "/data-dashboards-predictive-analytics/",
  "/data-infrastructure-ai-readiness/",
  "/govtech-platforms/",
  "/iot-development/",
  "/managed-technology-operations/",
  "/oge/",
  "/about/",
  "/healthcare-software/",
  "/how-we-work/",
  "/contact/",
  "/case-studies/",
  "/privacy-policy/",
  "/cookie-policy/",
  "/terms-of-service/",
  "/careers/",
  "/insights/",
  "/agritech-software/",
  "/fintech-software/",
  "/retail-ecommerce-software/",
  "/government-digital-solutions/",
  "/logistics-software/",
  "/restaurant-software/",
  "/real-estate-software/",
  "/education-software/",
  "/church-management-software/",
  "/ngo-software/",
  /*
   * A published article and an author profile.
   *
   * The list sampled every static page class and stopped at the Insights index, so the article
   * template — the densest page of text on the site, and the one carrying the reading styles, the
   * short-version box, the byline cards and the FAQ accordions — was never audited. Neither was an
   * author profile. These two are CMS-backed, so an editor unpublishing them turns this into a 404
   * and the failure will say so plainly.
   */
  "/insights/hospital-management-system-nigeria/",
  "/chinedu-nwogu/",
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
