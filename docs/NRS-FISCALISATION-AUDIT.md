# NRS/MBS Fiscalisation — Phase 1 Audit and Phase 2 Architecture Plan

Read-only audit of what exists today in `apps/admin`, followed by the build plan. No production code was
changed to produce this document.

---

## Part 1 — Audit

### 1.1 The blocking finding: fabricated fiscal data is presented as genuine

`src/lib/einvoice-server.ts` contains `simulateSubmission()`. It invents an IRN, invents a verification
URL at `einvoice.nrs.gov.ng/verify/{irn}`, invents the response text "NRS acknowledged the document", and
returns `accepted: true`. `src/app/api/einvoice/submit/route.ts` writes that straight into the `einvoice`
row as `nrs_status='Accepted'`, `irn`, `qr_data`, `submission_ref` and `si_app_response`.

Nothing is transmitted to the Nigeria Revenue Service. There is no network call anywhere in the path.

The code comments are honest about this ("submission is simulated"), but **no part of it reaches the
user**. On `/e-invoicing/doc/{id}` a document displays:

| Field shown | Value on a real record today |
|---|---|
| NRS | **Accepted** |
| Submission reference | SUB-7236E1750AF5 |
| IRN | DE6B1C1F-B015972C-S |
| SI/APP response | NRS acknowledged the document |
| QR code | rendered |
| Timeline | "Submitted to NRS" |

There were **7** such records in the database: 4 marked Accepted with invented IRNs, 2 marked Rejected
with invented references, and 1 holding an IRN while its status said it had never been submitted. (An
earlier draft of this document said 2 — that count came from a query capped at 2 rows, not from the
data.)

This escapes the building. `src/lib/pdf/einvoice-pdf.tsx` describes itself as "The official NRS
tax-invoice PDF" and embeds the fabricated IRN plus a QR placeholder that is deterministic noise, not a
scannable code. The document page gates delivery on "Only NRS-accepted documents can be issued" — and
simulated documents satisfy that gate, so they can be downloaded and sent to a customer.

The net effect is that the system can hand a customer a document asserting a fiscal identifier that no
tax authority issued, while telling the operator their invoice is compliant. This breaches the
instruction to never invent fiscal identifiers, QR formats or fiscal response fields, and it is the one
item that should be contained before anything new is built.

**Containment — done.** `simulateSubmission()` and the QR placeholder are deleted. Submission now runs
through `lib/fiscal/adapter.ts`, and with no provider configured it fails closed: the document is left
untouched, the attempt count does not move, and a `blocked` event records the refusal. All 7 records were
reset to `NotSubmitted` with fiscal fields cleared, each carrying a `containment` event stating what was
removed and that it had never reached the NRS. The customer-facing PDF no longer draws a QR captioned
"Scan to verify on the NRS portal" over deterministic noise.

### 1.2 There are two invoice systems

| | `invoice` / `invoice_line` | `einvoice` / `einvoice_line` |
|---|---|---|
| Module | Finance | NRS e-Invoicing |
| Rows | 1 | 9 |
| Tax fields | `vat`, `wht_expected` | `vat` only |
| Link | — | `einvoice.finance_invoice_id` (soft, nullable) |

Both have their own create screens (`/finance/invoices/new` and `/e-invoicing/...`), both compute totals,
and neither is authoritative. This already contradicts the rule that the Account Module is the single
source of truth and that no second invoice system may exist. Consolidation is a decision for you, not
something to settle silently — see the open question in 3.1.

### 1.3 Tax rates have no versioning and two homes

`vat_rate` exists on **both** `finance_settings` and `company_settings`, with no rule about which wins.
Hardcoded `7.5` fallbacks appear in `finance/invoice/page.tsx`, `crm/[id]/GenerateDocument.tsx` and
`api/documents/route.ts`.

There is no `effective_from` / `effective_to` anywhere. A rate change today silently rewrites the tax
position of every historic document that recomputes, and there is no way to state "7.5% applied until
date X". Required for reconciliation and for defending a filing.

