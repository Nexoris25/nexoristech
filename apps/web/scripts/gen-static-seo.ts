/**
 * Generates the static robots.txt served from public/ (PRD 9.1), so it is served at exactly
 * /robots.txt regardless of the trailing-slash routing. Re-run with
 * `pnpm --filter @nexoris/web seo:static` when the disallow list changes.
 *
 * This script used to write public/llms.txt as well. It must not: llms.txt is now the route at
 * src/app/llms.txt/route.ts, which builds the Insights section live from published CMS content so
 * the file stays current as articles go out. A file in public/ shadows an app route of the same
 * path, so writing it here would silently freeze llms.txt at whatever the catalogue said on the day
 * the script was last run.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRobotsTxt } from "@nexoris/seo";

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public");

writeFileSync(resolve(publicDir, "robots.txt"), buildRobotsTxt());

process.stdout.write("Wrote public/robots.txt\n");
