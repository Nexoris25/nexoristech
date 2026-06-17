/**
 * Layout primitives for the Nexoris Technologies platform.
 *
 * Container caps the content width and keeps fluid side padding so nothing overflows down to
 * 280px. Section applies the vertical rhythm (120px desktop, 64px mobile) that carries most of
 * the premium feel (PRD 14.3).
 */
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn.js";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Container({
  className,
  children,
  ...rest
}: ContainerProps): ReactNode {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1200px] px-4 md:px-8", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** The element to render. Defaults to a section landmark. */
  as?: ElementType;
  /** A tinted purple-100 background for alternating sections. */
  tinted?: boolean;
  /** A dark ink-950 background, for the hero and closing bands. */
  dark?: boolean;
  children: ReactNode;
}

export function Section({
  as,
  tinted = false,
  dark = false,
  className,
  children,
  ...rest
}: SectionProps): ReactNode {
  const Tag = as ?? "section";
  return (
    <Tag
      className={cn(
        "py-16 md:py-30",
        tinted && "bg-purple-100",
        dark && "bg-ink-950 text-white",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
