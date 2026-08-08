-- Proof Library: give cms_content the fields the Case Studies, Testimonials, and Legal Pages designs
-- need. These are additive and shared across kinds; each screen uses the subset that applies to it.
-- Existing columns are reused where they fit: excerpt = short summary / project summary, body = project
-- overview / testimonial quote / legal content, featured_image = cover image, meta_* = SEO fields.

ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS display_order      integer NOT NULL DEFAULT 0;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS featured           boolean NOT NULL DEFAULT false;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS rating             smallint;              -- testimonials (1-5)
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS service_industry   text;                  -- case studies
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS company            text;                  -- testimonials
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS customer_title     text;                  -- testimonials (job title)
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS highlights         text[] NOT NULL DEFAULT '{}';   -- case studies
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS technologies       text[] NOT NULL DEFAULT '{}';   -- case studies
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS version            text;                  -- legal pages
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS effective_date     date;                  -- legal pages
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS visible_in_footer  boolean NOT NULL DEFAULT true;  -- legal pages
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS require_acceptance boolean NOT NULL DEFAULT false; -- legal pages

-- Seed Case Studies so the list matches the design (service/industry, summary, display order, highlights).
WITH cs AS (SELECT id, row_number() OVER (ORDER BY created_at) AS n FROM cms_content WHERE kind='case_study')
UPDATE cms_content c SET
  service_industry = (ARRAY['Fintech','Government','Agritech','Education','Healthcare','Retail'])[(cs.n % 6) + 1],
  excerpt = COALESCE(NULLIF(c.excerpt,''), 'A secure, scalable platform delivered for a modern business.'),
  display_order = cs.n,
  featured = (cs.n <= 3),
  highlights = ARRAY['Secure','Scalable','Compliant','Reliable'],
  technologies = ARRAY['Next.js','Node.js','PostgreSQL','AWS','Redis']
FROM cs WHERE c.id = cs.id;

-- Seed Testimonials (customer name lives in title, company, rating, featured, quote in body).
WITH t AS (SELECT id, row_number() OVER (ORDER BY created_at) AS n FROM cms_content WHERE kind='testimonial')
UPDATE cms_content c SET
  company = (ARRAY['PayDay Africa','Grays Innovation','FarmDirect NG','HealthPlus','Edutech Africa','Lagos Logistics'])[(t.n % 6) + 1],
  customer_title = (ARRAY['CEO','CTO','Head of Product','Operations Lead','Founder','Director'])[(t.n % 6) + 1],
  rating = 4 + (t.n % 2),
  featured = (t.n % 4 = 0),
  display_order = t.n,
  body = COALESCE(NULLIF(c.body,''), '<p>Nexoris Technologies delivered an exceptional solution that transformed our business operations. The team was professional, responsive, and truly understood our needs.</p>')
FROM t WHERE c.id = t.id;

-- Seed Legal Pages (version, effective date, footer visibility).
WITH l AS (SELECT id, row_number() OVER (ORDER BY created_at) AS n FROM cms_content WHERE kind='legal_page')
UPDATE cms_content c SET
  version = '2.' || (l.n % 3)::text,
  effective_date = (now() - (l.n * interval '20 days'))::date,
  visible_in_footer = true,
  require_acceptance = (l.n % 2 = 0)
FROM l WHERE c.id = l.id;
