"use client";
/**
 * The error boundary in the house voice (PRD Stage 10): plain language, no error codes or
 * technical detail reach the visitor, with a way to try again and a way to reach the team.
 */
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Button, Container } from "@nexoris/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  useEffect(() => {
    // The logger replaces console in committed code; surface the error for diagnostics only.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center pb-16 pt-28 md:pt-40">
      <h1 className="max-w-[24ch] font-jakarta text-hero font-700 text-ink-950">
        Something went wrong on our side.
      </h1>
      <p className="mt-4 max-w-[60ch] text-body text-neutral-600">
        Please try again in a moment. If it keeps happening, tell us and we will
        look into it.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button href="/contact" variant="secondary" size="lg">
          Reach the team
        </Button>
      </div>
    </Container>
  );
}