`invoiceTotals()` in `src/lib/finance.ts` also computes WHT on the full subtotal, while its own comment
says WHT applies to the pre-VAT value **of services**. Non-service lines are currently included.

### 1.4 Financial arithmetic uses floating point

No decimal library is installed. `invoiceTotals()` multiplies and sums JS numbers, patching with a
`round2()` after each step. Storage is correct — every monetary column is `NUMERIC(16,2)` — so only the
compute layer is at fault, but rounding drift is reachable on multi-line documents and would surface as
reconciliation differences against NRS-side totals.

### 1.5 Permissions are coarser than the spec requires

Every e-invoicing route gates on `staff.role === "admin"`, the global base role. The `einvoicing` module
grants (`e-Invoicing Admin`, `e-Invoicing Viewer`) are defined in `shell-constants.ts` but **no route
checks them**, and no user currently holds one. Consequences:

- a person granted `e-Invoicing Admin` cannot actually submit anything;
- any global admin can change fiscal configuration;
- there is no separate `TAX_FISCAL_CONFIG_MANAGE` distinct from invoice permissions.

### 1.6 Credential handling is partly right, and incomplete

Correct today: no secret is stored in the database. `company_settings.nrs_credentials_set` is a boolean
flag only, and the cryptographic key is expected from the environment. That satisfies the rules that the
key is never in the browser, never returned by an API, and never displayed after configuration.

Missing: **there is no Business ID field at all**. Only `nrs_service_id` exists. Business ID and Service
ID must be independently configurable, and the spec is explicit that they must never be assumed equal.

### 1.7 No queue, despite a screen implying one

`/settings/e-invoicing/retry-queue` exists as a screen, but there is no queue, no worker and no
scheduler in the repo. Submission runs inline inside the HTTP request. A slow or failing SI/APP would
block the operator's request and lose the attempt.

### 1.8 What is already right and should be kept

These are sound and the new work should build on them rather than replace them:

- **Three independent statuses** — `lifecycle_status` (commercial), `nrs_status` (tax) and payment — are
  already modelled as orthogonal, with comments stating NRS status may only be set by SI/APP responses.
  That is exactly the right shape.
- **Payment status is derived, never stored** (`paymentStatus()`), matching the rule that `is_fiscalized`
  must be derived. Note there is no `is_fiscalized` boolean column anywhere — good.
- **The server never trusts browser figures.** `api/einvoice/route.ts` recomputes every total from the
  submitted lines against the stored rate.
- **Audit and per-document timeline exist** — `audit_log` is written on submission, and `einvoice_event`
  gives an append-only per-document history feeding the Submission Centre and Integration Monitor.
- **No client-side fiscalisation.** All submission logic is server-side; `einvoice-server.ts` is
  deliberately split from the client-safe `einvoice.ts`. The required Browser → Backend → Service → SI/APP
  direction is respected.
- PDF generation, `nrs_buyer`, `einvoice_delivery`, `einvoice_installment` and the settings screens are
  all in place and reusable.

---

## Part 2 — Architecture Plan

### 2.1 Reuse unchanged

`einvoice` + `einvoice_line` as the fiscal document; the three-status model; `einvoice_event` as the
append-only timeline; `audit_log`; `nrs_buyer`; `einvoice_delivery`; the PDF pipeline; `module_access`
for RBAC; the native-form → route-handler mutation pattern.

### 2.2 Extend

| Component | Change |
|---|---|
| `company_settings` | add `nrs_business_id`, kept independent of `nrs_service_id` |
| `einvoice` | add `tax_rule_id` so each document records which rate version priced it |
| `finance.ts` | move totals onto decimal arithmetic; fix the WHT service-only base |
| e-invoicing routes | gate on the `einvoicing` module grant, not the global admin role |
| `/settings/e-invoicing/tax-config` | becomes the editor for versioned rules, not a read-only mirror |

### 2.3 New database entities

- **`tax_rule`** — `tax_type` (VAT/WHT), `rate NUMERIC(6,3)`, `effective_from`, `effective_to`,
  `jurisdiction`, `created_by`. Resolved by document issue date; never edited in place, superseded.
