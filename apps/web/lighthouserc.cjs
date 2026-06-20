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
      numberOfRuns: 1,
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
