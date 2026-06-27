/**
 * The 404 page in the house voice (PRD Stage 10): plain, helpful, no jargon. Offers the
 * clearest next steps rather than a dead end. Extra top padding clears the fixed header, since
 * this page has no dark hero behind it.
 */
import type { ReactNode } from "react";
import { Button, Container } from "@nexoris/ui";

export default function NotFound(): ReactNode {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center pb-16 pt-28 md:pt-40">
      <p className="text-eyebrow uppercase text-purple-600">404</p>
      <h1 className="mt-2 max-w-[24ch] font-roboto text-hero font-700 text-ink-950">
        We could not find that page.
      </h1>
      <p className="mt-4 max-w-[60ch] text-body text-neutral-600">
        The page you were looking for has moved or never existed. Here are some
        good places to go next.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button href="/" size="lg">
          Go to the home page
        </Button>
        <Button href="/contact" variant="secondary" size="lg">
          Start a project
        </Button>
      </div>
    </Container>
  );
}
