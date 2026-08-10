-- Executive roles for the staff table.
--
-- The platform ships a CEO dashboard, but the role model had only admin, salesperson and viewer,
-- so there was no way to say who the dashboard is for. In practice the page called requireStaff()
-- and nothing else, which meant any signed-in account, a salesperson or a viewer included, could
-- open it and read company revenue, expenses and client counts.
--
-- 'ceo' and 'executive' are added so that access can be described. They differ from 'admin' in
-- intent: an admin runs the platform, an executive reads across it. Neither is granted anything by
-- this migration on its own; the application decides what each may see.

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;

ALTER TABLE staff
  ADD CONSTRAINT staff_role_check
  CHECK (role IN ('admin', 'ceo', 'executive', 'salesperson', 'viewer'));
