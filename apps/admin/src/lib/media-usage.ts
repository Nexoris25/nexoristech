/**
 * Where an uploaded file is actually used.
 *
 * Deleting a picture that an article is showing leaves a broken frame on a published page, and
 * nothing in the CMS would have said so: the media library and the content that references it are
 * two tables with no foreign key between them, because the reference is a URL inside a body of
 * HTML rather than a column.
 *
 * So usage is found by searching for the URL where it can appear: inside an article body, as an
 * article's cover, as an author's headshot. That is a text search, which means it is honest about
 * what it can prove — it finds a reference that is there and it cannot promise there is no other
 * one — so the interface offers it as a warning and never as a guarantee.
 */
import { cmsDb } from "./cms-db.js";

export interface MediaUse {
  /** What is using it, in words an editor recognises. */
  readonly kind: "Insight" | "Case study" | "Generated page" | "Job" | "Legal page" | "Author";
  readonly title: string;
  /** Where to go and change it. */
  readonly href: string;
  /** Whether the file is the cover, the headshot, or inside the body. */
  readonly place: "cover" | "body" | "headshot";
}

const KIND_LABEL: Record<string, MediaUse["kind"]> = {
  insight: "Insight",
  case_study: "Case study",
  generated_page: "Generated page",
  job: "Job",
  legal_page: "Legal page",
};

const KIND_PATH: Record<string, string> = {
  insight: "/cms/insights",
  case_study: "/cms/case-studies",
  generated_page: "/cms/generated-pages",
  job: "/cms/jobs",
  legal_page: "/cms/legal-pages",
};

/** Every place the given URLs are referenced, keyed by media id. */
export async function usageFor(
  files: { id: string; url: string }[],
): Promise<Map<string, MediaUse[]>> {
  const out = new Map<string, MediaUse[]>();
  const usable = files.filter((f) => f.url && f.url.trim().length > 0);
  if (usable.length === 0) return out;

  const pool = cmsDb();
  for (const file of usable) {
    const uses: MediaUse[] = [];

    const content = await pool.query<{ id: string; kind: string; title: string; is_cover: boolean }>(
      `SELECT id, kind, title, (featured_image = $1) AS is_cover
         FROM cms_content
        WHERE featured_image = $1 OR body LIKE '%' || $1 || '%'
        LIMIT 50`,
      [file.url],
    );
    for (const row of content.rows) {
      uses.push({
        kind: KIND_LABEL[row.kind] ?? "Insight",
        title: row.title,
        href: `${KIND_PATH[row.kind] ?? "/cms/insights"}/${row.id}`,
        place: row.is_cover ? "cover" : "body",
      });
    }

    const authors = await pool.query<{ id: string; name: string; is_headshot: boolean }>(
      `SELECT id, name, (headshot_url = $1) AS is_headshot
         FROM cms_author
        WHERE headshot_url = $1 OR COALESCE(profile_html, '') LIKE '%' || $1 || '%'
        LIMIT 50`,
      [file.url],
    );
    for (const row of authors.rows) {
      uses.push({
        kind: "Author",
        title: row.name,
        href: `/cms/authors/${row.id}/edit`,
        place: row.is_headshot ? "headshot" : "body",
      });
    }

    if (uses.length > 0) out.set(file.id, uses);
  }
  return out;
}

/**
 * Swap every reference to one file for another, everywhere it appears.
 *
 * Offered when a file being deleted is in use: the alternative is a page with a hole in it. It is a
 * plain string replacement across the same three places usage is found, done in one transaction so
 * a half-finished swap cannot leave some pages pointing at a file that no longer exists.
 */
export async function replaceEverywhere(fromUrl: string, toUrl: string): Promise<number> {
  const pool = cmsDb();
  const client = await pool.connect();
  let changed = 0;
  try {
    await client.query("BEGIN");
    const a = await client.query(
      `UPDATE cms_content
          SET featured_image = CASE WHEN featured_image = $1 THEN $2 ELSE featured_image END,
              body = REPLACE(COALESCE(body, ''), $1, $2)
        WHERE featured_image = $1 OR body LIKE '%' || $1 || '%'`,
      [fromUrl, toUrl],
    );
    const b = await client.query(
      `UPDATE cms_author
          SET headshot_url = CASE WHEN headshot_url = $1 THEN $2 ELSE headshot_url END,
              profile_html = REPLACE(COALESCE(profile_html, ''), $1, $2)
        WHERE headshot_url = $1 OR COALESCE(profile_html, '') LIKE '%' || $1 || '%'`,
      [fromUrl, toUrl],
    );
    await client.query("COMMIT");
    changed = (a.rowCount ?? 0) + (b.rowCount ?? 0);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  return changed;
}
