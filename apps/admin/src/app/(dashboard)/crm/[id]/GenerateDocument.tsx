"use client";
/**
 * Generate a branded PDF document for a lead (PRD Part Three, 5). The salesperson picks the kind,
 * writes the content, and optionally adds priced line items; the server renders a selectable PDF
 * and the browser downloads it. The salesperson supplies all figures and terms.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@nexoris/ui";
import { DOC_KINDS, type DocKind, type LineItem } from "../../../../lib/pdf/types.js";

export function GenerateDocument({
  defaultName,
  defaultCompany,
}: {
  defaultName?: string;
  defaultCompany?: string;
}): ReactNode {
  const [kind, setKind] = useState<DocKind>("Proposal");
  const [title, setTitle] = useState(
    `Proposal for ${defaultCompany || defaultName || "your project"}`,
  );
  const [intro, setIntro] = useState("");
  const [scope, setScope] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setItem = (i: number, patch: Partial<LineItem>): void =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  async function generate(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const data = {
        kind,
        title,
        date: new Date().toLocaleDateString("en-NG"),
        ...(defaultName ? { recipientName: defaultName } : {}),
        ...(defaultCompany ? { recipientCompany: defaultCompany } : {}),
        ...(intro ? { intro } : {}),
        sections: scope ? [{ heading: "Scope", body: scope }] : [],
        ...(terms ? { terms } : {}),
        lineItems: items.filter((i) => i.description.trim()),
      };
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setError("Could not generate the document. Check the fields and retry.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not generate the document. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = "rounded-card border border-neutral-300 p-2 text-label";

  return (
    <div className="flex flex-col gap-3">
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as DocKind)}
        className={`cursor-pointer ${field}`}
        aria-label="Document kind"
      >
        {DOC_KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={field}
        aria-label="Title"
      />
      <textarea
        value={intro}
        onChange={(e) => setIntro(e.target.value)}
        placeholder="Opening paragraph (optional)"
        rows={2}
        className={field}
        aria-label="Intro"
      />
      <textarea
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        placeholder="Scope or details"
        rows={4}
        className={field}
        aria-label="Scope"
      />

      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item.description}
              onChange={(e) => setItem(i, { description: e.target.value })}
              placeholder="Line item"
              className={`flex-1 ${field}`}
              aria-label="Line item description"
            />
            <input
              type="number"
              min="0"
              value={item.amount || ""}
              onChange={(e) =>
                setItem(i, { amount: Number.parseFloat(e.target.value) || 0 })
              }
              placeholder="NGN"
              className={`w-32 ${field}`}
              aria-label="Line item amount"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((p) => [...p, { description: "", amount: 0 }])}
          className="cursor-pointer self-start text-label text-purple-700 underline hover:text-purple-600"
        >
          Add a line item
        </button>
      </div>

      <textarea
        value={terms}
        onChange={(e) => setTerms(e.target.value)}
        placeholder="Terms (optional)"
        rows={2}
        className={field}
        aria-label="Terms"
      />

      {error ? (
        <p className="text-label text-purple-700" role="alert">
          {error}
        </p>
      ) : null}

      <Button onClick={generate} disabled={busy || !title.trim()}>
        {busy ? "Generating" : "Generate PDF"}
      </Button>
    </div>
  );
}
