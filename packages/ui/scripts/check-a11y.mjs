#!/usr/bin/env node
/**
 * check:a11y gate.
 *
 * Stage 0 failing stub. In Stage 2 this becomes a real axe-core pass across every route that
 * fails on any serious or critical issue, per the Product Requirements Document, Part One,
 * Section 15 and Part Four, Section 1.
 *
 * It exits non-zero on purpose so the gate is wired and visible from the first day.
 */
console.error(
  "check:a11y is not implemented yet. This gate is built in Stage 2 (packages/ui) with axe-core across every route.",
);
process.exit(1);
