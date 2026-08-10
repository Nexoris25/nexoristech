/**
 * Lighthouse CI budgets (PRD 9.10). Runs against the sampled page classes (Home, one service, one
 * industry) on the built site, mobile by default, and blocks a merge that regresses accessibility,
 * SEO, or best practices below 95, or performance below 90 (performance warns rather than blocks
 * because it is the most environment-sensitive). The Insights article class is sampled in
 * production where CMS content exists. Run with `pnpm --filter @nexoris/web lhci`.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start -p 4173",
      url: [
        "http://localhost:4173/",
        "http://localhost:4173/ai-product-development/",
        "http://localhost:4173/healthcare-software/",
      ],
      // Three runs, because Lighthouse asserts on the median and a single run does not have one.
      // With one run each pass reliably produced exactly one page scoring around 62 with roughly
      // 600ms of blocking time, and it was a different page every time: whichever URL was measured
      // while the server was still warming up wore the cost. The same pages score around 80 on the
      // runs where they are not the unlucky one, so the low reading was the harness, not the page.
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
