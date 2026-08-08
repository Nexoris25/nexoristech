-- The HR module (PRD 7). HR is the only place a person is created; the shell grants module access
-- against the resulting record. Covers Department (7.2), the employee record (7.3), the contract and
-- commission staff register (7.4, the same table filtered by employment type), guarantors as their
-- own third-party section (7.3), the lifecycle (7.5), leave (7.6), and employee expense claims
-- (7.7). No recruitment or candidate data is included, by instruction.
--
-- Deliberate omission: there is no BVN column here and none is to be added (PRD 7.3, 14).

CREATE TABLE IF NOT EXISTS hr_department (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- The four departments the PRD names, expandable as the company grows (7.2).

-- The starter department list that used to be inserted here has been removed. The owner names their
-- own departments and positions; a list somebody else chose is something to delete before it is
-- something to use.


CREATE TABLE IF NOT EXISTS employee (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Set once the shell grants this person platform access; the person exists in HR first (3.1).
  staff_id           uuid UNIQUE REFERENCES staff(id),

  -- Personal (7.3)
  full_name          text NOT NULL,
  date_of_birth      date,
  gender             text,
  marital_status     text,
  phone              text,
  personal_email     text,
  address            text,
  photo_url          text,

  -- Employment (7.3). employment_type decides the Payroll deduction regime (7.4, 8).
  staff_number       text UNIQUE,
  job_title          text,
  department_id      uuid REFERENCES hr_department(id),
  employment_type    text NOT NULL DEFAULT 'Full-time'
                       CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Consultant')),
  date_joined        date,
  employment_status  text NOT NULL DEFAULT 'Probation'
                       CHECK (employment_status IN ('Probation', 'Confirmed', 'On Leave', 'Exited')),
  manager_id         uuid REFERENCES employee(id),
  work_email         text,

  -- Salary structure (7.3). Pension is computed on basic + housing + transport only, never gross.
  basic_salary       numeric(14,2) NOT NULL DEFAULT 0,
  housing_allowance  numeric(14,2) NOT NULL DEFAULT 0,
  transport_allowance numeric(14,2) NOT NULL DEFAULT 0,
  other_allowances   numeric(14,2) NOT NULL DEFAULT 0,

  -- Bank and statutory identifiers (7.3). No BVN, by design.
  bank_name          text,
  account_number     text,
  account_name       text,
  tin                text,
  pension_pin        text,
  pension_fund_administrator text,
  nhf_number         text,

  -- Next of kin (7.3)
  nok_name           text,
  nok_relationship   text,
  nok_phone          text,
  nok_address        text,

  -- Pays through the Commission Engine regardless of employment type or department (7.4).
  commission_eligible boolean NOT NULL DEFAULT false,

  -- Probation and exit (7.5)
  confirmation_due   date,
  last_working_day   date,
  exit_reason        text,
  final_settlement   boolean NOT NULL DEFAULT false,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employee_department_idx ON employee (department_id);
CREATE INDEX IF NOT EXISTS employee_status_idx ON employee (employment_status);

-- Guarantors sit in their own section: third-party personal data, same care as the employee's (7.3).
CREATE TABLE IF NOT EXISTS employee_guarantor (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  relationship  text,
  phone         text,
  address       text,
  occupation    text,
  employer      text,
  id_document   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employee_guarantor_employee_idx ON employee_guarantor (employee_id);

-- Leave, matching the Labour Act types, with a manager approval step (7.6).
CREATE TABLE IF NOT EXISTS leave_request (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  leave_type  text NOT NULL CHECK (leave_type IN ('Annual', 'Sick', 'Maternity', 'Paternity')),
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  days        integer NOT NULL DEFAULT 0,
  reason      text,
  status      text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  decided_by  uuid REFERENCES staff(id),
  decided_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leave_request_employee_idx ON leave_request (employee_id);
CREATE INDEX IF NOT EXISTS leave_request_pending_idx ON leave_request (status) WHERE status = 'Pending';

-- An employee-submitted claim with a receipt, approved by a manager, reimbursed standalone or as a
-- non-taxable line on the next pay run (7.7). Distinct from a company expense entered by Finance.
CREATE TABLE IF NOT EXISTS expense_claim (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  description   text NOT NULL,
  amount        numeric(14,2) NOT NULL CHECK (amount >= 0),
  incurred_on   date,
  receipt       text,
  status        text NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Reimbursed')),
  reimburse_via text CHECK (reimburse_via IS NULL OR reimburse_via IN ('Standalone payment', 'Next pay run')),
  decided_by    uuid REFERENCES staff(id),
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expense_claim_employee_idx ON expense_claim (employee_id);
CREATE INDEX IF NOT EXISTS expense_claim_pending_idx ON expense_claim (status) WHERE status = 'Pending';
