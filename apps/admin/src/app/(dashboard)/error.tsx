"use client";
/**
 * The error boundary for this route group. Without one, a thrown error — most often the database
 * being unreachable — reached the user as a Next.js runtime stack trace.
 */
import type { ReactNode } from "react";
import { FailureScreen } from "../../components/FailureScreen.js";

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return <FailureScreen error={error} reset={reset} />;
}
