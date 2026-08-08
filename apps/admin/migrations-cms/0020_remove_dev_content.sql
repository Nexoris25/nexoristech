-- Removes the content created to exercise the build, leaving only what is real.
--
-- The live site is what produces the Search Console and Analytics figures this platform reads, and its
-- content is not in this database. Everything below was written by seed scripts and generators during
-- development, and keeping it makes every count on every screen a fiction.
--
-- Kept deliberately:
--   * the five legal_page rows — the website reads its privacy, terms and cookie pages from them. Their
--     bodies are empty, which is a content gap to fill, not a row to delete.
--   * the one insight draft with real prose in it.
--   * the six categories, which are a plausible real taxonomy.
--   * the one media row that points at a file actually on disk.
--
-- Reverting means restoring from a backup.

BEGIN;

-- Every programmatic page. They were generated from proposals whose search volumes were invented, none
-- was ever published, and 2,459 of the 2,460 had no body at all.
DELETE FROM cms_content WHERE kind = 'generated_page';

-- The five published insights, all with a completely empty body. They existed to fill the insights list.
DELETE FROM cms_content
 WHERE kind = 'insight'
   AND status = 'published'
   AND coalesce(body, '') = '';

-- The legal pages that survive still carry a byline pointing at a generated author, and a foreign key
-- will not let those authors go while anything references them. Clearing the reference is also the right
-- outcome on its own: a policy attributed to someone who does not work here is worse than an unsigned one.
UPDATE cms_content SET author_id = NULL, fact_checker_id = NULL
 WHERE author_id IS NOT NULL OR fact_checker_id IS NOT NULL;

-- Every author profile. All eighteen were generated, including "John Doe" and "Ada Admin", and each was
-- public with a bio attributed to a person who does not work here. They were only kept last time because
-- the programmatic pages depended on them; those are gone above, so these go now.
DELETE FROM cms_author;

-- The keyword proposals. Their search volumes (9,900 for "Telehealth Software") were invented: the whole
-- property drew 3,771 impressions in the last week. Real proposals are derived from Search Console.
DELETE FROM cms_proposal;

-- The redirect table was seeded with rules for pages that never existed — /old-pricing, /legacy-page,
-- /resources/ebooks — including one row pointing /case-studies/covyvo-erp at itself, an infinite loop
-- that would have been served to any visitor and any crawler.
DELETE FROM cms_redirect;

COMMIT;
