/**
 * Accessibility primitives for the Nexoris Technologies platform (PRD 15).
 *
 * SkipLink is the first element in the DOM and moves focus straight to the main content.
 * VisuallyHidden hides text from sight while keeping it available to assistive technology, used
 * for accessible names such as the Oge screen-reader label.
 */
import type { ReactNode } from "react";

export interface SkipLinkProps {
  /** The id of the main content region. Defaults to "main-content". */
  targetId?: string;
  children?: ReactNode;
}

export function SkipLink({
  targetId = "main-content",
  children,
}: SkipLinkProps): ReactNode {
  return (
    <a href={`#${targetId}`} className="skip-link">
      {children ?? "Skip to content"}
    </a>
  );
}

export interface VisuallyHiddenProps {
  children: ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps): ReactNode {
  return (
    <span
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
      }}
    >
      {children}
    </span>
  );
}
