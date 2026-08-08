"use client";
/**
 * Several images for one record, for case studies.
 *
 * A case study had one cover image, which is enough for a card and not enough for the work itself: a
 * project is shown through a set of screens. The cover stays as the cover — it is what the card and the
 * social preview use — and this holds everything else, in the order they should be shown.
 *
 * Each image carries its own alt text. That is not optional politeness: a gallery of screenshots with no
 * alt text is a gallery that a screen reader announces as nothing at all, and the images are the point
 * of the section.
 *
 * The whole list is submitted as one JSON field, so the number of images is not fixed by the form.
 */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { ImagePlus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

export interface GalleryImage { url: string; alt: string }

export function ImageGallery({ name, label, folder, initial = [] }: {
  name: string;
  label: string;
  folder: string;
  initial?: GalleryImage[];
}): ReactNode {
  const [images, setImages] = useState<GalleryImage[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    const added: GalleryImage[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      try {
        const res = await fetch("/api/cms/upload", { method: "POST", body });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        const json = (await res.json()) as { url?: string; altText?: string };
        if (json.url) added.push({ url: json.url, alt: json.altText ?? "" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "That upload did not complete.");
      }
    }
    setImages((cur) => [...cur, ...added]);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const move = (i: number, by: number): void => setImages((cur) => {
    const next = [...cur];
    const to = i + by;
    if (to < 0 || to >= next.length) return cur;
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item!);
    return next;
  });

  const setAlt = (i: number, alt: string): void =>
    setImages((cur) => cur.map((img, j) => (j === i ? { ...img, alt } : img)));

  const remove = (i: number): void => setImages((cur) => cur.filter((_, j) => j !== i));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.8rem] font-600 text-slate-700">{label}</span>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.78rem] font-600 text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {busy ? "Uploading" : "Add images"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files)} />

      {error ? <p role="alert" className="mt-2 text-[0.76rem] font-600 text-[#B91C1C]">{error}</p> : null}

      {images.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 text-[0.78rem] leading-relaxed text-slate-600">
          No extra images yet. The cover above is used on cards and link previews; add the screens that
          show the work itself here.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {images.map((img, i) => (
            <li key={`${img.url}-${i}`} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
              <img src={img.url} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
              <span className="min-w-0 flex-1">
                <input
                  value={img.alt}
                  onChange={(e) => setAlt(i, e.target.value)}
                  placeholder="Describe this image for someone who cannot see it"
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[0.8rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none"
                />
                <span className="mt-0.5 block truncate font-mono text-[0.68rem] text-slate-500">{img.url}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
                  className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ArrowUp size={13} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move down"
                  className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ArrowDown size={13} /></button>
                <button type="button" onClick={() => remove(i)} aria-label="Remove"
                  className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-[#B91C1C] hover:bg-red-50"><Trash2 size={13} /></button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* One field for the whole list, so the count is not fixed by the markup. */}
      <input type="hidden" name={name} value={JSON.stringify(images)} />
    </div>
  );
}
