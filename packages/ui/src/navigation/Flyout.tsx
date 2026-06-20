"use client";
/**
 * Flyout disclosure for the Nexoris Technologies header (PRD 7, 15).
 *
 * A real disclosure widget, never CSS-only: the trigger carries aria-expanded and
 * aria-controls, the panel is removed from the DOM when closed, Enter or Down Arrow opens it
 * and moves focus to the first item, Escape closes it and returns focus to the trigger, and a
 * click or focus outside closes it. Used for the Services and Industries mega menus and the
 * Company dropdown; the panel content is supplied by the caller.
 */
import { useCallback, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "../utils/cn.js";
import { useOnClickOutside } from "../hooks/useOnClickOutside.js";
import { focusableElements } from "../hooks/focusable.js";

export interface FlyoutProps {
  /** The trigger label, for example "Services". */
  label: string;
  /** The panel content. */
  children: ReactNode;
  /** Extra classes for the panel. */
  panelClassName?: string;
  /** Extra classes for the trigger. */
  triggerClassName?: string;
  /**
   * How the panel is anchored. "start" and "end" tuck a narrow dropdown under the left or right
   * edge of the trigger. "mega" centres a wide panel under the header so it never overflows the
   * viewport, however near the right edge its trigger sits.
   */
  align?: "start" | "end" | "mega";
}

export function Flyout({
  label,
  children,
  panelClassName,
  triggerClassName,
  align = "start",
}: FlyoutProps): ReactNode {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useOnClickOutside(containerRef, () => setOpen(false), open);

  const focusFirstItem = useCallback(() => {
    window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel) {
        focusableElements(panel)[0]?.focus();
      }
    });
  }, []);

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      focusFirstItem();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  };

  const onContainerKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={onContainerKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-card px-3 py-2 text-label font-600 text-ink-950 hover:text-purple-700",
          triggerClassName,
        )}
      >
        {label}
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={cn("transition-transform", open && "rotate-180")}
        >
          <path
            d="M2 4l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className={cn(
            "z-50 origin-top animate-[flyout_160ms_ease-out] rounded-2xl border border-purple-200 bg-white p-6 shadow-prominent",
            // Narrow dropdowns anchor to the trigger edge; wide mega panels centre under the
            // header and clamp to the viewport so they never spill off-screen.
            align === "mega"
              ? "fixed left-1/2 top-[68px] max-w-[calc(100vw-2rem)] -translate-x-1/2 md:top-[80px]"
              : "absolute top-full mt-2",
            align === "start" && "left-0",
            align === "end" && "right-0",
            panelClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
