-- Readable names for the category filter tabs.
--
-- 0025 seeded these by taking the head of the full name, which is a reasonable default and a poor
-- label in three of five cases: "Search, Content & Digital Visibility" became "Search", which reads
-- as a site search rather than a subject, and "Technology Insights & Guides" became "Technology
-- Insights", which is long and says the same thing as the page it sits on.
--
-- A tab has one job: tell a reader what they will get if they press it, in the space of a glance.
-- These are set explicitly rather than derived, because no rule turns those names into these ones.
-- They stay editable in the CMS.
UPDATE cms_category SET short_name = 'AI'              WHERE slug = 'ai-intelligent-business';
UPDATE cms_category SET short_name = 'Software'        WHERE slug = 'software-digital-products';
UPDATE cms_category SET short_name = 'Search & SEO'    WHERE slug = 'search-content-digital-visibility';
UPDATE cms_category SET short_name = 'Transformation'  WHERE slug = 'digital-transformation';
UPDATE cms_category SET short_name = 'Guides'          WHERE slug = 'technology-insights-guides';
