/**
 * Edit Redirect. CMS access only.
 *
 * This screen did not exist. The row menu's "Edit" pointed back at the list, so a redirect could only
 * be created or deleted — and because a mistyped source saves cleanly and then silently never fires,
 * the only way to correct one was to delete it and start again. It also shows what the rule has
 * actually done: how many times it has been served, and when it was last used.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MousePointerClick } from "lucide-react";
import { requireCmsAccess } from "../../../../../../lib/auth.js";
import { cmsDb } from "../../../../../../lib/cms-db.js";
import { RedirectForm, type RedirectValues } from "../../../../../../components/cms/RedirectForm.js";

export const dynamic = "force-dynamic";

interface Row extends RedirectValues {
  id: string;
  hits: number | null;
  last_used: string | null;
}

export default async function EditRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { error } = await searchParams;

  // An id from the URL is untrusted, and Postgres errors on a malformed uuid rather than returning
  // nothing, so a bad one has to be turned away before it reaches the query.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const { rows } = await cmsDb().query<Row>(
    `SELECT id, old_url, new_url, type, status, notes, pattern, case_sensitivity, slash_handling,
            start_date::text AS start_date, expiry_date::text AS expiry_date,
            hits, last_used::text AS last_used
       FROM cms_redirect WHERE id = $1 LIMIT 1`,
    [id]);
  const row = rows[0];
  if (!row) notFound();

  const used = row.last_used ? new Date(row.last_used).toLocaleString("en-NG") : "never";

  return (
    <div>
      <Link href="/cms/seo/redirects" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]">
        <ArrowLeft size={15} /> Back to Redirects
      </Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Redirect</h1>
      <p className="mt-1 inline-flex items-center gap-1.5 text-[0.86rem] text-slate-500">
        <MousePointerClick size={14} />
        Served {Number(row.hits ?? 0).toLocaleString("en-NG")} time{Number(row.hits ?? 0) === 1 ? "" : "s"} · last used {used}
      </p>
      <RedirectForm values={row} {...(error ? { error } : {})} />
    </div>
  );
}
