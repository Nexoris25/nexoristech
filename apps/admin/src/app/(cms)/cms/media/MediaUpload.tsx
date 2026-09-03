"use client";
/**
 * Upload straight into the library.
 *
 * The only way to get a file in here was to start a new insight and use its cover field or its
 * editor, so building up a library ahead of writing meant creating drafts to throw away. The
 * library is where files live; it should be where they arrive.
 *
 * Several at once, because that is how images actually turn up — a folder of screenshots, a set of
 * charts from one report. They upload one after another rather than all at once: each is converted
 * with sharp and then described by a model, and firing twenty of those in parallel is how a queue
 * times out. One at a time is slower to finish and far more likely to finish.
 *
 * Each file's own result is reported. A batch that half worked and said nothing is worse than a
 * batch that failed, because the missing half is discovered later by someone looking for a picture
 * they believe they uploaded.
 */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Upload, Check, TriangleAlert, Loader2 } from "lucide-react";

interface Result { name: string; ok: boolean; detail?: string }

export function MediaUpload({ folders }: { folders: string[] }): ReactNode {
  const input = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState(folders[0] ?? "Uploads");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<Result[]>([]);

  const upload = async (files: FileList): Promise<void> => {
    setBusy(true);
    setResults([]);
    setDone(0);
    setTotal(files.length);
    const out: Result[] = [];

    for (const file of Array.from(files)) {
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);
        const res = await fetch("/api/cms/upload", { method: "POST", body });
        if (res.ok) {
          out.push({ name: file.name, ok: true });
        } else {
          const problem = (await res.json().catch(() => null)) as { error?: string } | null;
          out.push({ name: file.name, ok: false, ...(problem?.error ? { detail: problem.error } : {}) });
        }
      } catch {
        out.push({ name: file.name, ok: false, detail: "could not reach the server" });
      }
      setDone((n) => n + 1);
      setResults([...out]);
    }

    setBusy(false);
    if (input.current) input.current.value = "";
    // The grid is server-rendered, so the page has to come back for the new files to appear. Only
    // when something actually landed: a page that reloads after a total failure loses the reasons.
    if (out.some((r) => r.ok)) window.location.assign("/cms/media?uploaded=" + out.filter((r) => r.ok).length);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
      <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900">
        <Upload size={16} className="text-[#543CDA]" /> Upload files
      </h2>
      <p className="mt-1 text-[0.8rem] text-slate-500">
        Straight into the library, without starting an article. Pick several at once if you have
        them. Each is converted to WebP, resized, and given draft alt text you can edit here.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.75rem] font-600 text-slate-600">Folder</span>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem]"
          >
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <input
          ref={input}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
          disabled={busy}
          onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); }}
          className="block text-[0.83rem] text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#543CDA] file:px-4 file:py-2 file:text-[0.83rem] file:font-600 file:text-white hover:file:bg-[#4330B8] disabled:opacity-60"
        />

        {busy ? (
          <span className="inline-flex items-center gap-2 text-[0.83rem] font-600 text-slate-600">
            <Loader2 size={15} className="animate-spin" /> Uploading {done + 1} of {total}
          </span>
        ) : null}
      </div>

      {results.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1.5">
          {results.map((r) => (
            <li key={r.name} className="flex items-start gap-2 text-[0.8rem]">
              {r.ok ? (
                <Check size={14} className="mt-0.5 shrink-0 text-green-600" />
              ) : (
                <TriangleAlert size={14} className="mt-0.5 shrink-0 text-[#B45309]" />
              )}
              <span className={r.ok ? "text-slate-600" : "text-[#B45309]"}>
                {r.name}
                {r.detail ? ` — ${r.detail}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
