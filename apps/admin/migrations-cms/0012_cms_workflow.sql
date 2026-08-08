-- Editorial workflow (PRD Part Two: AI review -> editorial review -> legal review -> ready -> published).
-- (constraint widened to include returned; applied 2026-07-23)
-- cms_content already carries workflow_state; add the reviewer, priority, and due date the Review Queue
-- needs, and enrich the activity feed so the Activity Log reads like the design.

ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS reviewer   text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS priority   text;   -- High / Medium / Low
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS review_due timestamptz;

-- Assign a reviewer, priority, and due date to everything currently in a review stage.
WITH r AS (SELECT id, row_number() OVER (ORDER BY created_at) AS n FROM cms_content
           WHERE workflow_state IN ('pending_review','ai_review','editorial_review','legal_review','ready_to_publish','returned'))
UPDATE cms_content c SET
  reviewer   = (ARRAY['Sarah Editor','David Legal','HR Team','Ada Admin','Michael Okafor'])[(r.n % 5) + 1],
  priority   = (ARRAY['High','Medium','Low','Medium','High'])[(r.n % 5) + 1],
  review_due = now() + ((r.n % 9) - 3) * interval '1 day'
FROM r WHERE c.id = r.id;

-- Allow the 'returned' workflow state.
ALTER TABLE cms_content DROP CONSTRAINT IF EXISTS cms_content_workflow_state_check;
ALTER TABLE cms_content ADD CONSTRAINT cms_content_workflow_state_check
  CHECK (workflow_state = ANY (ARRAY['pending_review','ai_review','editorial_review','legal_review','scheduled','ready_to_publish','returned']));

-- Return a few items so the "Returned for Revision" metric and the stage donut are non-zero.
UPDATE cms_content SET workflow_state='returned'
WHERE id IN (SELECT id FROM cms_content WHERE workflow_state='pending_review' ORDER BY created_at LIMIT 4);

-- Activity feed seed (Activity Log). Idempotent-ish: only add when the feed is nearly empty.

-- The demonstration activity feed that used to be inserted here has been removed. It attributed
-- approvals and AI reviews to people who do not work here, on an article that was never written, and
-- those rows are indistinguishable from real audit history once they are in the table.
--
-- The feed fills itself as soon as anyone does anything in the CMS.
