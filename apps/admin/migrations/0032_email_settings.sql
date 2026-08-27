-- Email delivery, configured once for the whole platform.
--
-- Where this used to live, and why it moved. The CMS Global Settings screen had an Email tab with a
-- provider dropdown, an SMTP host, a port, an encryption mode and a from address. None of it was read
-- by anything: lib/email.ts took its API key and sender from environment variables and never looked at
-- cms_setting at all. An operator could fill that form in, save it, see it persist, and send nothing.
-- It also offered SMTP, which this platform does not use.
--
-- Email is not a CMS concern either. Invitations and password resets go to whoever has been granted
-- access to any module, so the configuration belongs to the platform, in the platform's own database,
-- next to staff and module_access rather than beside content settings.
--
-- One row, enforced. `id boolean PRIMARY KEY DEFAULT true` with a CHECK is the same single-row pattern
-- company_settings uses, so there is no ambiguity about which row is the configuration.

CREATE TABLE IF NOT EXISTS email_settings (
  id                boolean PRIMARY KEY DEFAULT true CHECK (id),
  provider          text        NOT NULL DEFAULT 'mailjet' CHECK (provider IN ('mailjet')),
  from_email        text        NOT NULL DEFAULT '',
  from_name         text        NOT NULL DEFAULT '',
  reply_to          text        NOT NULL DEFAULT '',
  -- The credential pair, sealed. Never stored in the clear, never returned to a browser, never logged.
  -- The format is produced and read only by lib/secret-box.ts (AES-256-GCM); nothing else parses it.
  api_key_sealed    text,
  api_secret_sealed text,
  -- Enough to recognise which key is configured without being enough to use it. Shown in the UI so an
  -- operator can tell a rotated key from a stale one.
  api_key_hint      text        NOT NULL DEFAULT '',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid        REFERENCES staff (id) ON DELETE SET NULL
);

INSERT INTO email_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE email_settings IS
  'Platform-wide outbound email configuration. One row. Credentials are sealed with AES-256-GCM under
   ADMIN_SETTINGS_KEY and are never returned by any API or written to any log.';
COMMENT ON COLUMN email_settings.api_secret_sealed IS
  'Sealed Mailjet API secret. Write-only from the platform''s point of view: it is set through Settings
   and read only by the sender. There is no code path that renders it.';
COMMENT ON COLUMN email_settings.api_key_hint IS
  'The last four characters of the API key, for recognition only.';

-- Transport encryption is not a setting. The provider is reached over HTTPS and there is no option to
-- weaken that, which is why the old STARTTLS / SSL / None dropdown has no successor here.
