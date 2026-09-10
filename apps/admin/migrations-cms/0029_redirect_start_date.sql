-- The last of the redirect form's fields that had nowhere to go.
--
-- "Start Date" sits beside "Expiry Date" on the create form and was posted with every save and
-- discarded, exactly as the other four were. A rule with a start date is not live until that day,
-- which is what lets an editor prepare a move in advance instead of remembering to add it on the day.
ALTER TABLE cms_redirect ADD COLUMN IF NOT EXISTS start_date date;
