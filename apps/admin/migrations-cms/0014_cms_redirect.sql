-- URL redirects (SEO Operations). Manage 301/302/307/410 redirects with hit tracking.
CREATE TABLE IF NOT EXISTS cms_redirect (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_url    text NOT NULL,
  new_url    text,
  type       text NOT NULL DEFAULT '301',   -- 301 / 302 / 307 / 410
  status     text NOT NULL DEFAULT 'Active', -- Active / Inactive
  hits       integer NOT NULL DEFAULT 0,     -- last 30 days
  notes      text,
  last_used  timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The sample redirects that used to be inserted here have been removed. They carried invented hit
-- counts, and one of them pointed at itself (/case-studies/covyvo-erp -> /case-studies/covyvo-erp),
-- which is an infinite redirect loop shipped as demonstration data.
--
-- Redirects are created when a URL actually changes.
