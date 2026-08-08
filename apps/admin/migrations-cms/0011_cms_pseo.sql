-- Programmatic SEO module (PRD §9.6-9.7). Generated pages already exist in cms_content
-- (kind='generated_page'); add the fields the screens need. Templates and proposals get their own tables.
-- The quality gate and data-readiness gate (PRD §9.7) are enforced per page; scores are stored here.

ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS template        text;   -- generated pages: template used
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS industry        text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS target_keyword  text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS target_location text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS search_intent   text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS readiness_score smallint;

CREATE TABLE IF NOT EXISTS cms_template (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          text NOT NULL DEFAULT 'Landing Page',
  description   text,
  variables     jsonb NOT NULL DEFAULT '[]',   -- [{token, label}]
  sections      jsonb NOT NULL DEFAULT '[]',    -- ordered section names
  active        boolean NOT NULL DEFAULT true,
  in_proposals  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_proposal (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword       text NOT NULL,
  industry      text,
  search_volume integer NOT NULL DEFAULT 0,
  difficulty    smallint,             -- 0-100
  priority      text NOT NULL DEFAULT 'Medium',  -- High / Medium / Low
  status        text NOT NULL DEFAULT 'Pending', -- Pending / Approved / Rejected
  cpc           numeric(8,2),
  rationale     text,
  confidence    smallint,             -- 0-100
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Templates seed (matches the Templates list in the design).
INSERT INTO cms_template (name, type, description, variables, sections, active, in_proposals)
SELECT * FROM (VALUES
  ('Service + Industry','Landing Page','Landing page for showcasing a service within a specific industry.','[{"token":"{service}","label":"Primary service offered"},{"token":"{industry}","label":"Target industry"},{"token":"{benefit_1}","label":"Key benefit one"},{"token":"{benefit_2}","label":"Key benefit two"},{"token":"{location}","label":"Target location (optional)"},{"token":"{cta_text}","label":"Call to action text"}]'::jsonb,'["Hero Section","Benefits Section","Solutions / Features","Industries We Serve","Case Studies","Call To Action"]'::jsonb,true,true),
  ('Service + Location','Landing Page','A service page tied to a specific place, with local data.','[{"token":"{service}","label":"Service"},{"token":"{location}","label":"Location"}]'::jsonb,'["Hero Section","Local Data","Benefits","Case Studies","Call To Action"]'::jsonb,true,true),
  ('Industry + Solution','Landing Page','How a solution serves an industry.','[{"token":"{industry}","label":"Industry"},{"token":"{solution}","label":"Solution"}]'::jsonb,'["Hero Section","Solution Overview","Benefits","FAQ","Call To Action"]'::jsonb,true,true),
  ('Comparison','Landing Page','A real comparison matrix with honest trade-offs.','[{"token":"{service_a}","label":"Service A"},{"token":"{service_b}","label":"Service B"},{"token":"{industry}","label":"Industry"}]'::jsonb,'["Hero Section","Comparison Matrix","Trade-offs","Recommendation","Call To Action"]'::jsonb,true,true),
  ('Pricing','Landing Page','A real pricing table with the factors that move the number.','[{"token":"{service}","label":"Service"},{"token":"{tier}","label":"Pricing tier"}]'::jsonb,'["Hero Section","Pricing Table","Cost Factors","FAQ","Call To Action"]'::jsonb,true,true),
  ('Alternative To','Landing Page','Positioning against an alternative.','[{"token":"{service}","label":"Service"},{"token":"{alternative}","label":"Alternative"}]'::jsonb,'["Hero Section","Why Switch","Comparison","Call To Action"]'::jsonb,true,true),
  ('Best For','Landing Page','Best fit for an audience.','[{"token":"{service}","label":"Service"},{"token":"{audience}","label":"Audience"}]'::jsonb,'["Hero Section","Why It Fits","Proof","Call To Action"]'::jsonb,true,true),
  ('Integration','Landing Page','A service integration page.','[{"token":"{service}","label":"Service"},{"token":"{integration}","label":"Integration"}]'::jsonb,'["Hero Section","How It Works","Benefits","Call To Action"]'::jsonb,true,true),
  ('Case Study','Landing Page','A live case study derived page.','[{"token":"{industry}","label":"Industry"},{"token":"{use_case}","label":"Live case"}]'::jsonb,'["Hero Section","Challenge","Solution","Results","Call To Action"]'::jsonb,false,false),
  ('General Landing','Landing Page','A general topic landing page.','[{"token":"{topic}","label":"Topic"}]'::jsonb,'["Hero Section","Overview","Details","Call To Action"]'::jsonb,true,false)
) v(name,type,description,variables,sections,active,in_proposals)
WHERE NOT EXISTS (SELECT 1 FROM cms_template);

-- Proposals seed (matches the Proposals list in the design).

-- The page templates above are kept: they define the tokens the generator substitutes and the sections
-- a generated page is built from, so they are how the module works rather than sample content.
--
-- The sixty-five proposals that used to be inserted here are gone. Each carried an invented search
-- volume, difficulty and CPC, and the whole point of the proposal queue is that those numbers come from
-- Search Console. The queue fills when the generator runs against real demand.
