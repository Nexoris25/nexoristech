/**
 * The page graph assembler for the Nexoris Technologies platform.
 *
 * Assembles the single JSON-LD @graph each route emits (PRD 9.2): the four site-wide nodes
 * on every page, the WebPage node subtyped per route class with its BreadcrumbList, and the
 * nodes required for that route class (Service and FAQPage for service, industry, and
 * programmatic pages; Article and FAQPage for Insights; ProfilePage for authors; JobPosting
 * for open roles; a case study Article for case study details). prune drops every absent field.
 */
import type { RouteClass } from "../types.js";
import { buildGraph } from "./jsonld.js";
import type { JsonLdNode } from "./jsonld.js";
import { siteNodes } from "./site.js";
import { webPageNode } from "./page.js";
import type { WebPageInput } from "./page.js";
import { faqPageNode, serviceNode } from "./service.js";
import type { FaqItem, ServiceInput } from "./service.js";
import {
  articleNode,
  caseStudyNode,
  jobPostingNode,
  profilePageNode,
} from "./content.js";
import type {
  ArticleInput,
  CaseStudyInput,
  JobInput,
  ProfileInput,
} from "./content.js";

/** Input to the page graph builder. */
export interface PageGraphInput {
  page: WebPageInput;
  /** The site logo URL for the Organization node, when available. */
  logoUrl?: string;
  /** FAQ items, for any route class that renders an FAQ section. */
  faq?: FaqItem[];
  /** Service details for service, industry, and programmatic pages. */
  service?: ServiceInput;
  /** Article details for Insights articles. */
  article?: ArticleInput;
  /** Author profile details for author pages. */
  profile?: ProfileInput;
  /** Job details for an open role. */
  job?: JobInput;
  /** Case study details for a case study page. */
  caseStudy?: CaseStudyInput;
  /**
   * Nodes a route class needs that the builder has no slot for.
   *
   * Used by an Insights article marked HowTo, which emits a HowTo node in place of the Article one:
   * HowTo is not an Article subtype, so it cannot be expressed through `article`.
   */
  extraNodes?: JsonLdNode[];
}

/**
 * Build the full JSON-LD @graph document for a page. The route class on `page` decides which
 * class-specific nodes are added; missing data simply omits the corresponding node.
 */
export function buildPageGraph(input: PageGraphInput): JsonLdNode {
  const nodes: JsonLdNode[] = [
    ...siteNodes(input.logoUrl),
    webPageNode(input.page),
  ];

  const routeClass: RouteClass = input.page.routeClass;

  if (
    routeClass === "service" ||
    routeClass === "industry" ||
    routeClass === "pseo"
  ) {
    if (input.service) {
      nodes.push(serviceNode(input.service));
    }
  }

  if (routeClass === "insight" && input.article) {
    nodes.push(articleNode(input.article));
  }

  if (routeClass === "author" && input.profile) {
    nodes.push(profilePageNode(input.profile));
  }

  if (routeClass === "job" && input.job) {
    nodes.push(jobPostingNode(input.job));
  }

  if (routeClass === "case-study" && input.caseStudy) {
    nodes.push(caseStudyNode(input.caseStudy));
  }

  // FAQPage is emitted only when an FAQ section exists, never empty (PRD 9.11).
  if (input.faq) {
    const faq = faqPageNode(input.faq);
    if (faq) {
      nodes.push(faq);
    }
  }

  if (input.extraNodes) nodes.push(...input.extraNodes);

  return buildGraph(nodes);
}
