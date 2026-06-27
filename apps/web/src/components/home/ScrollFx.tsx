"use client";
/**
 * Homepage scroll effects from the design handoff: a 2px scroll-progress bar and an
 * IntersectionObserver that adds .anim to .reveal elements as they enter the viewport. Both are
 * disabled under prefers-reduced-motion (the progress bar is hidden by CSS in that case too).
 */
import { useEffect } from "react";
import type { ReactNode } from "react";

export function ScrollFx(): ReactNode {
  useEffect(() => {
    const bar = document.getElementById("progress");
    const onScroll = (): void => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    let io: IntersectionObserver | undefined;
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("anim");
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
      );
      document.querySelectorAll(".reveal").forEach((el) => io?.observe(el));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  return <div className="progress" id="progress" />;
}
