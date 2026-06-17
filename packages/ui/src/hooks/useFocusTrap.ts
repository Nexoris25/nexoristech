"use client";
/**
 * Focus trap for modal surfaces (the mobile navigation drawer and the floating table of
 * contents). While active, Tab and Shift+Tab cycle within the container, focus moves to the
 * first focusable element on open, Escape calls the supplied handler, and focus returns to the
 * element that was focused before opening when it deactivates (PRD 13, 15).
 */
import { useEffect } from "react";
import type { RefObject } from "react";
import { focusableElements } from "./focusable.js";

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const container = ref.current;
    if (!container) {
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = (): void => {
      const focusables = focusableElements(container);
      (focusables[0] ?? container).focus();
    };
    // Defer to the next frame so the container has rendered its content.
    const raf = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusables = focusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0] as HTMLElement;
      const last = focusables[focusables.length - 1] as HTMLElement;
      const activeEl = document.activeElement;
      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [ref, active, onEscape]);
}
