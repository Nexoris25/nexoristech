/**
 * Pushes published CMS content into the Oge gateway's knowledge base (PRD §10.3) so the WEBSITE
 * assistant grounds its answers in real Insights, Case Studies, Legal pages, and programmatic (pSEO)
 * pages, not just the hardcoded marketing site. The CMS calls this on every save: a published item is
 * upserted (re-chunked and re-embedded), anything else is removed. It is fire-and-forget: a slow or
 * absent gateway never blocks an editor from saving, matching the other server-to-server Oge clients.
 */
import { SITE_ORIGIN } from "./site-pages.js";

const GATEWAY = process.env.OGE_GATEWAY_URL ?? "http://localhost:4000";

type ContentKind = "insight" | "case_study" | "legal_page" | "generated_page" | "job";

const SOURCE_TYPE: Record<ContentKind, string> = {
  insight: "insight",
  case_study: "case_study",
  legal_page: "legal",
  generated_page: "programmatic",
  job: "job",
};

/** The canonical public URL the gateway cites when an answer draws on this page. Mirrors the sitemap. */
function publicUrl(kind: ContentKind, slug: string): string | null {
  const s = slug.replace(/^\/+/, "");
  if (!s) return null;
  switch (kind) {
    case "insight": return `${SITE_ORIGIN}/insights/${s}`;
    case "case_study": return `${SITE_ORIGIN}/case-studies/${s}`;
    case "job": return `${SITE_ORIGIN}/careers/${s}`;
    case "legal_page": return `${SITE_ORIGIN}/${s}`;
    case "generated_page": return `${SITE_ORIGIN}/${s}`;
  }
}

const toText = (html: string): string => html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

export interface KbSyncInput {
  kind: ContentKind;
  slug: string;
  title: string;
  status: string;
  excerpt?: string | null;
  metaDescription?: string | null;
  body?: string | null;
}

/**
 * Sync one content item to the knowledge base. Published items are upserted; drafts, archived, and any
 * other status are removed so unpublished content can never leak into a website answer. Never throws.
 */
export async function syncToKnowledgeBase(input: KbSyncInput): Promise<void> {
  const secret = process.env.OGE_REINGEST_SHARED_SECRET;
  if (!secret) return;
  const url = publicUrl(input.kind, input.slug);
  if (!url) return;

  const publish = input.status === "published";
  const lead = [input.excerpt, input.metaDescription].filter(Boolean).join(" ");
  const text = toText(`${input.title}. ${lead} ${input.body ?? ""}`);
  const body = publish
    ? { action: "upsert", url, title: input.title, text, sourceType: SOURCE_TYPE[input.kind] }
    : { action: "delete", url };

  try {
    await fetch(`${GATEWAY}/reingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-reingest-secret": secret },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Best-effort. The publish already succeeded; a scheduled full re-ingest reconciles any miss.
  }
}
