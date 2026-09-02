/**
 * Create or update a CMS author (nexoris_cms). Admin only. Expertise arrives comma-separated and is
 * stored as a text[]. On success it returns to the author's profile (edit) or the authors list (create).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { notifyPublished } from "../../../../lib/publish-notify.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** An http(s) URL, or null. A profile link that is not a URL is worse than no link at all. */
function httpUrl(v: FormDataEntryValue | null): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch { return null; }
}

function num(v: FormDataEntryValue | null): number | null { const n = Number(String(v ?? "").trim()); return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null; }

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/authors", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const name = String(f.get("name") ?? "").trim();
  if (!name) return NextResponse.redirect(new URL(`${id ? `/cms/authors/${id}/edit` : "/cms/authors/new"}?error=name`, request.url), { status: 303 });

  const email = String(f.get("email") ?? "").trim() || null;
  const role = String(f.get("role") ?? "Author").trim() || "Author";
  const jobTitle = String(f.get("job_title") ?? "").trim() || null;
  const department = String(f.get("department") ?? "").trim() || null;
  const location = String(f.get("location") ?? "").trim() || null;
  const years = num(f.get("years_experience"));
  const expertise = String(f.get("expertise") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const bio = String(f.get("bio") ?? "").trim() || null;
  const headshot = String(f.get("headshot_url") ?? "").trim() || null;
  const headshotAlt = String(f.get("headshot_alt") ?? "").trim() || null;
  // The author page body, stored as the editor produced it — the same as every other page kind here.
  // The website sanitises CMS HTML at render.
  const profileHtml = String(f.get("profile_html") ?? "").trim() || null;
  const metaTitle = String(f.get("meta_title") ?? "").trim() || null;
  const metaDescription = String(f.get("meta_description") ?? "").trim() || null;
  // Social handles are optional and stored only when they are real URLs, so the profile never renders a
  // link to nowhere. Anything else entered is dropped rather than saved and shown.
  const linkedin = httpUrl(f.get("linkedin_url"));
  const xUrl = httpUrl(f.get("x_url"));
  const featured = f.get("featured") != null;

  // Publishing an author means one thing: they have a public page. It is deliberately separate from
  // `active`, which is whether they can be assigned to content at all. Unpublishing used to set
  // active=false, which quietly retired a person whose byline is on published articles - the page
  // went away and so did their ability to be credited. Now Unpublish takes the page down and leaves
  // the person alone.
  const intent = String(f.get("intent") ?? "save").trim();
  const showOnWebsite =
    intent === "publish" ? true : intent === "unpublish" ? false : f.get("show_on_website") != null;
  const active = intent === "publish" ? true : f.get("active") != null;

  // Generated FAQs arrive as JSON from a hidden field. Anything unparseable is dropped rather than
  // stored: a half-read FAQ set on a public page is worse than none.
  const faqs = ((): { question: string; answer: string }[] => {
    try {
      const parsed: unknown = JSON.parse(String(f.get("faqs") ?? "[]"));
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((x) => x as Record<string, unknown>)
        .filter((x) => typeof x.question === "string" && typeof x.answer === "string")
        .map((x) => ({ question: String(x.question).trim(), answer: String(x.answer).trim() }))
        .filter((x) => x.question.length > 0 && x.answer.length > 0);
    } catch {
      return [];
    }
  })();
  const pool = cmsDb();
  // The website derives an author's URL from their display name; there is no stored slug.
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  // An author's name, title and bio are rendered onto every article they wrote, so a change here has to
  // reach the website. Saving one used to change nothing there until the next timed rebuild.
  const announce = (): Promise<unknown> =>
    // Authors live at the site root now, so that is the path the website revalidates.
    notifyPublished({ path: `/${slug}`, kind: "author", published: active && showOnWebsite });

  if (id) {
    await pool.query(
      `UPDATE cms_author SET name=$1, email=$2, role=$3, job_title=$4, department=$5, location=$6,
              years_experience=$7, expertise=$8, bio=$9, headshot_url=$10, show_on_website=$11,
              featured=$12, active=$13, display_name=$1, headshot_alt=$15, profile_html=$16,
              meta_title=$17, meta_description=$18, linkedin_url=$19, x_url=$20, faqs=$21::jsonb WHERE id=$14`,
      [name, email, role, jobTitle, department, location, years, expertise, bio, headshot, showOnWebsite,
       featured, active, id, headshotAlt, profileHtml, metaTitle, metaDescription, linkedin, xUrl,
       JSON.stringify(faqs)]);
    await announce();
    return NextResponse.redirect(new URL(`/cms/authors/${id}`, request.url), { status: 303 });
  }
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO cms_author (name, display_name, email, role, job_title, department, location, years_experience,
            expertise, bio, headshot_url, show_on_website, featured, active, headshot_alt,
            profile_html, meta_title, meta_description, linkedin_url, x_url, faqs, last_active_at)
     VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb, now()) RETURNING id`,
    [name, email, role, jobTitle, department, location, years, expertise, bio, headshot, showOnWebsite,
     featured, active, headshotAlt, profileHtml, metaTitle, metaDescription, linkedin, xUrl,
     JSON.stringify(faqs)]);
  await announce();
  return NextResponse.redirect(new URL(`/cms/authors/${rows[0]?.id ?? ""}`, request.url), { status: 303 });
}
