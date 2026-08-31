-- Read state for the Action Center.
--
-- The alerts in the Action Center are derived, not stored: an SLA breach is a fact about a lead and a
-- timestamp, recomputed on every page load. That is the right design, because an alert should stop
-- existing the moment the thing it is about is dealt with, and a stored copy would need reconciling
-- against reality forever.
--
-- What derived rows cannot carry is whether a person has seen them. So the alert stays derived and
-- only the reading of it is stored, keyed by the item's own identifier, which is already stable and
-- meaningful: a lead's SLA alert is the same "<lead id>-sla" on every render until it clears.
--
-- Per staff member, because reading is personal. An admin marking an alert read must not mark it read
-- for the salesperson who actually has to act on it.

CREATE TABLE IF NOT EXISTS notification_read (
  staff_id uuid        NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  -- The ActionItem.id it refers to, e.g. "<lead uuid>-sla". Text rather than a foreign key: the item
  -- is computed and has no row of its own to point at.
  item_id  text        NOT NULL,
  read_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (staff_id, item_id)
);

-- The lookup every page load makes: everything this person has already read.
CREATE INDEX IF NOT EXISTS notification_read_staff_idx ON notification_read (staff_id);

COMMENT ON TABLE notification_read IS
  'Which Action Center items a staff member has read. The items themselves are derived from live data
   and are never stored; only the fact that somebody has seen one is. A row whose item_id no longer
   corresponds to a live alert is harmless: it simply never matches again.';
