"use client";
/**
 * The on-page contents, as a floating control on small screens.
 *
 * On desktop the contents sit in a sticky column beside the article. Below 1024px that column was set
 * to `display: none`, so on a phone — where a long article is hardest to navigate and most of the
 * traffic is — there was no contents list at all. The legal pages did the opposite and stacked the full
 * list above the copy, pushing the policy itself below the fold.
 *
 * This is the shared answer: a launcher pinned to the corner that opens the contents as a sheet. It
 * follows the same shape as the Oge launcher and sits on the opposite side so the two never overlap.
 *
 * Behaviour worth stating:
 *   * It renders only when there is something to list, and only on small screens (CSS decides, so there
 *     is no flash of a mobile control on desktop).
 *   * The current section is tracked while scrolling and marked, so the sheet opens on where you are
 *     rather than at the top.
 *   * Choosing an entry closes the sheet, because leaving it covering the section you just asked for
 *     is the one thing it must not do.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useActiveHeading } from "../lib/use-active-heading.js";
import "../styles/floating-toc.css";
import { tocLabel } from "../lib/render-html.js";

export interface TocEntry { id: string; text: string }

export function FloatingToc({ entries, label = "On this page" }: { entries: TocEntry[]; label?: string }): ReactNode {
  const [open, setOpen] = useState(false);
  // Shared with the sticky desktop column, so the sheet and the column can never disagree about
  // where the reader is.
  const active = useActiveHeading(entries.map((e) => e.id));

  // A sheet covering the page should not leave the page scrolling behind it, and Escape should close it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (entries.length === 0) return null;

  return (
    <div className="toc-float">
      <button
        type="button"
        className="toc-fab"
        aria-expanded={open}
        aria-controls="floating-toc-sheet"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
        <span>Contents</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="toc-scrim"
            aria-label="Close contents"
            onClick={() => setOpen(false)}
          />
          <nav id="floating-toc-sheet" className="toc-sheet" aria-label={label}>
            <div className="toc-sheet-head">
              <h2>{label}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close contents">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <ol>
              {entries.map((e) => (
                <li key={e.id}>
                  <a
                    href={`#${e.id}`}
                    aria-current={active === e.id ? "location" : undefined}
                    className={active === e.id ? "on" : ""}
                    onClick={() => setOpen(false)}
                    title={e.text}
                    aria-label={e.text}
                  >
                    {/* The short form, matching the sidebar. The sheet is the narrowest place the
                        contents appear, so it is the one that suffers most from a four-line entry. */}
                    {tocLabel(e.text)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </>
      ) : null}
    </div>
  );
}
