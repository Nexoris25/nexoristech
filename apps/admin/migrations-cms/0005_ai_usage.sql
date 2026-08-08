-- AI usage telemetry.
--
-- The AI Analytics screen reported 8,412 requests, 18.6M tokens, $84.20 spent and a 1.38s average
-- response — every figure hardcoded, because nothing in the platform recorded any of it. The screen
-- could not be "wired to real data" because the data was never captured.
--
-- One row per call to the Oge gateway. Latency and outcome are measured here; token counts and cost are
-- recorded only when the gateway returns them, and stay NULL otherwise rather than being estimated.
CREATE TABLE IF NOT EXISTS cms_ai_usage (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- Which capability was asked for: page-body, tldr, excerpt, faq, alt-text and so on.
  feature      text NOT NULL,
  -- Reported by the gateway. NULL when it does not say, never guessed.
  model        text,
  prompt_tokens     integer,
  completion_tokens integer,
  duration_ms  integer NOT NULL,
  ok           boolean NOT NULL,
  error        text
);
CREATE INDEX IF NOT EXISTS cms_ai_usage_recent_idx ON cms_ai_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS cms_ai_usage_feature_idx ON cms_ai_usage (feature, created_at DESC);
