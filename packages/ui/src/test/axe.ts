/**
 * Accessibility test helper for the Nexoris Technologies design system.
 *
 * Runs axe-core over a rendered component and fails on any serious or critical violation, the
 * same bar the check:a11y gate enforces across every route (PRD Part Four, Section 1). This is
 * the component-level pass that runs in jsdom; the route-level pass over the live app, which
 * also catches colour contrast, is added with Playwright once apps/web exists (Stage 4).
 */
import axe from "axe-core";
import { expect } from "vitest";

/** Impact levels that block a merge. */
const BLOCKING_IMPACTS = new Set(["serious", "critical"]);

/** Run axe over an element and assert there are no serious or critical violations. */
export async function expectNoSeriousA11yViolations(
  container: Element,
): Promise<void> {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
    rules: {
      // Colour contrast needs a real layout engine (canvas), which jsdom lacks. Contrast is
      // verified against the design tokens and re-checked at the route level with a real
      // browser in Stage 4, so it is disabled for this component-level pass.
      "color-contrast": { enabled: false },
    },
  });
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact !== null && BLOCKING_IMPACTS.has(violation.impact ?? ""),
  );
  const summary = blocking
    .map(
      (violation) => `${violation.id} (${violation.impact}): ${violation.help}`,
    )
    .join("\n");
  expect(blocking, summary).toEqual([]);
}
