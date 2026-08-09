"use client";
/**
 * A small, accessible dropdown used across the shell and dashboards (dashboard switcher, date range,
 * user menu). Opens on trigger click, closes on outside click, Escape, or when a menu item inside is
 * clicked. Keyboard focus stays with the trigger.
 *
 * Where the trigger is an icon on its own — the create, notifications and account buttons in the top
 * bar — `buttonLabel` supplies the name it is announced and tooltipped by. Without it such a trigger
 * reads as an unlabelled "button" and gives a mouse user nothing on hover either.
 */
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function Dropdown({
  label,
  buttonLabel,
  align = "left",
  panelClassName = "",
  buttonClassName = "",
  children,
}: {
  label: ReactNode;
  /** Accessible name for the trigger. Required in practice whenever `label` carries no text. */
  buttonLabel?: string;
  align?: "left" | "right";
  panelClassName?: string;
  buttonClassName?: string;
  children: ReactNode;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        {...(buttonLabel ? { "aria-label": buttonLabel, title: buttonLabel } : {})}
        className={buttonClassName}
      >
        {label}
      </button>
      {open ? (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={`absolute z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_40px_rgba(15,23,42,0.12)] ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
