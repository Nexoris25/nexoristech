"use client";
/**
 * A button on the "Meet Oge" page that opens the live Oge assistant (or shows its fallback state)
 * through the global window.Oge API exposed by OgeWidget. If the widget has not mounted yet it does
 * nothing rather than erroring.
 */
import type { ReactNode } from "react";

export function OgeLaunchButton({
  action,
  className,
  children,
}: {
  action: "open" | "fallback";
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <button type="button" className={className} onClick={() => window.Oge?.[action]()}>
      {children}
    </button>
  );
}
