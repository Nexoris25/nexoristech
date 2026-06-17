"use client";
/**
 * Accordion disclosure for the mobile navigation drawer (PRD 7.6).
 *
 * Each section is a real disclosure: the header button carries aria-expanded and
 * aria-controls, and the panel is shown or hidden accordingly. Used to group Services,
 * Industries, and Company inside the mobile drawer.
 */
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../utils/cn.js";

export interface AccordionItemProps {
  title: string;
  children: ReactNode;
  /** Whether the section starts open. */
  defaultOpen?: boolean;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps): ReactNode {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className="border-b border-purple-200">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[44px] w-full cursor-pointer items-center justify-between py-3 text-left text-subhead font-600 text-ink-950"
      >
        {title}
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={cn("transition-transform", open && "rotate-180")}
        >
          <path
            d="M3 6l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      <div id={panelId} hidden={!open} className="pb-3">
        {children}
      </div>
    </div>
  );
}
