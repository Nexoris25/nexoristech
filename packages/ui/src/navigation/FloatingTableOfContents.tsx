"use client";
/**
 * Mobile floating table of contents for the Nexoris Technologies platform (PRD 13).
 *
 * On mobile widths only, Insights articles and legal pages get this navigation aid. A small
 * floating button sits bottom-left, never overlapping Oge bottom-right, labelled "Jump to a
 * section". It opens a drawer listing every section using its short title. Tapping an item scrolls
 * to that section and closes the drawer; the current section is highlighted as the visitor scrolls.
 * It is a real disclosure widget: focus is trapped while open, Escape closes it and returns focus
 * to the button, and it honours prefers-reduced-motion with an instant jump.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../utils/cn.js";
import { useFocusTrap } from "../hooks/useFocusTrap.js";

export interface TocSection {
  /** The id of the section heading the item scrolls to. */
  id: string;
  /** The short title shown in the list. */
  title: string;
}

export interface FloatingTableOfContentsProps {
  sections: TocSection[];
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function FloatingTableOfContents({
  sections,
}: FloatingTableOfContentsProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(dialogRef, open, close);

  // Highlight the current section as the visitor scrolls.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || sections.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) {
        observer.observe(el);
      }
    }
    return () => observer.disconnect();
  }, [sections]);

  const goTo = (id: string): void => {
    const el = document.getElementById(id);
    el?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    setActiveId(id);
    setOpen(false);
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-card bg-purple-600 px-4 py-2 text-label font-600 text-white shadow-prominent"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
          <path
            d="M3 4h12M3 9h12M3 14h8"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
          />
        </svg>
        Jump to a section
      </button>
      {open ? (
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label="Jump to a section"
          className="fixed inset-x-0 bottom-0 z-[100] max-h-[80vh] overflow-y-auto rounded-t-card border-t border-purple-200 bg-white p-4 shadow-prominent"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-subhead font-600 text-ink-950">Sections</p>
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-card text-ink-950"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </button>
          </div>
          <ul className="flex flex-col">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  aria-current={activeId === section.id ? "true" : undefined}
                  onClick={() => goTo(section.id)}
                  className={cn(
                    "block min-h-[44px] w-full cursor-pointer rounded-card px-3 py-2 text-left text-body",
                    activeId === section.id
                      ? "bg-purple-100 font-600 text-purple-700"
                      : "text-ink-950 hover:bg-purple-100",
                  )}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
