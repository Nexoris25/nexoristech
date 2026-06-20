# Nexoris Technologies Admin Update

## Internal Admin Dashboard: Complete Product Requirements Document
### CRM, Finance, HR, Payroll, and Commission

**Status:** Final, for build. This document supersedes and replaces every earlier draft of the admin dashboard PRD addendum. It is the one document to hand to the team. Nothing else needs to be read alongside it. Extends and fully replaces Part Three of the Nexoris Technologies Digital Platform PRD.

> Provided by the product owner on 2026-06-20. Captured verbatim.

---

## 1. Purpose and scope
The Nexoris Technologies internal admin dashboard is the staff-facing platform for running the company. It is built as a modular shell hosting five things: the CRM, Finance, HR, and Payroll modules, plus the Commission Engine and the Action Center, both of which are shared logic rather than modules of their own.

This document is the complete and current specification for all of it. The CRM module is written out in full below, not as a list of changes, because enough has moved out of it that a diff against the original would be harder to build from than a clean rewrite. Read Section 5 as the only CRM specification that matters going forward.

One scope decision that applies everywhere in this document: Nexoris Technologies does not collect, store, or display an employee's Bank Verification Number (BVN). No field for it exists anywhere in this product. This is a deliberate decision, not an omission, and no future addition to HR, Payroll, or Finance should reintroduce it.

## 2. The governing principle
Every piece of data and every action has exactly one module that owns it. Every other module references it. No module recreates it.

This single rule is what keeps a four-module platform from quietly turning into four platforms that disagree with each other. It is the test applied before any screen in this document gets a button that creates, edits, or deletes anything: check whether another module already owns that thing first. If it does, the button becomes a reference or a request, never a second copy.

## 3. The shared identity and access model
This is the mechanism that makes Section 2 hold in practice, not just on paper.

### 3.1 HR is the only place a person is created
Every person who touches the admin dashboard, an employee, a contract worker, a commission-only agent, a founder, exists exactly once, as one record, in HR. There is no second "add person" form anywhere in the platform. CRM, Finance, and Payroll never create a person. They reference one by its HR identifier.

### 3.2 The shell is the only place module access and role are granted
One screen, in the dashboard shell, where an Admin grants a person access to a module and a role inside it. No module has its own "create a user" flow. Each module reads from this one access table and shows only the people who have been granted access to it. A person can hold a different role in each module they have been granted access to, and granting access to one module never implies access to another.

### 3.3 Deactivation is one action with platform-wide effect
When HR marks a person Exited, every module access grant for that person is revoked in the same instant, not separately by each module. CRM's open leads flow to the reassignment queue, Payroll excludes them from the next pay run, Finance access closes, all triggered by the single HR action.

### 3.4 One audit log for the entire platform
There is exactly one immutable audit log table. Every module writes to it. Each module's "view audit log" permission is a filtered view scoped to that module's own events, never a separate log.

## 4. Module map and the handoff contracts between modules
```
HR                  creates every person, owns Department, owns the
                     Candidate and Recruitment pipeline
  |
  | Contract: a person exists in HR before they can be granted
  | access to any module
  v
Shell               grants module access and role, one access table,
                     read by every module
  |
  v
CRM                 owns the lead, the deal, the pipeline, and the
                     Sales Rep Profile layered on an HR person
  |
  | Contract: CRM's responsibility ends at a Won deal with an
  | engagement type and value attached. Finance's responsibility
  | starts at creating the Engagement from that data. Nobody
  | re-types the client name or the amount.
  v
Finance             owns the Engagement, the Invoice, every Naira in
                     and out, the only module that creates an invoice
  ^
  | Contract: Payroll posts the total of every disbursed pay run
  | into Finance as an expense and a set of liabilities. Finance
  | never computes payroll itself.
  |
Payroll             owns the pay run, reading salary structure live
                     from HR, never storing its own copy of it

Commission Engine    not a module. Reads the deal from CRM, the
                     person from HR, pays out through Payroll.

Document Engine      not a module. One shared rendering package.
                     CRM, Finance, HR, and Payroll each own only
                     their own template types on it.

Tax Engine           not a module. One shared calculator for PAYE,
                     pension, NHF, and withholding tax, used by
                     Finance and Payroll.
```

## 5. CRM Module: complete specification

### 5.1 Role and scope
CRM is the sales system of record. It owns every lead, every deal, and the conversation that turns a visitor into a client. It does not create people, does not generate invoices, and does not hold candidate or recruitment data. Those belong to HR and Finance, referenced by CRM where needed, never duplicated.

### 5.2 Lead sources
Every lead carries its source (website form, Oge, Solution Finder, WhatsApp, email, referral, or a specific programmatic or cost page) and its evidence. Recording the originating page lets the team see which pages and which programmatic entries actually produce business, reported correctly downstream as Sales Won Value (Section 5.7), never as Revenue.

