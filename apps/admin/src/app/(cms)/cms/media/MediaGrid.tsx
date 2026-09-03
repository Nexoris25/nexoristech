"use client";
/**
 * The media grid, with selection and editing.
 *
 * The tiles used to be links and nothing else: a library you could look at but not manage, so a
 * file uploaded with the wrong name or a weak alt text stayed that way. Three things are possible
 * now — rename, retitle, and remove — and all three go through native forms posting to a route
 * handler, matching how the rest of this admin submits.
 *
 * Alt text is editable here because it is the one field that decides whether an image means
 * anything to a reader who cannot see it, and it is written by a model at upload time. A generated
 * description is a good first draft and a poor last word.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { FileText, Film, Image as ImageIcon, Pencil, Trash2, X } from "lucide-react";

export interface MediaAsset {
  id: string;
  name: string;
  kind: string;
  size_bytes: string;
  url: string | null;
  alt_text: string | null;
  folder: string;
  created_at: string;
}

const KIND_ICON: Record<string, typeof ImageIcon> = { image: ImageIcon, video: Film, document: FileText };
const KIND_TINT: Record<string, string> = { image: "#EEEBFC", video: "#DBEAFE", document: "#FEF3C7" };
const KIND_FG: Record<string, string> = { image: "#543CDA", video: "#2563EB", document: "#B45309" };

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] text-slate-900 outline-none focus:border-[#543CDA] focus:ring-2 focus:ring-[#543CDA]/15";

function fmtSize(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`;
  return `${b} B`;
}

export function MediaGrid({ assets }: { assets: MediaAsset[] }): ReactNode {
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<MediaAsset | null>(null);

  const toggle = (id: string): void =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      {/* The selection bar only exists while something is selected: a permanent empty toolbar is a
          control that spends most of its life saying nothing. */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#F8F7FE] px-4 py-2.5">
          <span className="text-[0.82rem] font-600 text-slate-700">
            {selected.length} file{selected.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.8rem] font-600 text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
            <form action="/api/cms/media" method="post">
              <input type="hidden" name="action" value="delete" />
              {selected.map((id) => (
                <input type="hidden" name="id" value={id} key={id} />
              ))}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-white px-3 py-1.5 text-[0.8rem] font-600 text-[#B91C1C] hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete selected
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {assets.map((a) => {
          const Icon = KIND_ICON[a.kind] ?? FileText;
          const on = selected.includes(a.id);
          return (
            <div
              key={a.id}
              className={`group relative overflow-hidden rounded-xl border bg-white transition-shadow ${on ? "border-[#543CDA] ring-2 ring-[#543CDA]/20" : "border-slate-200 hover:shadow-md"}`}
            >
              <label className="absolute left-2 top-2 z-10 grid h-6 w-6 cursor-pointer place-items-center rounded-md border border-slate-200 bg-white/95 backdrop-blur">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(a.id)}
                  className="h-3.5 w-3.5 cursor-pointer accent-[#543CDA]"
                  aria-label={`Select ${a.name}`}
                />
              </label>
              <button
                type="button"
                onClick={() => setEditing(a)}
                title={`Edit ${a.name}`}
                className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-md border border-slate-200 bg-white/95 text-slate-600 opacity-0 backdrop-blur transition-opacity hover:text-[#543CDA] focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Pencil size={13} />
              </button>

              {/* Opening the file is still what clicking the picture does. */}
              <a
                {...(a.url ? { href: a.url, target: "_blank", rel: "noreferrer" } : {})}
                className="block"
                tabIndex={a.url ? 0 : -1}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
                  {a.url ? (
                    <img src={a.url} alt={a.alt_text ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <span
                      className="grid h-full w-full place-items-center"
                      style={{ background: KIND_TINT[a.kind] ?? "#F1F5F9" }}
                    >
                      <Icon size={30} style={{ color: KIND_FG[a.kind] ?? "#94A3B8" }} />
                    </span>
                  )}
                </div>
              </a>
              <div className="p-2.5">
                <p className="truncate text-[0.78rem] font-600 text-slate-800" title={a.name}>{a.name}</p>
                <p className="mt-0.5 flex items-center justify-between text-[0.68rem] text-slate-500">
                  <span>{a.folder}</span>
                  <span>{fmtSize(Number(a.size_bytes))}</span>
                </p>
                {/* Missing alt text is called out here rather than left to a later audit: this is the
                    screen where somebody is already looking at the picture. */}
                {a.kind === "image" && !a.alt_text ? (
                  <p className="mt-1 text-[0.66rem] font-600 text-[#B45309]">No alt text</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[1rem] font-700 text-slate-900">Edit file</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            {editing.url ? (
              <img src={editing.url} alt={editing.alt_text ?? ""} className="mt-3 max-h-44 w-full rounded-lg object-contain" />
            ) : null}
            <form action="/api/cms/media" method="post" className="mt-4 flex flex-col gap-3">
              <input type="hidden" name="action" value="update" />
              <input type="hidden" name="id" value={editing.id} />
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.78rem] font-600 text-slate-700">File name</span>
                <input name="name" defaultValue={editing.name} required className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.78rem] font-600 text-slate-700">Alt text</span>
                <textarea name="alt_text" rows={3} defaultValue={editing.alt_text ?? ""} className={field} />
                <span className="text-[0.74rem] text-slate-500">
                  What somebody who cannot see the picture needs to know. Describe what it shows, not
                  that it is an image.
                </span>
              </label>
              <div className="mt-1 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-[0.83rem] font-600 text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
