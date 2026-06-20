/**
 * The reserved-slug guard (PRD 9.1): a reserved-slug list protects every routable path so no new
 * programmatic page can collide with an existing one. Programmatic pages own top-level flat slugs,
 * so this guards the pseo-page type against the hardcoded marketing slugs (the 11 services and 20
 * industries, from the canonical registry) and the fixed top-level routes. Other content types are
 * namespaced (/insights, /careers, /authors, /case-studies) and cannot collide at the top level.
 */
import type { Core } from "@strapi/strapi";
// @strapi/utils is resolved at runtime as a core dependency but ships without bundled types here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no type declarations for @strapi/utils in this setup
import { errors } from "@strapi/utils";
import { SERVICES, INDUSTRIES } from "@nexoris/recommend";

const FIXED_ROUTES = [
  "about",
  "how-we-work",
  "case-studies",
  "contact",
  "insights",
  "careers",
  "authors",
  "privacy-policy",
  "terms-of-service",
  "cookie-policy",
];

const RESERVED = new Set<string>([
  ...SERVICES.map((s) => s.slug),
  ...INDUSTRIES.map((i) => i.slug),
  ...FIXED_ROUTES,
]);

const GUARDED_UID = "api::pseo-page.pseo-page";

export function registerReservedSlugGuard(strapi: Core.Strapi): void {
  const documents = strapi.documents as unknown as {
    use: (
      mw: (
        context: {
          uid: string;
          action: string;
          params?: { data?: { slug?: unknown } };
        },
        next: () => Promise<unknown>,
      ) => Promise<unknown>,
    ) => void;
  };

  documents.use(async (context, next) => {
    if (
      (context.action === "create" || context.action === "update") &&
      context.uid === GUARDED_UID
    ) {
      const slug = context.params?.data?.slug;
      if (typeof slug === "string" && RESERVED.has(slug)) {
        throw new errors.ApplicationError(
          `The slug "${slug}" is reserved by an existing page. Choose a different slug.`,
        );
      }
    }
    return next();
  });
}