### 5.3 Lifecycle stages
New, Contacted, Qualified, Scoping Call Booked, Proposal Sent, Negotiation, then Won, Lost, or Nurture. New carries a first-response SLA timer set to the one-business-day promise, alerting the salesperson before breach and the admin at breach. Lost requires a reason from a controlled list. Nurture requires a revival date so the lead resurfaces automatically.

### 5.4 Assignment
Auto-assignment on intake, round-robin modified by industry affinity, capacity caps, and working-hours awareness, so an overnight lead queues for the morning rather than burning someone's SLA. Capacity caps are read from the Sales Rep Profile (Section 5.6), not stored separately in the assignment engine. Reassignment is Admin-only. A salesperson may request reassignment with a reason, and the Admin approves or declines. Every assignment, reassignment, stage change, and target edit writes a row into the one shared platform audit log (Section 3.4).

### 5.5 Roles and permissions
| Role | Access |
|---|---|
| CRM Admin | Reassigns leads, sets targets, exports CRM data, views CRM's slice of the platform audit log, grants or removes CRM access for an existing HR person, configures a Sales Rep Profile. Cannot create, edit, or remove a person. |
| Salesperson | Owns leads, logs activities, moves own leads through stages, uses the AI assists, sees own performance and the team leaderboard. No reassign, no delete, no export. |
| Viewer | Read-only, for leadership. |

Granting or removing the CRM Admin or Salesperson role itself happens in the shell's access screen (Section 3.2), not inside CRM.

### 5.6 The Sales Rep Profile
CRM does not create a person. Every individual using CRM already exists as a Person in HR (Section 7). To put someone on the CRM roster: an Admin grants them CRM access through the shared access model (Section 3.2). They typically come from the Sales & Marketing department in HR, though CRM access can be granted to anyone regardless of department, including a founder who also closes deals directly.

Once access is granted, CRM Admin attaches a Sales Rep Profile: industries owned, capacity cap, territory if relevant, and starting targets. Until that profile is configured, the person sits in an "Unconfigured reps" list and is excluded from the round-robin. The Sales Rep Profile holds only this configuration. It never holds a name, phone number, or email. Those are read live from HR and simply displayed.

When HR marks someone Exited, their CRM access is revoked instantly through the shared model, and their open leads flow automatically to the reassignment queue. CRM never runs a deactivation step of its own.

### 5.7 Targets, performance, and the Sales Won Value rule
Weekly and monthly targets per person and team, split into activity targets (first responses within SLA, calls, meetings, proposals) and outcome targets (qualified leads, deals won). Dashboards per person and team: targets versus actuals, pipeline by stage, conversion between stages, average first-response time, win rate, and source performance. A daily activity log with quick-log buttons and auto-captured Oge transcripts. An SLA board visible to all, sorted by urgency. A weekly written digest per salesperson and admin, and a monthly digest summarising revenue won against the monthly target, the full conversion funnel, source performance, and lost-reason patterns.

The rule that governs every figure on these screens: any dollar amount tied to a deal's value at the point it was marked Won is labeled Sales Won Value, never "Revenue." Recognized and collected revenue belong to Finance (Section 6) and are never calculated independently inside CRM. Any commission figure shown on a CRM dashboard is read from the Commission Engine (Section 9). CRM never calculates commission itself.

### 5.8 The three Oge-integrated AI features
- **Lead scoring with justification:** every lead is scored 1 to 100 on arrival with a Hot, Warm, or Cold band, and a plain-language justification naming the fit against the ideal customer profiles, the intent signals detected, the completeness of what was shared, and the source and page. The score orders the queue and never auto-rejects anyone.
- **Auto-response generation:** a drafted reply grounded in the lead's own words and the matching service and industry pages, reviewed and sent by the salesperson, never sent automatically.
- **Service recommendations:** each lead is tagged with the services and industry it matches, using the same deterministic mapping the website's Solution Finder uses, with a short rationale and the relevant page links.

### 5.9 Supporting smart features
An instant plain-language lead summary on arrival. A technical-fit note for leads describing a system or integration. Suggested talking points drawn from the site's own pages. Smart deduplication and company matching on intake. An urgency and sentiment tag. A next-best-action suggestion per lead. Duplicate-safe follow-up reminders and a revival nudge for Nurture leads.

The won-deal handover: when a deal moves to Won, this checklist now does two things. It creates the delivery-side placeholder record, ready for a future Project Delivery module, and it automatically creates the Finance Engagement (Section 6.3) with the client, value, and service line carried over from the deal. CRM's responsibility ends the moment that Engagement is created. Nobody on the finance side retypes a client name or a deal amount that already exists in CRM.

### 5.10 Document templates
CRM owns exactly four template types on the shared Document Engine (Section 10.1): Proposal, Scope of Work, Service Level Agreement, and Contract. CRM has no invoice template of any kind. Raising an invoice happens only in Finance.

### 5.11 Voice rules
Every piece of text CRM generates for a human to send or read reads like spoken word from someone who knows the topic. No em dashes. No buzzwords, jargon, or cliches. "Nexoris Technologies" is always written in full. No invented price, date, client name, or result. This rule now applies platform-wide, not only to CRM, since Finance, HR, and Payroll generate their own text as well.

