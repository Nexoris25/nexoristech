/**
 * llms.txt for the Nexoris Technologies platform (PRD 9.8).
 *
 * A machine-readable summary at the site root of who Nexoris Technologies is, every service,
 * every industry, and the contact path, for AI answer engines. It is built from the real
 * catalogue passed in, so it never lists a page that does not exist. The voice rules apply: plain
 * spoken English, no em dashes, no buzzwords, "Nexoris Technologies" in full.
 */
import { ORGANISATION, SITE_ORIGIN } from "./constants.js";
import { absoluteUrl } from "./url.js";

/** A catalogue entry: a service or an industry with its page. */
export interface CatalogueEntry {
  name: string;
  path: string;
  /** A short plain-language line describing it. */
  summary?: string;
}

/** Input to the llms.txt builder. */
export interface LlmsTxtInput {
  /** A one-line description of what Nexoris Technologies does. */
  summary: string;
  services: CatalogueEntry[];
  industries: CatalogueEntry[];
}

function listEntries(entries: CatalogueEntry[]): string {
  return entries
    .map((entry) => {
      const url = absoluteUrl(entry.path);
      return entry.summary
        ? `- [${entry.name}](${url}): ${entry.summary}`
        : `- [${entry.name}](${url})`;
    })
    .join("\n");
}

/** Build the llms.txt content. */
export function buildLlmsTxt(input: LlmsTxtInput): string {
  return [
    `# ${ORGANISATION.name}`,
    "",
    `> ${input.summary}`,
    "",
    "## Services",
    "",
    listEntries(input.services),
    "",
    "## Industries",
    "",
    listEntries(input.industries),
    "",
    "## Contact",
    "",
    `- Website: ${SITE_ORIGIN}/`,
    `- Start a project: ${absoluteUrl("/contact")}`,
    `- General enquiries: ${ORGANISATION.email}`,
    `- New business: ${ORGANISATION.businessEmail}`,
    `- Phone and WhatsApp: ${ORGANISATION.telephone}`,
    "",
  ].join("\n");
}
