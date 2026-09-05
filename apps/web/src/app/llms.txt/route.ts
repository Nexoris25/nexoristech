/**
 * llms.txt, generated at the site root from real sources (PRD 9.8). The services and industries come from
 * the site's own page catalogue, and the Insights section is built live from the published CMS content, so
 * the file never lists a page that does not exist and stays current as articles are published. Replaces the
 * old static public/llms.txt. Served as text/plain with light ISR caching.
 */
import { buildLlmsTxt, absoluteUrl, type CatalogueEntry } from "@nexoris/seo";
import { servicePages, industryPages, about, howWeWork, caseStudies as caseStudiesPage } from "../../content/index.js";
import { getDiscoveryEntries, getAuthorSlugs, getAuthor } from "../../lib/cms.js";
import type { MarketingPage } from "../../content/types.js";

export const revalidate = 300;
export const dynamic = "force-static";

const SUMMARY = "Nexoris Technologies designs and builds custom software for businesses in Nigeria and abroad, adding AI where it genuinely helps.";
const cleanName = (title: string): string => (title.split("|")[0] ?? title).trim();
const toEntry = (p: MarketingPage): CatalogueEntry => ({ name: cleanName(p.meta.title), path: p.meta.slug, summary: p.meta.description });

export async function GET(): Promise<Response> {
  const services = servicePages.map(toEntry);
  const industries = industryPages.map(toEntry);

  /*
   * Who the company is, and the proof behind what it sells.
   *
   * The file listed services and industries and nothing else, so an assistant asked "who are Nexoris
   * Technologies" had no page to cite for the answer, and every claim in the services list arrived
   * with no evidence to point at. These are the two things an answer engine weighs most.
   */
  const company = [about, howWeWork, caseStudiesPage].map(toEntry);
  company.push({ name: "Meet Oge", path: "/oge", summary: "Our website assistant and how it helps." }, { name: "Careers", path: "/careers", summary: "Working with Nexoris Technologies and current opportunities." });

  let text = buildLlmsTxt({
    summary: SUMMARY,
    services,
    industries,
    company,
  });

  const clean = (value: string): string => value.replace(/[\r\n]+/g, " ").replace(/[[\]<>]/g, "").trim();
  const content = await getDiscoveryEntries();
  for (const [kind, title] of [["insight", "Insights"], ["generated_page", "Guides"], ["job", "Open roles"]]) {
    const entries = content.filter(entry => entry.kind === kind);
    if (entries.length) text += `\n## ${title}\n\n${entries.map(entry => `- [${clean(entry.title)}](${absoluteUrl(entry.path)})${entry.summary ? `: ${clean(entry.summary)}` : ""}`).join("\n")}\n`;
  }
  const authors = await Promise.all((await getAuthorSlugs()).map(async slug => ({ slug, author: await getAuthor(slug) })));
  if (authors.length) text += `\n## Authors\n\n${authors.filter(a => a.author).map(a => `- [${clean(a.author!.name)}](${absoluteUrl(`/${a.slug}`)})`).join("\n")}\n`;
  text += `\n## Policies\n\n${["privacy-policy", "terms-of-service", "cookie-policy"].map(slug => `- [${slug.replace(/-/g, " ")}](${absoluteUrl(`/${slug}`)})`).join("\n")}\n`;

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400" },
  });
}
