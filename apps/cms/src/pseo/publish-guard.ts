/**
 * The programmatic-page publish guard (PRD 9.7). A document-service middleware that, before a
 * pseo-page publishes, builds its readiness record and runs the shared quality gate. If the page
 * cannot clear the gate it is blocked with the exact reasons, so a thin, templated, or
 * incomplete programmatic page can never go live. The layer stays unpublished by default.
 */
import type { Core } from "@strapi/strapi";
// @strapi/utils is resolved at runtime as a core dependency but ships without bundled types here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no type declarations for @strapi/utils in this setup
import { errors } from "@strapi/utils";
import {
  evaluatePublishable,
  type ReadinessRecord,
  type PageIntent,
} from "@nexoris/pseo";

const UID = "api::pseo-page.pseo-page";

interface Component {
  label?: string;
}
interface PseoEntry {
  intent?: PageIntent;
  summary?: string;
  body?: string;
  painPoints?: string;
  pricing?: string;
  comparison?: string;
  location?: string;
  hasProprietaryInsight?: boolean;
  featureMatrix?: unknown[];
  dataSources?: Component[];
  localDataPoints?: Component[];
  author?: { slug?: string } | null;
  factChecker?: { slug?: string } | null;
}

function words(...texts: (string | undefined)[]): number {
  return texts
    .filter(Boolean)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function labels(items: Component[] | undefined): string[] {
  return Array.isArray(items)
    ? items.map((i) => (i.label ?? "").trim()).filter(Boolean)
    : [];
}

function buildRecord(entry: PseoEntry): ReadinessRecord {
  const pricing = (entry.pricing ?? "").trim();
  const comparison = (entry.comparison ?? "").trim();
  return {
    ...(entry.author?.slug ? { authorSlug: entry.author.slug } : {}),
    ...(entry.factChecker?.slug
      ? { factCheckerSlug: entry.factChecker.slug }
      : {}),
    dataSources: labels(entry.dataSources),
    hasProprietaryInsight: Boolean(entry.hasProprietaryInsight),
    featureMatrixRows: Array.isArray(entry.featureMatrix)
      ? entry.featureMatrix.length
      : 0,
    intent: entry.intent ?? "capability",
    hasPricingTable: pricing.length > 0,
    hasComparisonMatrix: comparison.length > 0,
    isLocationPage: Boolean((entry.location ?? "").trim()),
    localDataPoints: labels(entry.localDataPoints),
    uniqueWordCount: words(
      entry.summary,
      entry.body,
      entry.painPoints,
      entry.pricing,
      entry.comparison,
    ),
  };
}

export function registerPublishGuard(strapi: Core.Strapi): void {
  const documents = strapi.documents as unknown as {
    use: (
      mw: (
        context: { uid: string; action: string; params?: { documentId?: string } },
        next: () => Promise<unknown>,
      ) => Promise<unknown>,
    ) => void;
  };

  documents.use(async (context, next) => {
    if (context.action === "publish" && context.uid === UID) {
      const documentId = context.params?.documentId;
      if (documentId) {
        // Cast to a loose query surface: Strapi's generated populate typing rejects a plain array.
        const docs = strapi.documents(
          UID as Parameters<typeof strapi.documents>[0],
        ) as unknown as {
          findOne: (args: unknown) => Promise<PseoEntry | null>;
        };
        const entry = await docs.findOne({
          documentId,
          status: "draft",
          populate: [
            "author",
            "factChecker",
            "featureMatrix",
            "dataSources",
            "localDataPoints",
          ],
        });
        if (entry) {
          const { publishable, reasons } = evaluatePublishable(
            buildRecord(entry),
          );
          if (!publishable) {
            throw new errors.ApplicationError(
              `This programmatic page cannot be published yet. ${reasons.join(" ")}`,
            );
          }
        }
      }
    }
    return next();
  });
}
