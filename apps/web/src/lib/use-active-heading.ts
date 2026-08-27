"use client";
/**
 * Which heading the reader is currently on.
 *
 * Shared by the floating contents sheet and the sticky contents column, because they answer the same
 * question and had no business answering it differently: the sheet tracked the reader and the desktop
 * column, which is the one on screen the whole time, was inert markup that never said where you were.
 *
 * The observation band sits near the top of the viewport, so a heading becomes current once it reaches
 * the line a reader actually reads from, not when it first peeks in at the bottom.
 *
 * Two cases the naive version gets wrong, both handled here:
 *   * Nothing intersecting. Between two widely spaced headings, or in a long section, the band can be
 *     empty and the highlight would blink off. The last heading passed stays current instead.
 *   * The end of the page. The final heading may never reach the band, because there is not enough
 *     page left to scroll it there, so scrolling to the bottom is treated as being on the last entry.
 */
import { useEffect, useState } from "react";

export function useActiveHeading(ids: readonly string[]): string {
  const [active, setActive] = useState<string>("");
  const key = ids.join("|");

  useEffect(() => {
    const list = key.length > 0 ? key.split("|") : [];
    if (list.length === 0) return;
    const targets = list
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // The topmost heading that has passed the reading line. Derived from positions rather than from
    // the observer's own records, so an empty band keeps the previous answer instead of clearing it.
    const pick = (): void => {
      const line = 96;
      let current = targets[0] as HTMLElement;
      for (const t of targets) {
        if (t.getBoundingClientRect().top <= line) current = t;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      setActive(atBottom ? (targets[targets.length - 1] as HTMLElement).id : current.id);
    };

    // The observer is the trigger, not the source of truth: it wakes only when a heading crosses the
    // band, which is far cheaper than a scroll listener, and pick() then reads the real positions.
    const observer = new IntersectionObserver(() => onScroll(), {
      rootMargin: "-88px 0px -70% 0px",
      threshold: 0,
    });
    targets.forEach((t) => observer.observe(t));

    // One measurement per frame. pick() reads layout, and reading layout on every scroll event is how
    // a contents list turns into jank on the long articles it exists for.
    let frame = 0;
    const onScroll = (): void => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        pick();
      });
    };
    // A reader can also reach the bottom without crossing any heading, and can land mid-page on a
    // reload or a #anchor, neither of which the observer reports on its own.
    window.addEventListener("scroll", onScroll, { passive: true });
    pick();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [key]);

  return active;
}
