/**
 * Generates the static robots.txt and llms.txt served from public/ (PRD 9.1, 9.8). Both are
 * derived from packages/seo and the navigation catalogue so they stay accurate, and written as
 * static files so they are served at the exact paths /robots.txt and /llms.txt regardless of the
 * trailing-slash routing. Re-run with `pnpm --filter @nexoris/web seo:static` when the
 * catalogue changes.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLlmsTxt, buildRobotsTxt } from "@nexoris/seo";
import { allServices, industryGroups } from "../src/content/catalogue.js";

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public");

writeFileSync(resolve(publicDir, "robots.txt"), buildRobotsTxt());

const industries = industryGroups.flatMap((group) =>
  group.items.map((item) => ({ name: item.label, path: item.href })),
);
const services = allServices.map((s) => ({
  name: s.label,
  path: s.href,
  ...(s.summary ? { summary: s.summary } : {}),
}));

const llms = buildLlmsTxt({
  summary:
    "Nexoris Technologies designs and builds custom software for businesses in Nigeria and abroad, adding AI where it genuinely helps.",
  services,
  industries,
});
writeFileSync(resolve(publicDir, "llms.txt"), llms);

process.stdout.write("Wrote public/robots.txt and public/llms.txt\n");
