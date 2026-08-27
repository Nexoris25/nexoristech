"use client";
/**
 * Report one view of an article, once per browser session.
 *
 * The article page is statically generated, so there is no server render per reader to count from.
 * This runs in the browser after the page loads and tells the site once, guarded by sessionStorage
 * so a reader who scrolls back to the same piece is not counted again.
 *
 * Renders nothing, never blocks, and never surfaces a failure: a counter that breaks a page it is
 * counting would be worse than no counter.
 */
import { useEffect } from "react";
import type { ReactNode } from "react";

export function CountView({ slug }: { slug: string }): ReactNode {
  useEffect(() => {
    if (!slug) return;
    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode, or storage blocked. Counting once per load is better than not at all.
    }

    // keepalive so the count still lands if the reader leaves immediately.
    void fetch("/api/insights/view/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // Nothing to do and nothing to tell the reader.
    });
  }, [slug]);

  return null;
}
