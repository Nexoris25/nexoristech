-- Redirects can now be scoped to the host they arrive on.
--
-- Matching was on the path alone and the host was thrown away, which makes the commonest redirect of
-- all — www to the canonical domain — impossible to express, and dangerous to attempt. A rule written
-- as https://www.example.com/pricing/ -> https://example.com/pricing/ was stored as just /pricing/,
-- so it matched on BOTH hosts: the canonical host would redirect its own page to itself. With a query
-- string on the request, or a trailing slash that disagreed, that is a redirect loop.
--
-- A rule with no host keeps matching every host, so nothing that works today changes.
ALTER TABLE cms_redirect ADD COLUMN IF NOT EXISTS source_host text;

-- Repair the rows that already carry a full URL in old_url. They cannot match anything as they stand:
-- the path of a request never begins with "https:", so these sit in the list marked Active and do
-- nothing. Split into the host and the path the editor meant. Pattern rules are left alone, because
-- their source is a regular expression rather than a URL.
UPDATE cms_redirect
   SET source_host = lower(substring(old_url from '^https?://([^/]+)')),
       old_url = COALESCE(
         NULLIF(regexp_replace(old_url, '^https?://[^/]+', ''), ''),
         '/'
       )
 WHERE old_url ~* '^https?://'
   AND COALESCE(pattern, 'Exact match') = 'Exact match';

-- Host comparison is case-insensitive, so store it folded and keep it that way.
ALTER TABLE cms_redirect DROP CONSTRAINT IF EXISTS cms_redirect_source_host_lower;
ALTER TABLE cms_redirect ADD CONSTRAINT cms_redirect_source_host_lower
  CHECK (source_host IS NULL OR source_host = lower(source_host));
