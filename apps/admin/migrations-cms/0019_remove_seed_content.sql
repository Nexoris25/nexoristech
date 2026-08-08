-- Removes the seeded demo content, leaving only real work behind.
--
-- The platform is being prepared for real data, and this content was generated to fill screens during
-- the build: 150 insights all titled "Insight: N industry trends and analysis", 28 "Case study N", 67
-- testimonials sharing one identical body, 23 jobs slugged job-N, and 42 generated applications.
--
-- Each predicate is anchored to the exact output shape of the generator that produced it, and nothing
-- here matches kind='generated_page'. That matters: an earlier, looser rule ("title ends with (N)")
-- matched 2,458 of the 2,460 programmatic pages, which are the real pSEO corpus and must survive.
--
-- Deleted outright, without redirects, on the owner's instruction: these URLs were never public.
--
-- Reverting means restoring from a database backup. There is no undo in here.

BEGIN;

-- Break the link from articles to seeded authors before anything is removed, so a delete cannot fail
-- on a reference and leave the run half-applied.
DELETE FROM cms_content
 WHERE (kind = 'insight'     AND title ~ '^Insight: [0-9]+ industry trends and analysis$')
    OR (kind = 'case_study'  AND title ~ '^Case study [0-9]+$')
    OR (kind = 'testimonial' AND title ~ '^Testimonial from client [0-9]+$')
    OR (kind = 'testimonial' AND body LIKE '<p>Nexoris Technologies delivered an exceptional solution%')
    OR (kind = 'job'         AND slug ~ '^job-[0-9]+$')
    OR (kind = 'application');

-- The one testimonial the rules above left behind: a published quote crediting Nexoris Technologies
-- with rebuilding Paystack's checkout, attributed to a named person at a real, identifiable company.
-- It came from the same seed set, and the homepage carousel would have rendered it as a client
-- endorsement. An invented quote is bad; an invented quote naming a real business is worse, so it goes
-- with the rest. If it was ever a genuine client quote it can be re-entered with their approval.
DELETE FROM cms_content
 WHERE kind = 'testimonial'
   AND title = 'Chidi Okoro'
   AND company = 'Paystack NG';

-- 1,245 media rows named asset-N.pdf / asset-N.png with a NULL url: they refer to no file, and never
-- did. They were inflating "Total Assets" to 1,246 against two files actually on disk. The rows that
-- do point at an uploaded file are kept.
DELETE FROM cms_media WHERE url IS NULL;

-- Two years of invented daily traffic (2024-06-26 to 2026-07-25). This table exists as a mirror for
-- when Search Console is unreachable, and a mirror filled with fiction is worse than an empty one: the
-- dashboard cannot then tell "no data" from "these numbers". Search Console is connected and answering.
DELETE FROM cms_metric_daily;

-- Activity attributed to people who do not work here: "Sarah Editor", "David Legal", "HR Team".
-- The log fills itself from real actions from here on.
DELETE FROM cms_activity;

COMMIT;