- **`tax_category`** — per service/product line: standard, zero-rated, exempt. Drives whether a line is
  in the VAT base at all, replacing today's single `vat_applicable` boolean.
- **`fiscal_submission`** — replaces the unused `nrs_submission`. One row per *attempt*, holding request
  digest, provider response, status, error, timing. Never overwritten, so the full attempt history
  survives.
- **`fiscal_config_audit`** — who changed fiscal configuration and when, separate from `audit_log`
  because it is evidence rather than activity.

### 2.4 New services (`src/lib/fiscal/`)

- **`tax-engine.ts`** — resolves the applicable `tax_rule` for a date, computes VAT/WHT per line using
  decimal arithmetic, returns a breakdown with the rule id it used. Pure and unit-testable.
- **`validation.ts`** — pre-submission checks (buyer TIN present, totals positive, line categories
  resolvable). Runs *before* anything is queued so bad documents never consume an attempt.
- **`adapter.ts`** — the `SIAPPAdapter` interface: `submit`, `status`, `cancel`. **The only place a
  provider is spoken to.**
- **`adapters/unconfigured.ts`** — the default. Every method fails closed with "No accredited SI/APP is
  configured." This is what replaces `simulateSubmission()`.
- **`reconciliation.ts`** — compares our accepted documents against provider-reported state and reports
  differences; no writes to fiscal status.

### 2.5 The provider boundary — and what is genuinely blocked

Everything above can be built and tested now. What cannot:

The concrete adapter needs your SI/APP's documentation — its endpoint, authentication scheme, request
and response schemas, IRN format, QR payload specification, and cancellation window. None of that can be
inferred, and inventing it is what produced the problem in 1.1. So `adapter.ts` ships as an interface with
`unconfigured.ts` behind it, and the real adapter is a single file added when the documentation arrives.

This is why fail-closed matters: with no provider, the honest state of every document is "not submitted",
and the system should say so plainly rather than manufacture a reassuring one.

### 2.6 Security model

- Cryptographic key and API secret from environment only; never in the database, never in an API
  response, never logged, never rendered after configuration. Only a boolean "configured" flag is
  readable.
- Business ID and Service ID stored separately and independently editable; neither defaults to the other.
- New `TAX_FISCAL_CONFIG_MANAGE` permission, separate from invoice create/submit, so operating the
  invoice module never implies the right to repoint the fiscal integration.
- `is_fiscalized` stays derived from `nrs_status === 'Accepted'` where Accepted is only ever written from
  a provider response. No boolean column.
- Submission stays server-side; the browser never holds a credential or addresses the SI/APP.

### 2.7 Queue

A `fiscal_submission_job` table plus a worker, rather than a hosted queue — it keeps attempts durable and
auditable in the same database as the evidence, and avoids adding infrastructure. Exponential backoff,
bounded attempts, terminal states surfaced on the existing retry-queue screen, which finally becomes real.

### 2.8 Build order

1. Containment of 1.1 — fail closed, clear the 2 fabricated records.
2. Decimal arithmetic + `tax_rule` / `tax_category` + tax engine, with tests.
3. Permissions: module-grant gating and `TAX_FISCAL_CONFIG_MANAGE`.
4. Business ID configuration.
5. `fiscal_submission` + queue + worker, against the unconfigured adapter.
6. Reconciliation reporting.
7. Real adapter — when SI/APP documentation is available.

### 3.1 Open question for you

**The two invoice systems.** Consolidating `invoice` into `einvoice` is the spec-compliant end state, but
it touches the Finance module's screens and would migrate live rows. I can either fold Finance invoices
into `einvoice` as the single source of truth, or leave Finance as commercial-only and make `einvoice`
authoritative for anything fiscal. The second is smaller and reversible. I will take the second unless you
say otherwise, and I will not migrate any data without asking.

### 3.2 Standing limitation

Compliance cannot be asserted from code. This engine can be correct in its arithmetic, its versioning and
its audit trail, and still require review by a qualified Nigerian tax practitioner and successful
accreditation testing with your chosen SI/APP before any of it is relied on for filing.
