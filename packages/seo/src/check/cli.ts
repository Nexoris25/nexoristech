/**
 * The check:seo command-line gate for the Nexoris Technologies platform.
 *
 * Crawls the SEO build manifest a page build emits and applies the rule engine (rules.ts). A
 * single violation exits non-zero so the merge is blocked. Before any page exists there is no
 * manifest, so the gate passes with zero routes, which is correct: it is built ahead of the
 * pages so every page is born validating, and it turns red the moment a real route breaks a
 * rule (PRD 9.11).
 *
 * The manifest path comes from the first argument, then the SEO_MANIFEST environment
 * variable, then the default location an apps/web build writes to.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { validateManifest } from "./rules.js";
import type { SeoManifestEntry, SeoIssue } from "./rules.js";

const DEFAULT_MANIFEST = "apps/web/.next/seo-manifest.json";

/**
 * Find the monorepo root by walking up from the current directory until the pnpm workspace
 * file is found. Turbo runs each package script in the package directory, so the default
 * manifest path must be anchored to the workspace root, not the package.
 */
function findWorkspaceRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return start;
    }
    dir = parent;
  }
}

function resolveManifestPath(): string {
  const fromArg = process.argv[2];
  const fromEnv = process.env["SEO_MANIFEST"];
  if (fromArg) {
    return resolve(process.cwd(), fromArg);
  }
  if (fromEnv) {
    return resolve(process.cwd(), fromEnv);
  }
  return resolve(findWorkspaceRoot(process.cwd()), DEFAULT_MANIFEST);
}

function loadManifest(path: string): SeoManifestEntry[] {
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("The SEO manifest must be an array of route entries.");
  }
  return parsed as SeoManifestEntry[];
}

function reportIssues(issues: SeoIssue[]): void {
  const byPath = new Map<string, SeoIssue[]>();
  for (const issue of issues) {
    const list = byPath.get(issue.path) ?? [];
    list.push(issue);
    byPath.set(issue.path, list);
  }
  for (const [path, list] of byPath) {
    process.stderr.write(`\n${path}\n`);
    for (const issue of list) {
      process.stderr.write(`  [${issue.rule}] ${issue.message}\n`);
    }
  }
}

function main(): void {
  const path = resolveManifestPath();

  if (!existsSync(path)) {
    process.stdout.write(
      `check:seo found no build manifest at ${path}. No routes to validate yet; the gate passes.\n`,
    );
    return;
  }

  const entries = loadManifest(path);
  const issues = validateManifest(entries);

  if (issues.length === 0) {
    process.stdout.write(
      `check:seo passed: ${entries.length} routes validated, no issues.\n`,
    );
    return;
  }

  reportIssues(issues);
  process.stderr.write(
    `\ncheck:seo failed: ${issues.length} issue(s) across ${entries.length} routes.\n`,
  );
  process.exit(1);
}

main();
