"use client";
/**
 * Reusable image upload for the CMS. Pick or drop an image; it uploads to /api/cms/upload, which converts
 * it to WebP on the server, stores it, and returns the URL plus auto-generated alt text. The preview and
 * an editable alt-text field appear; the alt text can be overridden. The URL and alt text submit with the
 * form via hidden/native fields. Used for Featured Image, Author Headshot, Cover Image, etc.
 */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { UploadCloud, X, Sparkles, Loader2, ImageIcon } from "lucide-react";

interface Props {
  name: string;            // hidden field carrying the image URL
  altName: string;         // field carrying the alt text
  label?: string;
  folder?: string;
  initialUrl?: string;
  initialAlt?: string;
  aspect?: string;         // e.g. "aspect-[16/9]" or "aspect-square"
  onChange?: (url: string, alt: string) => void;
}

export function ImageUpload({ name, altName, label = "Image", folder = "Uploads", initialUrl = "", initialAlt = "", aspect = "aspect-[16/9]", onChange }: Props): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [alt, setAlt] = useState(initialAlt);
  const [altSource, setAltSource] = useState<"oge" | "fallback" | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File): Promise<void> => {
    setBusy(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", folder);
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error((j as { error?: string }).error ?? "Upload failed"); }
      const j = (await res.json()) as { url: string; altText: string; source?: string };
      setUrl(j.url); setAlt(j.altText); setAltSource((j.source as "oge" | "fallback") ?? ""); onChange?.(j.url, j.altText);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); }
  };

  const onFile = (files: FileList | null): void => { const f = files?.[0]; if (f) void upload(f); };

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={url} />
      {label ? <span className="text-[0.8rem] font-600 text-slate-700">{label}</span> : null}

      {url ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className={`relative w-full ${aspect} bg-slate-50`}>
            <img src={url} alt={alt} className="h-full w-full object-cover" />
            <button type="button" onClick={() => { setUrl(""); setAlt(""); setAltSource(""); onChange?.("", ""); }} aria-label="Remove image"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-slate-600 shadow hover:bg-white hover:text-[#EF4444]"><X size={15} /></button>
          </div>
          <div className="border-t border-slate-100 p-3">
            <span className="flex items-center justify-between">
              <span className="text-[0.75rem] font-600 text-slate-600">Alt text</span>
              {altSource ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.66rem] font-600 ${altSource === "oge" ? "bg-[#EEEBFC] text-[#543CDA]" : "bg-slate-100 text-slate-600"}`}><Sparkles size={10} /> {altSource === "oge" ? "Oge draft" : "Auto"}</span> : null}
            </span>
            <input name={altName} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={125} placeholder="Describe the image for accessibility and image SEO"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[0.82rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
            <span className="mt-1 block text-[0.7rem] text-slate-500">Auto-generated. Edit it to match exactly what the image shows.</span>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name={altName} value="" />
          <button type="button" onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files); }}
            className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-[#543CDA] bg-[#F4F1FD]" : "border-slate-200 bg-slate-50 hover:border-[#543CDA]/50 hover:bg-slate-50"}`}>
            {busy ? <><Loader2 size={22} className="animate-spin text-[#543CDA]" /><span className="text-[0.82rem] font-600 text-slate-600">Uploading and converting to WebP...</span></>
              : <><span className="grid h-10 w-10 place-items-center rounded-full bg-[#EEEBFC] text-[#543CDA]"><UploadCloud size={20} /></span>
                <span className="text-[0.84rem] font-600 text-slate-700">Drag an image here, or click to upload</span>
                <span className="text-[0.72rem] text-slate-500">JPG, PNG, or WebP. Converted to WebP automatically.</span></>}
          </button>
        </>
      )}

      {error ? <span className="flex items-center gap-1 text-[0.76rem] font-600 text-[#DC2626]"><ImageIcon size={12} /> {error}</span> : null}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files)} />
    </div>
  );
}
