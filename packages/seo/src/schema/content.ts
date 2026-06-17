/**
 * Content JSON-LD nodes for the Nexoris Technologies platform: Article or BlogPosting with
 * author and reviewer, ProfilePage for authors, JobPosting for open roles, and Article for case
 * studies (PRD 9.2, Part Two Section 11).
 *
 * Every builder omits any field whose real data is absent (prune), so the structured data is
 * never fabricated. The fact-checker becomes the reviewer Person. Author sameAs is the
 * LinkedIn profile, a direct EEAT signal.
 */
import { COUNTRY_CODE, LOCALE } from "../constants.js";
import { absoluteUrl } from "../url.js";
import { SITE_NODE_IDS } from "./site.js";
import type { ImageInput } from "./page.js";
import { imageObjectNode } from "./page.js";
import type { JsonLdNode } from "./jsonld.js";

/** A person on an article: the author, or the fact-checker acting as reviewer. */
export interface PersonRef {
  name: string;
  /** The author profile slug, for the Person @id and url. */
  slug?: string;
  /** The LinkedIn URL, used for sameAs. */
  linkedinUrl?: string;
  jobTitle?: string;
}

function personNode(person: PersonRef): JsonLdNode {
  const url = person.slug ? absoluteUrl(`/authors/${person.slug}`) : undefined;
  return {
    "@type": "Person",
    "@id": url ? `${url}#person` : undefined,
    name: person.name,
    url,
    jobTitle: person.jobTitle,
    sameAs: person.linkedinUrl ? [person.linkedinUrl] : undefined,
    worksFor: { "@id": SITE_NODE_IDS.organization },
  };
}

/** The article subtype. Standard articles use Article; editorial blog posts use BlogPosting. */
export type ArticleType = "Article" | "BlogPosting";

/** Input to the article node builder. */
export interface ArticleInput {
  type?: ArticleType;
  path: string;
  headline: string;
  description: string;
  image?: ImageInput;
  author: PersonRef;
  /** The fact-checker, emitted as the reviewer Person (PRD 4.2). */
  reviewer?: PersonRef;
  /** The category, emitted as articleSection (PRD 9.2). */
  articleSection?: string;
  datePublished?: string;
  dateModified?: string;
}

/** The Article or BlogPosting node (PRD 9.2, Part Two Section 11). */
export function articleNode(input: ArticleInput): JsonLdNode {
  const url = absoluteUrl(input.path);
  return {
    "@type": input.type ?? "Article",
    "@id": `${url}#article`,
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    image: input.image ? imageObjectNode(input.image) : undefined,
    author: personNode(input.author),
    reviewer: input.reviewer ? personNode(input.reviewer) : undefined,
    publisher: { "@id": SITE_NODE_IDS.organization },
    articleSection: input.articleSection,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: LOCALE,
  };
}

/** Input to the author ProfilePage builder. */
export interface ProfileInput {
  slug: string;
  name: string;
  jobTitle?: string;
  /** Up to three interchangeable roles (PRD Part Two Section 5). */
  roles?: string[];
  linkedinUrl?: string;
  otherSameAs?: string[];
  /** Topics the author knows about (knowsAbout), strengthening topical authority. */
  knowsAbout?: string[];
  image?: ImageInput;
}

/** The ProfilePage node with a Person mainEntity (PRD 9.2, Part Two Section 5). */
export function profilePageNode(input: ProfileInput): JsonLdNode {
  const url = absoluteUrl(`/authors/${input.slug}`);
  const sameAs = [
    ...(input.linkedinUrl ? [input.linkedinUrl] : []),
    ...(input.otherSameAs ?? []),
  ];
  return {
    "@type": "ProfilePage",
    "@id": `${url}#profilepage`,
    url,
    inLanguage: LOCALE,
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#person`,
      name: input.name,
      jobTitle:
        input.jobTitle ??
        (input.roles && input.roles.length > 0 ? input.roles[0] : undefined),
      sameAs: sameAs.length > 0 ? sameAs : undefined,
      knowsAbout:
        input.knowsAbout && input.knowsAbout.length > 0
          ? input.knowsAbout
          : undefined,
      image: input.image ? input.image.url : undefined,
      worksFor: { "@id": SITE_NODE_IDS.organization },
    },
  };
}

/** Input to the JobPosting builder. */
export interface JobInput {
  path: string;
  title: string;
  description: string;
  datePosted?: string;
  employmentType?: string;
  /** The job location locality, for example "Lagos". Country is always NG. */
  locationLocality?: string;
}

/** The JobPosting node, emitted per open role; closed roles emit nothing (PRD 9.2). */
export function jobPostingNode(input: JobInput): JsonLdNode {
  return {
    "@type": "JobPosting",
    title: input.title,
    description: input.description,
    datePosted: input.datePosted,
    employmentType: input.employmentType,
    hiringOrganization: { "@id": SITE_NODE_IDS.organization },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: input.locationLocality,
        addressCountry: COUNTRY_CODE,
      },
    },
    url: absoluteUrl(input.path),
  };
}

/** Input to the case study Article builder. */
export interface CaseStudyInput {
  path: string;
  headline: string;
  description: string;
  image?: ImageInput;
  /** The related service and industry page paths, emitted as about references. */
  aboutPaths?: string[];
  datePublished?: string;
  dateModified?: string;
}

/** The case study Article node, with about referencing the related service and industry. */
export function caseStudyNode(input: CaseStudyInput): JsonLdNode {
  const url = absoluteUrl(input.path);
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    image: input.image ? imageObjectNode(input.image) : undefined,
    publisher: { "@id": SITE_NODE_IDS.organization },
    about:
      input.aboutPaths && input.aboutPaths.length > 0
        ? input.aboutPaths.map((p) => ({
            "@type": "Thing",
            url: absoluteUrl(p),
          }))
        : undefined,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: LOCALE,
  };
}
