"use client";
/**
 * Back to top.
 *
 * Where it sits took more deciding than what it does. The bottom-right corner is a stack already —
 * the Oge launcher at 20px and WhatsApp above it — and adding a third would push the newest control
 * to eye level for the least important job on the page. So it sits bottom-left, which is empty on
 * desktop, and steps above the contents launcher on the screens where that appears.
 *
 * It shows only once scrolling it would actually save something. A button offering to return you to
 * a top you can already see is furniture, so nothing renders until the page has moved roughly two
 * screens, which is also the point at which the header has long gone.
 *
 * Scrolling is smooth unless the reader has asked for reduced motion, in which case it jumps: a
 * long smooth scroll is exactly the kind of movement that setting exists to stop.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import "../styles/scroll-top.css";

/** Two screens down: far enough that the top is genuinely out of reach. */
const SHOW_AFTER = 2;

export function ScrollToTop(): ReactNode {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setShown(window.scrollY > window.innerHeight * SHOW_AFTER);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = (): void => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    // Focus goes back to the document so the next Tab starts from the top of the page rather than
    // from a control that is now off screen.
    document.body.focus({ preventScroll: true });
  };

  if (!shown) return null;

  return (
    <button type="button" className="to-top" onClick={toTop} aria-label="Back to top">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      <span className="to-top-text">Top</span>
    </button>
  );
}
