/**
 * @nexoris/recommend
 *
 * The versioned deterministic Service Recommender shared by the web Solution Finder, the Oge
 * rationale, and the admin CRM lead tagging (PRD 8, 10.4, 10.5). The match is pure code; AI writes
 * only the rationale, so it can never name a page that does not exist.
 */
export * from "./registry.js";
export * from "./matrix.js";
export * from "./questions.js";
export * from "./match.js";