### 5.12 AI infrastructure
All AI in CRM runs through the one shared AI gateway (apps/oge, the CRM Worker tier), the same gateway used by every AI feature in every other module. CRM does not instantiate its own AI provider connection, and no other module should either.

### 5.13 What CRM explicitly does not do
- Does not create or remove a person. That is HR's job alone.
- Does not generate an invoice. That is Finance's job alone.
- Does not hold candidate or job-applicant data. That is HR's job alone.
- Does not calculate commission earned or paid. That is the Commission Engine's job alone.
- Does not maintain its own audit log. It writes to the one shared platform log.

### 5.14 Screen inventory
| Screen | Pattern | Primary user |
|---|---|---|
| Lead and deal pipeline | List view | Salesperson, CRM Admin |
| Deal detail | Record view | Salesperson |
| Sales Rep Profile | Record view | CRM Admin |
| Reassignment queue | Approval queue | CRM Admin |
| Document templates (Proposal, SOW, SLA, Contract) | Guided form | Salesperson |
| Performance dashboards | Summary dashboard | CRM Admin, Salesperson, Viewer |
| SLA board | Summary dashboard | Everyone |

## 6. Finance Module

### 6.1 Role and scope
The single place that answers how much money came in, how much went out, and what the difference is. Owns the chart of accounts, Engagements, Invoicing, Expenses, Subscriptions, bank accounts, and every report built from them. The only module in the platform that creates an invoice.

### 6.2 Chart of accounts
Income: service revenue, split by service line and by Project versus Retainer. Expenses: salaries and statutory remittances, infrastructure and hosting, AI and API costs, software and platform subscriptions, one-off contractor payments, marketing, office and admin, professional fees. Assets: bank accounts, accounts receivable, employee advances receivable, prepaid expenses. Liabilities: accounts payable, PAYE payable, pension payable, NHF payable, withholding tax payable. These sit as liabilities until remitted, so the books reflect money the company holds but does not yet own.

### 6.3 Engagements: Project, Retainer, and Hybrid
An Engagement is created automatically through the Deal-to-Engagement contract (Section 5.9), never typed in by hand from scratch.
- **Project:** fixed scope, fixed price or milestone-based. Closes when the final invoice is paid.
- **Retainer:** a recurring monthly fee. Holds client, service line, monthly fee, the scope included written down clearly so it cannot drift, billing day, start date, auto-renew status, a pause option, and a cancellation notice period.
- **Hybrid:** a Project phase that automatically opens a Retainer phase on a set date, read as one continuous client history.

Finance reports always separate Recurring Revenue from Project Revenue, never blended.

### 6.4 Invoicing and billing
Lifecycle: Draft, Sent, Partially Paid, Paid, Overdue, Void, Credit Note.

Invoice record holds: client with TIN, line items, subtotal, VAT at 7.5% toggled per line item, withholding tax the client is expected to deduct, amount due, due date, status, linked Engagement, linked bank account.

Partial invoicing: a payment schedule of milestones, each with a description, an amount or percentage, and a trigger, a date or a manual delivery confirmation. Each milestone generates its own tagged invoice, for example Deposit, Milestone 2, Final.

Partial payments: a Payments table under every invoice tracks paid-so-far against the total. An overpayment sits as a client credit, applied to the next invoice rather than refunded.

Withholding tax on income: the invoice shows the gross amount, the WHT the client is expected to withhold, and the net amount expected in the bank, so the bank credit reconciles exactly.

Retainer billing engine: Finance auto-generates the invoice for every active retainer on its billing day. No one needs to remember to raise it.

### 6.5 Expenses
Every expense carries a category, an optional linked subscription, a payment method, an attached receipt, and a withholding tax flag. For a rare one-off local payment (a freelance designer, a printer, an office purchase), a simple entry under Expenses covers it, with the WHT flag, since this is the only place WHT on outgoing local payments applies. Nexoris Technologies is a software development company, not a regular buyer of goods or hirer of local contractors, so no separate vendor management system is built. The one-off entry covers the exception.

### 6.6 Subscriptions and tools register
This is the actual shape of Nexoris Technologies' regular spend: recurring software and platform subscriptions, mostly foreign, billed in USD, charged to a card. Each record holds name, category (Infrastructure and Hosting, AI and API Costs, Design and Productivity Tools, Domains, Developer Tools), billing currency and amount, billing cycle, renewal date, auto-renew status, the card charged, and the internal system or project it supports.

Currency handling: each subscription expense captures the exchange rate at the date it was actually charged, storing both the original amount and the NGN equivalent, so the books reflect what was actually paid that day, not a backdated guess.

Renewal dashboard: every active subscription listed by upcoming renewal date and NGN cost, with a 7-day renewal alert and a quarterly AI-assisted review flagging tools whose cost or usage has not changed in months.

Withholding tax does not apply to these foreign subscriptions, since the providers are non-resident and the relationship is a subscription, not a local contract for services. Nigeria has started applying VAT rules to some foreign digital service providers, which is a separate mechanism from WHT and worth confirming with an accountant before launch.

