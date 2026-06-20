/**
 * @nexoris/pseo
 *
 * The non-negotiable programmatic-SEO core shared by the web render route and the CMS publish
 * guard (PRD 9.6, 9.7): the proof substitution ladder (never empty, never fabricates) and the
 * quality and data-readiness gate (unpublished by default). One source of truth, so a page that
 * cannot clear the gate can neither publish in the CMS nor render on the site.
 */
export * from "./proof-ladder.js";
export * from "./quality-gate.js";
