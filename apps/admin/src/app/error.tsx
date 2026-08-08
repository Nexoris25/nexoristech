"use client";
/**
 * The root error boundary.
 *
 * This is the one that matters for the reported crash. A route group's own error.tsx catches errors
 * from its children, not from its layout — and the database call that fails happens in
 * (dashboard)/layout.tsx, whose nearest boundary is this one.
 */
import type { ReactNode } from "react";
import { FailureScreen } from "../components/FailureScreen.js";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return <FailureScreen error={error} reset={reset} />;
}
