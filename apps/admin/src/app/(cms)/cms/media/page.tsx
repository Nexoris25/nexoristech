/**
 * Media Library (CMS design). Header with an Upload action, four stat cards (total assets, images,
 * storage used, added this month), a filter/search bar, and a responsive grid of asset tiles. Tiles show
 * the image when a URL exists and fall back to a typed placeholder otherwise, so the layout is honest
 * about seeded assets that have no hosted file yet. Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import { CalendarPlus, FileText, Film, HardDrive, Image as ImageIcon, Layers, Upload } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Asset { id: string; name: string; kind: string; size_bytes: string; url: string | null; folder: string; created_at: string }
interface Stats { total: string; images: string; bytes: string; this_month: string }
function fmtSize(b: number): string { if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`; if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`; if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`; return `${b} B`; }
const KIND_ICON: Record<string, typeof ImageIcon> = { image: ImageIcon, video: Film, document: FileText };
const KIND_TINT: Record<string, string> = { image: "#EEEBFC", video: "#DBEAFE", document: "#FEF3C7" };
const KIND_FG: Record<string, string> = { image: "#543CDA", video: "#2563EB", document: "#B45309" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string }> }): Promise<ReactNode> {
  const { page: pageParam, per, q } = await searchParams;
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
    `SELECT id, name, kind, size_bytes::text, url, folder, created_at::text
       FROM cms_media WHERE true${filters.sql}
      ORDER BY created_at DESC
      LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
    [...filters.values, perPage, (page - 1) * perPage]);
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
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {assets.map((a) => {
            const Icon = KIND_ICON[a.kind] ?? FileText;
            return (
              <div key={a.id} className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
                  {a.url ? <img src={a.url} alt="" className="h-full w-full object-cover" /> : (
                    <span className="grid h-full w-full place-items-center" style={{ background: `${KIND_TINT[a.kind] ?? "#F1F5F9"}` }}>
                      <Icon size={30} style={{ color: KIND_FG[a.kind] ?? "#94A3B8" }} />
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[0.62rem] font-600 uppercase tracking-wide text-slate-500 backdrop-blur">{a.kind}</span>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[0.78rem] font-600 text-slate-800" title={a.name}>{a.name}</p>
                  <p className="mt-0.5 flex items-center justify-between text-[0.68rem] text-slate-500"><span>{a.folder}</span><span>{fmtSize(Number(a.size_bytes))}</span></p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/media" noun="assets" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
