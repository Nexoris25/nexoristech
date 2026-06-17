/**
 * The four data states for the Nexoris Technologies platform (PRD quality bar, build prompt 5).
 *
 * Every data surface handles loading, empty, error, and populated. DataState wraps a surface
 * and renders the right state, using the exact empty-state copy a page provides. Colour never
 * carries meaning alone: each state pairs an icon or label with text, and the error state offers
 * a retry. The loading state announces itself politely to assistive technology.
 */
import type { ReactNode } from "react";
import { Button } from "../primitives/Button.js";
import { cn } from "../utils/cn.js";

export type DataStatus = "loading" | "empty" | "error" | "populated";

/** A simple shimmer block used while content loads. */
export function Skeleton({ className }: { className?: string }): ReactNode {
  return (
    <div
      className={cn("animate-pulse rounded-card bg-purple-100", className)}
      aria-hidden="true"
    />
  );
}

export interface EmptyStateProps {
  /** The heading for the empty state. */
  title: string;
  /** A plain-language explanation, using the approved empty-state copy where one exists. */
  message?: string;
  /** An optional action, for example a link to start a project. */
  action?: ReactNode;
}

export function EmptyState({
  title,
  message,
  action,
}: EmptyStateProps): ReactNode {
  return (
    <div className="rounded-card border border-purple-200 bg-white p-8 text-center">
      <p className="font-jakarta text-subhead font-600 text-ink-950">{title}</p>
      {message ? (
        <p className="mt-2 text-body text-neutral-600">{message}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export interface ErrorStateProps {
  /** A plain-language message. No error codes or technical language reach the visitor. */
  message?: string;
  /** Called when the visitor chooses to try again. */
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps): ReactNode {
  return (
    <div
      role="alert"
      className="rounded-card border border-purple-200 bg-white p-8 text-center"
    >
      <p className="font-jakarta text-subhead font-600 text-ink-950">
        Something went wrong on our side.
      </p>
      <p className="mt-2 text-body text-neutral-600">
        {message ??
          "Please try again in a moment, or reach the team if it keeps happening."}
      </p>
      {onRetry ? (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export interface DataStateProps {
  status: DataStatus;
  /** The populated content, rendered only when status is "populated". */
  children: ReactNode;
  /** A custom loading view. Defaults to a skeleton. */
  loading?: ReactNode;
  /** The empty-state props, using the approved copy. */
  empty: EmptyStateProps;
  /** The error-state props. */
  error?: ErrorStateProps;
}

export function DataState({
  status,
  children,
  loading,
  empty,
  error,
}: DataStateProps): ReactNode {
  if (status === "loading") {
    return (
      <div aria-busy="true" aria-live="polite">
        {loading ?? <Skeleton className="h-40 w-full" />}
      </div>
    );
  }
  if (status === "error") {
    return <ErrorState {...error} />;
  }
  if (status === "empty") {
    return <EmptyState {...empty} />;
  }
  return <>{children}</>;
}