### 6.7 Bank accounts and reconciliation
Multiple company bank accounts, each transaction tagged to one, with a reconciliation view comparing bank balance to system balance per account.

### 6.8 Reports
Profit and loss by month and service line. Recurring Revenue versus Project Revenue, reported separately and never blended. Cash flow, comparing bank balance against invoiced-but-unpaid amounts. Accounts receivable aging. Accounts payable, including unremitted statutory liabilities. The statutory remittance summary fed by Payroll (Section 8.9).

### 6.9 Roles
| Role | Access |
|---|---|
| Finance Admin | Full access, including voiding invoices, managing the chart of accounts, and marking statutory remittances paid. |
| Finance Viewer | Read-only, for leadership. |
| Payroll (system) | Posts salary expense and liability totals automatically, no general Finance access. |

### 6.10 Screen inventory
| Screen | Pattern | Primary user |
|---|---|---|
| Finance overview | Summary dashboard | Finance Admin, founder |
| Engagements list and detail | List view, Record view | Finance Admin |
| Invoices list and detail | List view, Record view | Finance Admin |
| Raise invoice | Guided form | Finance Admin |
| Expenses | List view, Record view | Finance Admin |
| Subscriptions and renewal dashboard | List view, Summary dashboard | Finance Admin |
| Bank accounts and reconciliation | Record view | Finance Admin |
| Reports | Summary dashboard | Finance Admin, Finance Viewer |

## 7. HR Module

### 7.1 Role and scope
The single place a person is created, and the only place a person is ever created in the entire platform. Owns Department, the employee and contract staff registers, the Candidate and Recruitment pipeline, salary structure, and the employment lifecycle.

### 7.2 Department
A simple list, expandable as the company grows: Sales & Marketing, Engineering and Product Development, Finance and Operations, Executive and Leadership. Every employee and contract worker belongs to exactly one department. Department is descriptive, organizational data. It does not by itself grant or restrict module access, which is a separate, deliberate grant made in the shell (Section 3.2), since a person in one department, for example a founder in Executive, may still need CRM access as a working salesperson.

