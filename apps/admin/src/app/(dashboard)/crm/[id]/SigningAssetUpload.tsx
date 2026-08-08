"use client";
/**
 * Upload a stamp or a signature for this document.
 *
 * Deliberately per-document rather than a fixed file on the server. A stamp carries a date, so the
 * right image changes from one document to the next and pinning one in the repo would put a stale date
 * on everything. The upload is cleaned server-side — background knocked out, trimmed to the ink — and
 * the preview here is the cleaned result, so what is shown is exactly what lands on the page.
 */
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

export interface SigningAsset { dataUrl: string; width: number; height: number }

export function SigningAssetUpload({
  label, hint, value, onChange,
}: {
  label: string;
  hint: string;
  value: SigningAsset | null;
  onChange: (asset: SigningAsset | null) => void;
}): ReactNode {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cleared, setCleared] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const upload = async (file: File): Promise<void> => {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/documents/signing-asset", { method: "POST", body });
      const json = (await res.json()) as { dataUrl?: string; width?: number; height?: number; clearedPercent?: number; error?: string };
      if (!res.ok || !json.dataUrl) {
        setError(json.error ?? "That image could not be prepared.");
        return;
      }
      setCleared(json.clearedPercent ?? null);
      onChange({ dataUrl: json.dataUrl, width: json.width ?? 0, height: json.height ?? 0 });
    } catch {
      setError("That image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <p className="text-[0.84rem] font-600 text-ink-950">{label}</p>
      <p className="mt-0.5 text-[0.75rem] text-neutral-600">{hint}</p>

      {value ? (
        <div className="mt-2.5 flex items-center gap-3">
          {/* Checkerboard behind the preview, so a background that was not removed is obvious. */}
          <span
            className="grid h-16 w-28 shrink-0 place-items-center rounded border border-neutral-200"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#EEE 25%,transparent 25%),linear-gradient(-45deg,#EEE 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#EEE 75%),linear-gradient(-45deg,transparent 75%,#EEE 75%)",
              backgroundSize: "10px 10px",
              backgroundPosition: "0 0,0 5px,5px -5px,-5px 0",
            }}
          >
            {/* A data URL preview; next/image cannot take one. */}
            <img src={value.dataUrl} alt={label} className="max-h-14 max-w-24 object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.76rem] text-neutral-600">
              {value.width} × {value.height}px
              {cleared !== null ? ` · ${cleared}% of the background removed` : ""}
            </p>
            <button
              type="button"
              onClick={() => { onChange(null); setCleared(null); if (input.current) input.current.value = ""; }}
              className="mt-1 inline-flex cursor-pointer items-center gap-1 text-[0.78rem] font-600 text-purple-700 hover:text-purple-900"
            >
              <X size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-[0.82rem] font-600 text-ink-950 hover:bg-neutral-50 disabled:opacity-60"
        >
          {busy ? <><Loader2 size={14} className="animate-spin" /> Preparing…</> : <><Upload size={14} /> Upload image</>}
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
      />
      {error ? <p className="mt-2 text-[0.78rem] text-[#C0362C]" role="alert">{error}</p> : null}
    </div>
  );
}
