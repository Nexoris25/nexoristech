"use client";
/**
 * Mark the reader's current section in a server-rendered contents list, and keep it in view.
 *
 * The sticky contents column is plain markup produced on the server, which is right: it costs nothing,
 * it is in the HTML for a crawler, and it works with JavaScript off. What it could not do is say where
 * the reader is, so on a long article the one navigation aid on screen never moved while the article
 * scrolled past it.
 *
 * This adds only the part that needs a browser. It renders nothing, finds the list by its `data-toc`
 * marker, and toggles a class on the matching link. If the list is taller than its own box it also
 * scrolls the current entry into view, which is the difference between a highlight you can see and one
 * that has been marked somewhere below the fold of the column.
 */
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useActiveHeading } from "../lib/use-active-heading.js";

export function TocSpy({ ids }: { ids: readonly string[] }): ReactNode {
  const active = useActiveHeading(ids);

  useEffect(() => {
    const lists = document.querySelectorAll<HTMLElement>("[data-toc]");
    for (const list of lists) {
      for (const link of list.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
        const on = decodeURIComponent(link.getAttribute("href") ?? "").slice(1) === active;
        link.classList.toggle("on", on);
        // aria-current is what tells a screen reader which entry is the reader's place; the class is
        // only paint. "location" is the value for a position within a page.
        if (on) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
        // Only when the column actually scrolls. Calling this on a list that fits would scroll the
        // page itself on some browsers, dragging the reader away from what they were reading.
        if (on && list.scrollHeight > list.clientHeight + 4) {
          link.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }, [active]);

  return null;
}
