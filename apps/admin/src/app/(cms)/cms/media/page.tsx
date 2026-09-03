/**
 * Media Library (CMS design). Header with an Upload action, four stat cards (total assets, images,
 * storage used, added this month), a filter/search bar, and a responsive grid of asset tiles. Tiles show
 * the image when a URL exists and fall back to a typed placeholder otherwise, so the layout is honest
 * about seeded assets that have no hosted file yet. Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import { CalendarPlus, HardDrive, Image as ImageIcon, Layers, Upload } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import Link from "next/link";
import { MediaGrid, type MediaAsset } from "./MediaGrid.js";
import { usageFor, type MediaUse } from "../../../../lib/media-usage.js";
import { isUuid } from "../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

type Asset = MediaAsset;
interface Stats { total: string; images: string; bytes: string; this_month: string }
function fmtSize(b: number): string { if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`; if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`; if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`; return `${b} B`; }

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string; inuse?: string; deleted?: string; saved?: string }> }): Promise<ReactNode> {
  const { page: pageParam, per, q, inuse, deleted, saved } = await searchParams;
  await requireCmsAccess();
  const pool = cmsDb();

  // The stats query already counts the library, so it doubles as the pagination total rather than
  // adding a second count over the same table.
  const { rows: [s] } = await pool.query<Stats>(
      `SELECT count(*)::text total,
              count(*) FILTER (WHERE kind='image')::text images,
              COALESCE(sum(size_bytes),0)::text bytes,
              count(*) FILTER (WHERE created_at >= now() - interval '30 days')::text this_month
         FROM cms_media`);

  const filters = filterClause([{ column: "name", value: q, mode: "ilike" }]);
  const { rows: [filtered] } = await pool.query<{ n: string }>(
    `SELECT count(*)::text n FROM cms_media WHERE true${filters.sql}`, filters.values);
  const total = Number(filtered?.n ?? 0);
  const perPage = perPageFrom(per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(pageParam, pageCount);

  const { rows: assets } = await pool.query<Asset>(
    `SELECT id, name, kind, size_bytes::text, url, alt_text, folder, created_at::text
       FROM cms_media WHERE true${filters.sql}
      ORDER BY created_at DESC
      LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
    [...filters.values, perPage, (page - 1) * perPage]);
  /*
   * When a delete was refused because the files are in use, the page comes back with their ids and
   * looks up exactly where each one appears. The list is shown before anything is removed, so the
   * choice - replace, delete anyway, or leave it - is made with the consequences on screen.
   */
  const inUseIds = (inuse ?? "").split(",").map((x) => x.trim()).filter(isUuid);
  const blocked = inUseIds.length > 0
    ? (await pool.query<{ id: string; name: string; url: string | null }>(
        "SELECT id, name, url FROM cms_media WHERE id = ANY($1::uuid[])", [inUseIds])).rows
    : [];
  const usage: Map<string, MediaUse[]> = blocked.length > 0
    ? await usageFor(blocked.filter((b): b is { id: string; name: string; url: string } => Boolean(b.url)))
    : new Map();
  const replacements = blocked.length === 1
    ? (await pool.query<{ id: string; name: string }>(
        "SELECT id, name FROM cms_media WHERE kind='image' AND id <> ALL($1::uuid[]) ORDER BY created_at DESC LIMIT 100",
        [inUseIds])).rows
    : [];

  const stats = [
    { icon: Layers, label: "Total Assets", value: Number(s?.total ?? 0).toLocaleString(), tint: "#EEEBFC", fg: "#543CDA" },
    { icon: ImageIcon, label: "Images", value: Number(s?.images ?? 0).toLocaleString(), tint: "#EEEBFC", fg: "#543CDA" },
    { icon: HardDrive, label: "Storage Used", value: fmtSize(Number(s?.bytes ?? 0)), tint: "#DCFCE7", fg: "#16A34A" },
    { icon: CalendarPlus, label: "Added This Month", value: Number(s?.this_month ?? 0).toLocaleString(), tint: "#FEF3C7", fg: "#B45309" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Media Library</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Images, video, and documents used across your content.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cms/insights/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Upload size={15} strokeWidth={2.4} /> Upload</Link>
        </div>
      </div>

      {saved ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700">File updated.</p>
      ) : null}
      {deleted ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700">
          Deleted {deleted} file{deleted === "1" ? "" : "s"}.
        </p>
      ) : null}

      {blocked.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5">
          <h2 className="text-[0.95rem] font-700 text-[#92400E]">
            {blocked.length === 1 ? "This file is in use" : "These files are in use"}
          </h2>
          <p className="mt-1 text-[0.83rem] text-[#92400E]">
            Nothing has been deleted. Removing a picture a page is showing leaves a broken frame on
            that page, so here is where each one appears.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {blocked.map((b) => (
              <li key={b.id} className="rounded-lg border border-[#FDE68A] bg-white px-3 py-2.5">
                <p className="text-[0.84rem] font-600 text-slate-900">{b.name}</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {(usage.get(b.id) ?? []).map((u, i) => (
                    <li key={`${b.id}-${i}`} className="text-[0.78rem] text-slate-600">
                      {u.kind}: <Link href={u.href} className="font-600 text-[#543CDA] hover:underline">{u.title}</Link>{" "}
                      <span className="text-slate-500">({u.place})</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            {/* Replacing is offered for one file at a time: choosing a stand-in for several at once
                would be one decision standing for several different ones. */}
            {blocked.length === 1 && replacements.length > 0 ? (
              <form action="/api/cms/media" method="post" className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="id" value={blocked[0]!.id} />
                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.75rem] font-600 text-slate-700">Replace it everywhere with</span>
                  <select name="replace_with" required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.83rem]">
                    <option value="">Choose a file…</option>
                    {replacements.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                <button type="submit" className="rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]">
                  Replace, then delete
                </button>
              </form>
            ) : null}

            <form action="/api/cms/media" method="post">
              <input type="hidden" name="action" value="delete" />
              <input type="hidden" name="force" value="1" />
              {blocked.map((b) => <input type="hidden" name="id" value={b.id} key={b.id} />)}
              <button type="submit" className="rounded-lg border border-[#FCA5A5] bg-white px-4 py-2 text-[0.83rem] font-600 text-[#B91C1C] hover:bg-red-50">
                Delete anyway
              </button>
            </form>
            <Link href="/cms/media" className="px-1 py-2 text-[0.83rem] font-600 text-slate-600 hover:text-slate-900">
              Keep them
            </Link>
          </div>
        </section>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: st.tint, color: st.fg }}><st.icon size={17} /></span>
            <p className="mt-3 text-[1.4rem] font-700 text-slate-900">{st.value}</p>
            <p className="text-[0.78rem] text-slate-500">{st.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters searchPlaceholder="Search media by file name..." />
        <MediaGrid assets={assets} />
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/media" noun="assets" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