### 7.3 Employee record
- **Personal:** full name, date of birth, gender, marital status, phone, personal email, residential address, photo.
- **Employment:** staff ID, job title, department, employment type (Full-time, Part-time, Contract or Consultant, the field that decides which Payroll deduction regime applies), date joined, employment status (Probation, Confirmed, On Leave, Exited), reporting manager, work email.
- **Salary structure:** Basic salary, Housing allowance, Transport allowance, other named allowances, gross monthly salary as the sum. Basic, Housing, and Transport matter specifically because pension is computed only on those three under current rules, not on full gross.
- **Bank and statutory identifiers:** bank name, account number, account name (must match the employee's legal name), Tax Identification Number (TIN), Pension PIN and the chosen Pension Fund Administrator, NHF number if registered. Nexoris Technologies does not collect or store an employee's BVN. No field for it exists in this record, and none should be added.
- **Next of kin:** name, relationship, phone, address.
- **Guarantors (one or two):** full name, relationship to employee, phone, address, occupation, employer if employed, an uploaded copy of their ID. This sits in its own clearly separated section of the record, since it is third-party personal data and deserves the same care as the employee's own data.
- **Documents:** signed contract, ID, qualifications, signed guarantor form, generated or stored through the shared Document Engine (Section 10.1).

### 7.4 Contract and commission-based staff register
A lighter record than the full employee record, with no pension, no NHF, and no mandatory guarantor, though one can still be added if company policy requires it for a specific contractor.

| Worker type | Pay basis | Tax treatment | Lives in |
|---|---|---|---|
| Employee | Fixed salary structure | PAYE | Employee Register |
| Contract, fixed fee | Agreed retainer or per-project amount | Withholding tax | Contract Staff Register |
| Contract, commission based | No base, or a small base plus commission | Withholding tax on the commission and any base | Contract Staff Register, paid through the Commission Engine (Section 9) |

A commission eligible flag sits on top of any person regardless of employment type or department, deciding whether the Commission Engine pays them. This is the same flag that lets a salaried employee, or the founder, earn commission without being treated as a different kind of worker.

### 7.5 Lifecycle
Onboarding checklist: contract signed, bank details collected, guarantor form collected, statutory IDs collected. Once HR marks someone Confirmed or Active, an Admin can grant module access through the shell (Section 3.2). Probation: tracked with an automatic reminder before the confirmation date. Exit: last working day, a final settlement flag for Payroll (Section 8.5), exit reason. The instant this is saved, every module access grant for that person is revoked through the shared access table, with history preserved and never hard-deleted.

### 7.6 Leave management
Leave types matching the Labour Act (annual, sick, maternity, paternity), a balance per employee, a calendar view, and a manager approval step. Leave balances feed the final settlement calculation in Payroll.

### 7.7 Employee expense claims
Different from a company expense entered directly by Finance. An employee submits a claim with a receipt, a manager approves it, and it is reimbursed either as a standalone payment or added as a non-taxable line to the next pay run.

### 7.8 Candidate and recruitment pipeline
Job applications from the public careers pages route here directly, not into CRM. A candidate record holds the applicant's details, the role applied for, the application stage (Applied, Shortlisted, Interviewing, Offer, Hired, Rejected), and notes from the hiring team. When a candidate reaches Hired, HR converts them directly into a new Employee record, carrying their details over rather than re-entering them.

### 7.9 Roles
| Role | Access |
|---|---|
| HR Admin | Full access, including guarantor and bank fields, and the only role that can create a person or mark an exit. |
| HR Assistant | Edits non-financial fields, cannot see bank account numbers in full. |

### 7.10 Screen inventory
| Screen | Pattern | Primary user |
|---|---|---|
| Employee directory | List view | HR Admin, HR Assistant |
| Employee record | Record view | HR Admin, HR Assistant |
| Onboard new employee | Guided form | HR Admin |
| Contract staff register | List view, Record view | HR Admin |
| Candidate and recruitment pipeline | Approval queue | HR Admin |
| Leave calendar and requests | Approval queue | HR Admin, managers |
| Expense claims | Approval queue | HR Admin, managers |
| Offboard employee | Guided form | HR Admin |

## 8. Payroll Module

### 8.1 Role and scope
Runs the pay cycle. Reads salary structure from HR on every run rather than storing its own copy. Never creates a person and never edits HR's data.

### 8.2 Worker classification and deduction regimes
Decided entirely by the employment type already set in HR (Section 7.3 and 7.4), never re-entered in Payroll.
- **Employee, PAYE regime:** PAYE, pension, optionally NHF, no withholding tax.
- **Contract or Consultant, WHT regime:** withholding tax, no PAYE, no pension, no NHF.

These are not two competing options on the same person. They are different regimes entirely, and the system never allows both to apply to the same worker at once.

### 8.3 Statutory deduction toggle panel
A settings screen, Payroll Admin only, with a master switch per deduction type. Every toggle defaults to on for the regime it belongs to. Turning one off is a deliberate, logged action.

| Deduction | Applies to | Who pays | Default | Off means |
|---|---|---|---|---|
| PAYE | Employees | Employee, employer remits | On | Employer is not withholding income tax, flagged as a compliance risk. |
| Pension (8% employee, 10% employer) | Employees | Both, employer remits | On | No retirement contribution made this run. |
| NHF (2.5% of basic) | Employees, if registered | Employee, employer remits | On | No housing fund contribution. |
| Employee voluntary deductions (loan repayment, cooperative) | Anyone | Employee | Off until added | Opt-in by nature. |
| Withholding tax | Contract or Consultant only | Deducted from the contractor, employer remits | On for this worker type | Contractor is paid gross, compliance gap flagged. |
| Employees' Compensation contribution (1% of payroll) | Employees | Employer only, not deducted from pay | On | An employer cost line posted to Finance, not shown on the payslip. |

### 8.4 PAYE under the Nigeria Tax Act 2025
The Nigeria Tax Act 2025 took effect on 1 January 2026 and replaced the old Personal Income Tax Act bands and the Consolidated Relief Allowance. The shared Tax Engine (Section 10.2) encodes the following as the active rate table:

| Annual chargeable income band | Rate |
|---|---|
| First ₦800,000 | 0% |
| Next ₦2,200,000 (₦800,001 to ₦3,000,000) | 15% |
| Next ₦9,000,000 (₦3,000,001 to ₦12,000,000) | 18% |
| Next ₦13,000,000 (₦12,000,001 to ₦25,000,000) | 21% |
| Next ₦25,000,000 (₦25,000,001 to ₦50,000,000) | 23% |
| Above ₦50,000,000 | 25% |

Rent Relief (the lower of 20% of annual rent paid, or ₦500,000) replaces the old Consolidated Relief Allowance. This needs a field for declared annual rent on the employee record, or collected once a year, otherwise the employee gets no relief and pays more tax than they should. Pension is deducted from Basic, Housing, and Transport only, not total gross. Employees earning at or below the national minimum wage pay no PAYE at all.

Because this law is only months old and regulator guidance is still being issued, the rate table carries an effective date and a "last verified against official Nigeria Revenue Service guidance" timestamp. Verify it against the official First Schedule before the first live payroll run.

### 8.5 Pay run types and lifecycle
Lifecycle: Draft, Reviewed, Approved, Disbursed, Closed. Each run locks once disbursed. A correction goes into the next run as an adjustment line, never a silent edit to a closed run.
- **Regular monthly run:** the standard cycle.
- **Bonus or 13th month run:** a separate pay run type, since bonus pay has different tax handling considerations.
- **Final settlement run:** triggered by the exit flag in HR. Pulls together prorated final salary, unused leave encashment, gratuity if applicable (taxable), any compensation for loss of office (its own exemption threshold, separate from regular PAYE), and nets off any outstanding salary advance balance.

### 8.6 Salary advance
An advance is a future payroll deduction disbursed early. HR starts the request, Payroll and Finance approve and execute it.
- **Request flow:** employee or HR raises a request with an amount and a reason. A manager or HR Admin approves eligibility first. Finance or Payroll Admin gives final approval and sets the repayment plan, lump sum on the next run or spread across a number of months.
- **Accounting treatment:** an advance is not an expense. It sits as an asset (Employee Advances Receivable) in Finance, not a cost. Each repayment through Payroll reduces both the employee's net pay and that receivable balance. If someone exits before fully repaying, the outstanding balance is deducted from their final settlement.

### 8.7 Payslip and disbursement
One payslip per worker per run, showing gross pay, every deduction line by name and amount, net pay, and year-to-date totals, generated through the shared Document Engine in the Nexoris Technologies brand, emailed automatically on disbursement. For a small team, disbursement ships as a bank transfer file matching the bank's bulk transfer format, rather than a live payment integration, in this phase.

### 8.8 Compliance calendar
A dashboard reminder, not a hard gate, showing remittance windows: PAYE generally due to the relevant State Internal Revenue Service by the 10th of the following month, pension generally due within a short window of paying salaries, and NHF and the Employees' Compensation contribution with their own filing windows. Verify these exact day counts against current PenCom, NHF, and Nigeria Revenue Service circulars before go live.

### 8.9 Posting to Finance
On disbursement, Payroll automatically posts to Finance: total net pay as a Salaries expense, and each statutory deduction as a liability (PAYE Payable, Pension Payable, and so on) until Finance marks it remitted. This is the one automatic write between Payroll and Finance, and it is logged.

### 8.10 Reports
Payroll register, statutory remittance schedule broken out by PAYE, pension, NHF, and Employees' Compensation, and a year-to-date tax report per worker including the annual employee tax statement.

### 8.11 Roles
| Role | Access |
|---|---|
| Payroll Admin | Full access. Runs cycles, manages the deduction toggle panel, approves advances. |
| Payroll (system) | Posts totals to Finance automatically, no broader access. |

### 8.12 Screen inventory
| Screen | Pattern | Primary user |
|---|---|---|
| Payroll dashboard | Summary dashboard | Payroll Admin |
| Run payroll | Guided form | Payroll Admin |
| Statutory deduction toggle panel | Record view | Payroll Admin |
| Pay run history | List view | Payroll Admin |
| Salary advance requests | Approval queue | Payroll Admin, Finance Admin |
| Payslip | Record view | Worker, Payroll Admin |
| Compliance calendar | Summary dashboard | Payroll Admin |

## 9. Commission Engine
Not a navigation module. Shared logic that reads the worker from HR, the deal from CRM, and pays out through Payroll.
- **Plans:** a rate structure per role or per person: a flat percentage of deal value, a tiered percentage past a revenue threshold, a flat fee per deal type, or a smaller ongoing percentage on retainer revenue for as long as the retainer keeps billing, which only works cleanly because a retainer is its own tracked Finance object with its own billing cycle (Section 6.3).
- **Earned versus payable:** commission accrues when a deal moves to Won, but becomes payable only once the linked Engagement's invoice is actually paid. The default is earned on Won, payable on payment received, with both dates visible on the commission record. This prevents paying a rep against revenue the company never collected.
- **Tax treatment:** an employee's commission is added to taxable pay and runs through PAYE. A non-employee's commission has withholding tax deducted instead.
- **Clawback:** a deal lost, refunded, or cancelled after commission was paid raises a clawback line that nets against the rep's next payout rather than disappearing.
- **The single source of truth rule:** the Commission Engine is the only place that calculates what a rep has earned or been paid. CRM's dashboards display this figure by reading it, never by recalculating it.
- **Reporting:** a commission leaderboard sits inside CRM's existing performance dashboards (Section 5.7), next to targets and conversion rates.

## 10. Shared engines

### 10.1 The Document Engine
One rendering package, branded in the Nexoris Technologies purple, used by four modules, each owning only its own template types. No module re-implements PDF generation, table layout, or branding.

| Module | Template types it owns |
|---|---|
| CRM | Proposal, Scope of Work, Service Level Agreement, Contract |
| Finance | Invoice, Credit Note, Receipt, Statement of Account |
| HR | Offer Letter, Employment Contract, Confirmation Letter, Exit Letter |
| Payroll | Payslip |

Dynamic fields (client or employee name, dates, amounts) are filled from each module's own data. Every document is reviewed by a person before it is sent in every case.

### 10.2 The Tax Engine
One package, called by Finance and Payroll, holding every piece of Nigerian statutory tax logic: the PAYE band calculator (Section 8.4), the pension calculator, the NHF calculator, and the withholding tax calculator, with a rate table versioned by effective date. When a Finance Act amends a band or a rate, one file changes and both modules pick it up. This avoids building the withholding tax logic twice, once for Payroll's contract staff and once for Finance's invoices and expenses, which would drift out of sync the first time the law changes.

## 11. The Action Center and AI features

### 11.1 Role and scope
One shared inbox across CRM, Finance, HR, and Payroll, living in the dashboard shell, not owned by any one module: an overdue invoice, a leave request awaiting approval, a pay run ready for review, a contract expiring next week, all in one place.

### 11.2 Deterministic reminders, no AI needed
Invoice due in 3 days, invoice due today, salary advance repayment upcoming, contract renewal approaching, probation confirmation date approaching, statutory remittance deadline approaching, subscription renewal in 7 days.

### 11.3 AI-assisted features, through the existing CRM Worker tier, draft only, never auto-sent
| Feature | What it does |
|---|---|
| Overdue invoice escalation | Drafts a follow-up at 30 or 60 days overdue, reading the relationship and adjusting tone, reviewed before sending like every other AI draft in this platform. |
| Payroll anomaly check | Flags before approval if anyone's net pay moved more than expected against the prior run. |
| Commission statement summary | A one-line plain-language note per rep at month end: what closed, what is pending payment, what is pending collection. |
| Next-best-action on stuck items | Extends CRM's existing next-best-action to overdue invoices with no follow-up logged. |
| Quarterly subscription review | Surfaces tools whose cost or usage has not changed in months. |

## 12. UX and design principles

### 12.1 Continuity with the existing design system
These modules use the dashboard typography and tokens already defined for the platform: Inter for titles, headings, table headers, and data; JetBrains Mono for IDs, codes, and money amounts; the same 4px spacing scale; the same purple accent used sparingly, one per view, never as decoration.

### 12.2 Five screen patterns, reused everywhere
| Pattern | Used for |
|---|---|
| List view | Any collection of records |
| Record view | One item in full detail |
| Guided form | A multi-step process with a clear start and end |
| Approval queue | Anything waiting on a human decision |
| Summary dashboard | At-a-glance numbers for a role |

### 12.3 Performance budgets
Every list view loads paginated from the server, never the full table client side. Finance reports read from pre-aggregated rollups, rebuilt on any transaction change, not recalculated live on every page load. A pay run for a full team computes and renders a reviewable draft in under 10 seconds, with a visible progress state for anything that takes longer. Exchange rates for subscriptions are cached for the day, not looked up per row.

### 12.4 Sensitive data is masked by default
Bank account numbers and guarantor contact details are masked everywhere by default, showing only the last digits or a redacted form. Revealing the full value requires an explicit click, is available only to the roles named in Section 13, and writes an audit row recording who viewed it, separate from who edited it.

### 12.5 Accessibility
The same WCAG 2.2 AA floor used across the rest of the platform applies without exception.

## 13. Data model summary
| Entity | Owned by | Key fields | Referenced by |
|---|---|---|---|
| Person (Employee or Contract Staff) | HR | identity, employment, salary structure, bank details, guarantors | Every other module, by reference only |
| Department | HR | name | Person |
| CandidateApplication | HR | applicant info, stage | Converts to Person on Hired |
| ModuleAccessGrant | Shell | person, module, role | Every module's permission check |
| SalesRepProfile | CRM | industries owned, capacity, territory, targets | Linked to one Person |
| Deal | CRM | stage, value, service tags | Triggers Engagement on Won |
| Engagement | Finance | type, client, value | Created from Deal, parent of Invoice |
| Invoice | Finance | line items, VAT, WHT, status | Belongs to Engagement |
| Payment | Finance | amount, date | Belongs to Invoice |
| Expense, Subscription | Finance | category, amount, currency | Independent |
| PayrollRun, Payslip | Payroll | type, status, gross to net | Reads Person, posts to Finance |
| SalaryAdvance | Payroll, tracked as a receivable in Finance | amount, repayment plan | Linked to Person |
| CommissionRecord | Commission Engine | deal, rep, amount, status | Linked to Deal and Person, paid through Payroll |

## 14. Security, permissions, and NDPR
| Data category | Sensitivity | Who can view unmasked | Logged on view |
|---|---|---|---|
| Bank account numbers | Highest | Finance Admin, HR Admin | Yes |
| Guarantor contact details | Highest | HR Admin | Yes |
| Salary structure | High | HR Admin, Payroll Admin, Finance Admin | Yes |
| Invoice and client financial data | Moderate | Finance Admin, Finance Viewer (read-only) | No |
| Leave and expense claims | Low | Employee, manager, HR Admin | No |

All sensitive fields above use field-level encryption at rest. Every change to a salary structure, bank account, or guarantor record writes an immutable audit row recording who, what, when, and the before and after. Module access itself is granted in exactly one place (Section 3.2), so a permissions audit only ever needs to check one table, not four.

Reminder on scope: no field for an employee's BVN exists in this product. Any future request to add one should be treated as a deliberate scope change requiring sign-off, not a routine field addition.

## 15. NRS and e-invoicing readiness
Nexoris Technologies does not need to be live on the Nigeria Revenue Service's e-invoicing system (NRS-MBS) today, but Covyvo is already being designed around it, so Finance uses the same data shape rather than a second one. A few nullable fields sit quietly on the invoice from day one, doing nothing until switched on: an Invoice Reference Number (IRN), a QR code placeholder on the invoice PDF, TIN fields on both company and client, and an NRS submission status field (Not Applicable, Pending, Submitted, Acknowledged). Turning on NRS compliance later becomes a matter of building the submission call and flipping a feature flag, not restructuring the invoice table.

## 16. Quality assurance and definition of done

### 16.1 Tests
- A person can be created in exactly one place, HR, and no other module's API accepts a person-creation payload.
- An HR exit action revokes every module access grant within the same request, with no module left holding stale access.
- CRM's document engine has no invoice template available, and Finance is the only module capable of generating one.
- Every CRM dashboard showing deal value reads "Sales Won Value," never "Revenue." Every Finance dashboard reads "Recognized Revenue" or "Collected Revenue."
- CRM's displayed commission figures match the Commission Engine's figures exactly, with no independent CRM calculation path.
- A payroll acceptance test: every worker type and deduction toggle combination produces the correct gross-to-net calculation against a hand-verified reference set, including the current Nigeria Tax Act 2025 bands.
- A reconciliation test: every disbursed pay run posts the correct salary expense and liability lines into Finance.
- An invoice test: a three-milestone payment schedule produces three correctly tagged invoices, and a partial payment against any one leaves the correct outstanding balance.
- A masking test: bank account numbers and guarantor data render masked by default in every screen and every export, with no value reachable through an API response a lower-privilege role can read.
- A scope test confirming no BVN field exists anywhere in the schema, the UI, or any export.
- A currency test: a subscription expense logged in USD captures the exchange rate at the date charged and computes the correct NGN equivalent.
- House-rule checks (no em dash, no buzzwords, no AI tell) apply to every payslip, invoice, and AI-drafted message this platform produces.

### 16.2 Definition of done
This work is complete only when searching the codebase for a second person-creation form, a second PDF rendering implementation, a second tax calculation, or a second audit log table returns nothing.

## 17. Delivery plan and build sequence
Build in this order. Doing it out of order creates a gap where, for example, the old way of adding a salesperson is removed before HR can create a person yet.
1. The shell's access model first. The Person table in HR and the ModuleAccessGrant table in the shell, since every other module's permission logic depends on this existing first.
2. HR, including the Candidate and Recruitment pipeline.
3. The shared Document Engine and Tax Engine, built once, before Finance or Payroll need either.
4. CRM, built against the model in Section 5 from the start: the Sales Rep Profile, the four document template types, the relabeled dashboards.
5. Finance, including the Deal-to-Engagement contract wired to CRM's won-deal handover checklist.
6. Payroll, including the Payroll-to-Finance posting bridge.
7. The Commission Engine, wired to CRM, HR, and Payroll.
8. The Action Center, deterministic reminders first, AI features second.
9. Full QA pass against Section 16, including a manual walkthrough of one person's full lifecycle.

## 18. Migration note
If any salesperson records already exist in a live or partially built CRM under an older model, they must be reconciled into HR as proper Person records before the access model in Section 3 goes live, with their existing CRM activity history, leads, and deals re-linked to the new HR-backed Person rather than recreated. This is a one-time step, run early in Stage 1 of Section 17, before any old CRM form is removed.

## 19. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Nigeria Tax Act 2025 guidance is still being issued by regulators | The rate table in the Tax Engine carries an effective date and a last-verified timestamp. Verify against the official First Schedule before the first live payroll run. |
| Withholding tax applied incorrectly to foreign SaaS subscriptions | Subscriptions are explicitly excluded from the WHT flag logic. Only local, Nigerian-sourced service payments carry the flag. |
| Commission paid on revenue that is never collected | Commission is payable only when the linked invoice is paid, not when the deal is marked Won. |
| Sensitive employee or guarantor data exposed through an export or a lower-privilege screen | Masking is enforced at the API layer, not only the UI, so no export or alternate view can bypass it. |
| A pay run disbursed with an entry error | An anomaly check flags unusual net pay movement before approval. A closed run can only be corrected through a logged adjustment in the next run, never a silent edit. |
| A retainer invoice missed due to a manual process | The retainer billing engine auto-generates the invoice on the billing day, removing the manual step. |
| Existing CRM data references a person by name rather than a stable HR identifier | The migration in Section 18 runs before any old form is removed, re-linking by name match with manual review for anything ambiguous. |
| A future contributor reintroduces a duplicate person-creation flow, a second document renderer, or a BVN field | The tests in Section 16.1 are written to fail the build if any of these reappear. |

## 20. Out of scope for this phase
- Live payment provider integration for payroll disbursement. Disbursement ships as a bank transfer file in this phase.
- NRS e-invoicing submission itself. This phase only prepares the data shape (Section 15).
- Group life insurance administration and the Industrial Training Fund contribution, both employer-cost items that can be added as additional Finance expense categories without changing this architecture.
- A dedicated vendor management system. Nexoris Technologies' spend pattern is subscriptions, not vendors, and the one-off expense entry in Section 6.5 covers the rare exception.
- Collection or storage of employee BVN, under any circumstance, in any module.

*End of document.*
