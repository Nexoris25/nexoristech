/**
 * Publish webhooks (PRD 6.3, 10.3). A document-service middleware watches publish, unpublish, and
 * delete on the website-facing content types. On each, it revalidates the affected ISR routes in
 * apps/web and re-ingests the page into the Oge knowledge base (upsert on publish, delete
 * otherwise), both over shared-secret calls. Failures are logged, never thrown, so an editor's
 * save is never blocked by a downstream hiccup.
 */
import type { Core } from "@strapi/strapi";

type Entry = Record<string, unknown>;

const SITE = process.env.SITE_URL ?? "https://nexoristech.com";
const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const GATEWAY = process.env.OGE_GATEWAY_URL ?? "http://localhost:4000";

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function faqText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      const f = item as Entry;
      return `${str(f.question)} ${str(f.answer)}`.trim();
    })
    .filter(Boolean)
    .join("\n\n");
}

function legalText(entry: Entry): string {
  const sections = Array.isArray(entry.sections) ? entry.sections : [];
  const sectionText = sections
    .map((item) => {
      const s = item as Entry;
      return [str(s.heading), str(s.plainSummary), str(s.body)]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
  return [str(entry.title), str(entry.intro), sectionText]
    .filter(Boolean)
    .join("\n\n");
}

interface CtConfig {
  path: (entry: Entry) => string | null;
  revalidate: string[];
  reingest?: { sourceType: string; text: (entry: Entry) => string };
  populate?: string[];
}

const CONFIG: Record<string, CtConfig> = {
  "api::insight.insight": {
    path: (e) => (e.slug ? `/insights/${str(e.slug)}` : null),
    revalidate: ["/insights", "/"],
    populate: ["faq"],
    reingest: {
      sourceType: "insight",
      text: (e) =>
        [str(e.title), str(e.excerpt), str(e.tldr), str(e.body), faqText(e.faq)]
          .filter(Boolean)
          .join("\n\n"),
    },
  },
  "api::case-study.case-study": {
    path: (e) => (e.slug ? `/case-studies/${str(e.slug)}` : null),
    revalidate: ["/case-studies", "/"],
    reingest: {
      sourceType: "case-study",
      text: (e) =>
        [
          str(e.title),
          str(e.summary),
          str(e.challenge),
          str(e.solution),
          str(e.outcome),
        ]
          .filter(Boolean)
          .join("\n\n"),
    },
  },
  "api::job.job": {
    path: (e) => (e.slug ? `/careers/${str(e.slug)}` : null),
    revalidate: ["/careers"],
  },
  "api::author.author": {
    path: (e) => (e.slug ? `/authors/${str(e.slug)}` : null),
    revalidate: [],
  },
  "api::privacy-policy.privacy-policy": {
    path: () => "/privacy-policy",
    revalidate: [],
    populate: ["sections"],
    reingest: { sourceType: "legal", text: legalText },
  },
  "api::terms-of-service.terms-of-service": {
    path: () => "/terms-of-service",
    revalidate: [],
    populate: ["sections"],
    reingest: { sourceType: "legal", text: legalText },
  },
  "api::cookie-policy.cookie-policy": {
    path: () => "/cookie-policy",
    revalidate: [],
    populate: ["sections"],
    reingest: { sourceType: "legal", text: legalText },
  },
  "api::testimonial.testimonial": { path: () => null, revalidate: ["/"] },
  "api::category.category": { path: () => null, revalidate: ["/insights"] },
};

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function notify(
  strapi: Core.Strapi,
  uid: string,
  action: "publish" | "unpublish" | "delete",
  documentId: string | undefined,
  result: Entry,
): Promise<void> {
  const cfg = CONFIG[uid];
  if (!cfg) return;

  // Re-fetch with the fields the text extractor needs (the action result is not fully populated).
  let entry: Entry = result;
  if (action !== "delete" && documentId) {
    // Cast to a loose query surface: Strapi's generated populate typing rejects a plain array.
    const docs = strapi.documents(
      uid as Parameters<typeof strapi.documents>[0],
    ) as unknown as { findOne: (args: unknown) => Promise<Entry | null> };
    const full = await docs.findOne({
      documentId,
      populate: cfg.populate ?? [],
    });
    if (full) entry = full;
  }

  const pagePath = cfg.path(entry);
  const paths = [pagePath, ...cfg.revalidate].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );

  if (paths.length > 0 && process.env.REVALIDATION_SECRET) {
    // Trailing slash: apps/web redirects (308) paths without it (DECISIONS D-002).
    await postJson(`${WEB_URL}/api/revalidate/`, { paths }, {
      "x-revalidate-secret": process.env.REVALIDATION_SECRET,
    }).catch((e: unknown) =>
      strapi.log.warn(`[webhooks] revalidate failed: ${String(e)}`),
    );
  }

  if (cfg.reingest && pagePath && process.env.OGE_REINGEST_SHARED_SECRET) {
    const url = `${SITE}${pagePath}`;
    const payload =
      action === "publish"
        ? {
            action: "upsert",
            url,
            title: str(entry.title) || pagePath,
            text: cfg.reingest.text(entry),
            sourceType: cfg.reingest.sourceType,
          }
        : { action: "delete", url };
    await postJson(`${GATEWAY}/reingest`, payload, {
      "x-reingest-secret": process.env.OGE_REINGEST_SHARED_SECRET,
    }).catch((e: unknown) =>
      strapi.log.warn(`[webhooks] reingest failed: ${String(e)}`),
    );
  }
}

export function registerWebhooks(strapi: Core.Strapi): void {
  const use = (
    strapi.documents as unknown as {
      use: (
        mw: (
          context: { uid: string; action: string; params?: { documentId?: string } },
          next: () => Promise<unknown>,
        ) => Promise<unknown>,
      ) => void;
    }
  ).use;

  use(async (context, next) => {
    const result = await next();
    const { uid, action } = context;
    if (
      (action === "publish" || action === "unpublish" || action === "delete") &&
      CONFIG[uid]
    ) {
      const doc = (Array.isArray(result) ? result[0] : result) as Entry;
      const documentId =
        context.params?.documentId ?? (str(doc?.documentId) || undefined);
      void notify(strapi, uid, action, documentId, doc ?? {}).catch(
        (e: unknown) => strapi.log.error(`[webhooks] ${String(e)}`),
      );
    }
    return result;
  });
}
