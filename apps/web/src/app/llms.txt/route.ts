/**
 * llms.txt, generated at the site root from real sources (PRD 9.8). The services and industries come from
 * the site's own page catalogue, and the Insights section is built live from the published CMS content, so
 * the file never lists a page that does not exist and stays current as articles are published. Replaces the
 * old static public/llms.txt. Served as text/plain with light ISR caching.
 */
import { buildLlmsTxt, absoluteUrl, type CatalogueEntry } from "@nexoris/seo";
import { servicePages, industryPages, about, howWeWork, caseStudies as caseStudiesPage } from "../../content/index.js";
import { getAllInsightCards, getAllCaseStudies } from "../../lib/cms.js";
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
  const studies = (await getAllCaseStudies()).map((c) => ({
    name: c.title,
    path: `/case-studies/${c.slug}`,
    ...(c.summary ? { summary: c.summary } : {}),
  }));

  let text = buildLlmsTxt({
    summary: SUMMARY,
    services,
    industries,
    company,
    ...(studies.length > 0 ? { caseStudies: studies } : {}),
  });

  const insights = await getAllInsightCards(40);
  if (insights.length > 0) {
    const lines = insights.map((i) => {
      const url = absoluteUrl(`/insights/${i.slug}`);
      return i.excerpt ? `- [${i.title}](${url}): ${i.excerpt}` : `- [${i.title}](${url})`;
    });
    text += `\n## Insights\n\n${lines.join("\n")}\n`;
  }

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400" },
  });
}
