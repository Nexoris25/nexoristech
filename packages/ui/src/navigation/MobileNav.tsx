"use client";
/**
 * Mobile navigation drawer for the Nexoris Technologies header (PRD 7.6).
 *
 * A hamburger opens a full-screen drawer, a real modal dialog with a focus trap, Escape to
 * close, and the body scroll locked while open. The caller supplies the navigation content
 * (accordions for Services, Industries, and Company) and a sticky footer that holds the Start a
 * project and WhatsApp actions.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap.js";

export interface MobileNavProps {
  /** The navigation content, normally a set of AccordionItem sections. */
  children: ReactNode;
  /** The sticky bottom bar content (Start a project and WhatsApp). */
  footer?: ReactNode;
  /** Accessible label for the hamburger trigger. */
  triggerLabel?: string;
}

export function MobileNav({
  children,
  footer,
  triggerLabel = "Open menu",
}: MobileNavProps): ReactNode {
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(dialogRef, open, close);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={triggerLabel}
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-card text-ink-950"
      >
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </button>
      {open ? (
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[100] flex flex-col bg-white"
        >
          <div className="flex items-center justify-end p-4">
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-card text-ink-950"
            >
              <svg
                aria-hidden="true"
                width="24"
                height="24"
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
          <nav aria-label="Primary" className="flex-1 overflow-y-auto px-4">
            {children}
          </nav>
          {footer ? (
            <div className="sticky bottom-0 border-t border-purple-200 bg-white p-4">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
