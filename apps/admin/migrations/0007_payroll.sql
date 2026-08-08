-- The Payroll module (PRD 8). Payroll runs the pay cycle and reads salary structure live from HR on
-- every run (8.1) - it never stores its own copy of salary, so there is no employee-salary table
-- here. Covers the statutory deduction toggle panel (8.3), pay runs and their lifecycle (8.5), the
-- salary advance (8.6), and the per-worker payslip lines (8.7). Deduction regimes follow the
-- employment type already set in HR (8.2): Employee -> PAYE, Contract/Consultant -> withholding tax.

-- Statutory deduction toggle panel + payroll configuration, a singleton (8.3, 8.4).
CREATE TABLE IF NOT EXISTS payroll_settings (
  id                    boolean PRIMARY KEY DEFAULT true CHECK (id),
  paye_enabled          boolean NOT NULL DEFAULT true,
  pension_enabled       boolean NOT NULL DEFAULT true,
  nhf_enabled           boolean NOT NULL DEFAULT true,
  wht_enabled           boolean NOT NULL DEFAULT true,
  -- Employees' Compensation contribution (NSITF, 1% of payroll): employer cost, not on the payslip.
  ec_enabled            boolean NOT NULL DEFAULT true,
  pension_employee_rate numeric(5,2) NOT NULL DEFAULT 8.0,
  pension_employer_rate numeric(5,2) NOT NULL DEFAULT 10.0,
  nhf_rate              numeric(5,2) NOT NULL DEFAULT 2.5,
  wht_rate              numeric(5,2) NOT NULL DEFAULT 5.0,
  ec_rate               numeric(5,2) NOT NULL DEFAULT 1.0,
  pay_day               integer NOT NULL DEFAULT 25,
  -- The Nigeria Tax Act 2025 band table is effective 1 Jan 2026 (8.4). Verify before the first run.
  tax_table_effective   date NOT NULL DEFAULT DATE '2026-01-01',
  tax_table_verified    date,
  updated_at            timestamptz NOT NULL DEFAULT now()
);
INSERT INTO payroll_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- A pay run and its lifecycle: Draft, Reviewed, Approved, Disbursed, Closed. Locks once disbursed;
-- corrections go into the next run as an adjustment, never a silent edit to a closed run (8.5).
CREATE TABLE IF NOT EXISTS pay_run (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period         text NOT NULL,
  run_type       text NOT NULL DEFAULT 'Regular' CHECK (run_type IN ('Regular', 'Bonus', 'Final')),
  status         text NOT NULL DEFAULT 'Draft'
                   CHECK (status IN ('Draft', 'Reviewed', 'Approved', 'Disbursed', 'Closed')),
  employee_count integer NOT NULL DEFAULT 0,
  gross          numeric(16,2) NOT NULL DEFAULT 0,
  deductions     numeric(16,2) NOT NULL DEFAULT 0,
  net            numeric(16,2) NOT NULL DEFAULT 0,
  employer_cost  numeric(16,2) NOT NULL DEFAULT 0,
  created_by     uuid REFERENCES staff(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  approved_by    uuid REFERENCES staff(id),
  approved_at    timestamptz,
  disbursed_at   timestamptz
);

-- One line per worker per run: the salary snapshot from HR plus every computed deduction by name.
CREATE TABLE IF NOT EXISTS pay_run_line (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_run_id         uuid NOT NULL REFERENCES pay_run(id) ON DELETE CASCADE,
  employee_id        uuid REFERENCES employee(id),
  employee_name      text NOT NULL,
  regime             text NOT NULL CHECK (regime IN ('PAYE', 'WHT')),
  basic              numeric(14,2) NOT NULL DEFAULT 0,
  housing            numeric(14,2) NOT NULL DEFAULT 0,
  transport          numeric(14,2) NOT NULL DEFAULT 0,
  other_allowances   numeric(14,2) NOT NULL DEFAULT 0,
  gross              numeric(14,2) NOT NULL DEFAULT 0,
  paye               numeric(14,2) NOT NULL DEFAULT 0,
  pension_employee   numeric(14,2) NOT NULL DEFAULT 0,
  nhf                numeric(14,2) NOT NULL DEFAULT 0,
  wht                numeric(14,2) NOT NULL DEFAULT 0,
  voluntary          numeric(14,2) NOT NULL DEFAULT 0,
  advance_repayment  numeric(14,2) NOT NULL DEFAULT 0,
  net                numeric(14,2) NOT NULL DEFAULT 0,
  pension_employer   numeric(14,2) NOT NULL DEFAULT 0,
  ec                 numeric(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS pay_run_line_run_idx ON pay_run_line (pay_run_id);
CREATE INDEX IF NOT EXISTS pay_run_line_employee_idx ON pay_run_line (employee_id);

-- Salary advance: a future payroll deduction disbursed early (8.6). HR raises, Payroll/Finance
-- approve and set the repayment plan. Sits as an asset (Employee Advances Receivable) in Finance,
-- never an expense; each repayment reduces net pay and the outstanding balance.
CREATE TABLE IF NOT EXISTS salary_advance (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       uuid NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  amount            numeric(14,2) NOT NULL CHECK (amount > 0),
  reason            text,
  status            text NOT NULL DEFAULT 'Pending'
                      CHECK (status IN ('Pending', 'Approved', 'Declined', 'Repaying', 'Repaid')),
  repayment_months  integer NOT NULL DEFAULT 1 CHECK (repayment_months >= 1),
  monthly_repayment numeric(14,2) NOT NULL DEFAULT 0,
  outstanding       numeric(14,2) NOT NULL DEFAULT 0,
  requested_by      uuid REFERENCES staff(id),
  requested_at      timestamptz NOT NULL DEFAULT now(),
  approved_by       uuid REFERENCES staff(id),
  approved_at       timestamptz
);
CREATE INDEX IF NOT EXISTS salary_advance_employee_idx ON salary_advance (employee_id);
CREATE INDEX IF NOT EXISTS salary_advance_pending_idx ON salary_advance (status) WHERE status = 'Pending';
