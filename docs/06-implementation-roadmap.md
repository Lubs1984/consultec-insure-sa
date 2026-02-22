# Implementation Roadmap

**Project:** InsureConsultec — SA Insurance Agent Lifecycle SaaS
**Stack:** Node.js/Fastify/TypeScript · React/Vite/TypeScript · PostgreSQL · Railway
**Date:** February 2026

---

## Overview

The roadmap is structured into **4 phases**. Each phase delivers a shippable increment — tenants can onboard and generate value at the end of every phase. Phases are sequential; each builds on the previous foundation.

| Phase | Name | Duration | Deliverable |
|---|---|---|---|
| 0 | Foundation | 3 weeks | Monorepo, CI/CD, DB, Auth, multi-tenancy |
| 1 | Core CRM & Policies | 6 weeks | Clients, leads, policies, basic compliance |
| 2 | Deep Compliance & Commission | 5 weeks | FNA, ROA, RPAR, commission clawback, document vault |
| 3 | Claims, Agents, Reporting | 4 weeks | Full claims, agent lifecycle, reports hub |
| 4 | Automation & Notifications | 3 weeks | Workflow engine, scheduled jobs, notifications |

**Total estimated build time:** ~21 weeks (5 months) for v1 full scope

---

## Phase 0 — Foundation (Weeks 1–3)

**Goal:** A deployed, authenticated, multi-tenant skeleton that all future modules plug into.

### Sprint 0.1 — Monorepo & Infrastructure (Week 1)

#### Tasks

- [ ] **Initialise monorepo**
  - `pnpm init` at root; configure `pnpm-workspace.yaml`
  - Create `apps/api`, `apps/web`, `packages/shared`
  - Each with own `package.json` and `tsconfig.json`
  - Root `tsconfig.json` with path aliases: `@insureconsultec/shared`

- [ ] **Configure Railway project**
  - Create Railway project: `insureconsultec`
  - Add services: `web`, `api`, `worker`, `db` (PostgreSQL), `redis`
  - Create `staging` and `production` environments
  - Set up Railway-managed PostgreSQL 16
  - Configure `railway.toml` for all services

- [ ] **API scaffold — Fastify**
  - Install: `fastify`, `@fastify/jwt`, `@fastify/cookie`, `@fastify/cors`, `@fastify/multipart`, `@fastify/helmet`, `@fastify/rate-limit`
  - `server.ts`: register plugins, health routes
  - Error handler plugin — standard error response format
  - Request ID plugin
  - Logger (Pino — bundled with Fastify)
  - Environment config module (`dotenv` + typed config object)

- [ ] **Frontend scaffold — Vite/React**
  - `pnpm create vite@latest web --template react-ts`
  - Install: `tailwindcss`, `shadcn-ui`, `@tanstack/react-router`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `lucide-react`
  - Configure TanStack Router (file-based routing)
  - Configure Tailwind + shadcn/ui base theme
  - App shell layout (topbar, sidebar, content area)

- [ ] **Shared package**
  - Zod schemas for all enums
  - SA utility functions: ID number validator (Luhn), ZAR formatter, SAST date formatter
  - Shared TypeScript types (User, Tenant, ApiResponse wrappers)

- [ ] **GitHub repository**
  - Create repo, configure branch protection on `main`
  - GitHub Actions CI: lint + test on PRs
  - Railway ↔ GitHub integration: auto-deploy `main` to prod, `develop` to staging

---

### Sprint 0.2 — Database & Multi-Tenancy (Week 2)

#### Tasks

- [ ] **Prisma setup**
  - Install Prisma 6, initialise schema
  - Configure `DATABASE_URL` and `DIRECT_URL` for Railway
  - `schema.prisma`: define all enums (20+ PostgreSQL enums)
  - Enable `uuid-ossp` and `pg_trgm` extensions

- [ ] **Database migrations — Core tables**
  - `tenants` table
  - `users` table
  - `audit_logs` table
  - Enable Row-Level Security on `tenants`, `users`
  - Create `app_user` PostgreSQL role for API connections
  - RLS policies: `tenant_id = current_setting('app.current_tenant_id')::uuid`

- [ ] **Tenant middleware**
  - Fastify `onRequest` hook: parse JWT → extract `tenant_id`
  - Set `SET LOCAL app.current_tenant_id = '...'` before every Prisma query
  - Prisma middleware / `$extends` to auto-set and verify tenant context

- [ ] **Audit log trigger**
  - PostgreSQL function `audit_trigger()` — captures `OLD`/`NEW` rows to `audit_logs`
  - Apply trigger to `tenants`, `users` tables
  - GRANT: no UPDATE or DELETE on `audit_logs` for `app_user`

---

### Sprint 0.3 — Authentication (Week 3)

#### Tasks

- [ ] **Auth module — API**
  - `POST /auth/register-tenant` → create tenant + owner user atomically
  - `POST /auth/login` → bcrypt verify → issue JWT pair
  - `POST /auth/refresh` → rotate refresh token
  - `POST /auth/logout` → clear cookie
  - `POST /auth/forgot-password` → generate reset token, send via SendGrid
  - `POST /auth/reset-password` → validate token, update hash
  - `GET /auth/me` → return user + tenant context

- [ ] **RBAC middleware**
  - `requireAuth` hook — validates JWT on every protected route
  - `requireRole(...roles)` factory — checks role claim
  - `requireTenantAccess` — validates `tenant_id` claim matches request
  - `requireOwnResource` — for agent accessing only own records

- [ ] **Auth frontend**
  - Login page (email + password form)
  - Register page (tenant + owner signup)
  - Forgot/reset password pages
  - Auth Zustand store: `{ user, accessToken, login, logout }`
  - TanStack Query: auto-refresh token on 401
  - Protected route wrapper (redirect to `/login` if unauthenticated)
  - Role-gated component wrapper (`<CanAccess roles={['fsp_owner']}/>`)

- [ ] **User management (tenant settings)**
  - `GET /tenants/me/users` — list users
  - `POST /tenants/me/users/invite` — send invite email
  - `PATCH /tenants/me/users/:id` — change role / deactivate
  - Settings → Users page in frontend

- [ ] **Tests**
  - Unit: JWT signing/verification, bcrypt helpers
  - Integration: full auth flow (register, login, refresh, logout)
  - E2E (Playwright): login flow, role-based route protection

**Phase 0 Exit Criteria:**
- ✅ Monorepo builds without errors
- ✅ Railway staging deployed (API health check passes)
- ✅ PostgreSQL RLS verified: query with wrong tenant_id returns 0 rows
- ✅ User can register tenant, log in, and see authenticated dashboard shell
- ✅ Role-based access: agent cannot access `/agents` list (FO/KI only)

---

## Phase 1 — Core CRM & Policies (Weeks 4–9)

**Goal:** Fully operational CRM with lead pipeline, client management, and policy lifecycle.

### Sprint 1.1 — Clients & Leads (Weeks 4–5)

#### Tasks

- [ ] **Database migrations**
  - `clients`, `dependants`, `fica_profiles`
  - `leads`, `lead_activities`
  - Audit triggers on `clients`, `leads`
  - Indexes: `id_number`, `tenant+agent`, GIN full-text on names

- [ ] **Client API — full CRUD**
  - `GET /clients` — paginated, filterable, role-scoped
  - `POST /clients` — with POPIA consent capture
  - `GET /clients/:id`
  - `PATCH /clients/:id`
  - `DELETE /clients/:id` (soft delete)
  - `PATCH /clients/:id/assign`
  - `POST /clients/:id/consent`
  - `GET /clients/:id/fica` + `PATCH`
  - `GET /clients/:id/dependants` + CRUD

- [ ] **Leads API — full CRUD + pipeline**
  - Full CRUD + `PATCH /leads/:id/status` with state machine validation
  - `POST /leads/:id/convert` — promote to client
  - `POST /leads/:id/activities` — log touchpoints
  - `PATCH /leads/:id/assign`

- [ ] **Clients frontend**
  - Client list with search, filter, pagination
  - Client 360 tabbed view (Overview, FICA, Dependants, Documents)
  - New client form with ID validation, POPIA consent required
  - Client header component (used across all sub-pages)

- [ ] **Leads frontend**
  - Kanban pipeline board (drag-and-drop between stages)
  - List view toggle
  - Lead detail drawer/page — activity log, quick actions
  - New lead form with POPIA consent
  - Convert lead to client flow

---

### Sprint 1.2 — Quotes & Policies (Weeks 6–7)

#### Tasks

- [ ] **Database migrations**
  - `quotes`, `policies`, `beneficiaries`, `policy_endorsements`
  - `needs_analyses` (stub — full FNA in Phase 2)
  - Audit triggers on `policies`
  - Covering indexes on `policies.status`, `renewal_date`, `clawback_watch_expires`

- [ ] **Quote API**
  - Full CRUD + status transitions
  - `GET /clients/:id/quotes`

- [ ] **Policy API**
  - Full CRUD
  - `PATCH /policies/:id/status` — state machine enforced
  - Beneficiaries CRUD
  - Endorsements CRUD
  - `POST /policies/:id/lapse` — debit failure recorder
  - `POST /policies/:id/cancel`
  - `POST /policies/:id/reinstate`
  - `GET /policies/renewals-due`
  - `GET /policies/lapse-risk`

- [ ] **Quotes frontend**
  - Quote list with insurer/product/status filters
  - New quote form
  - Quote comparison view (side-by-side, same client)

- [ ] **Policies frontend**
  - Policy list with product category + status filters
  - Policy detail view — all data, status badge, beneficiaries, endorsements tab
  - New policy wizard (linked to existing quote, or manual)
  - Status transition buttons with confirmation modals
  - Beneficiary manager (add/edit/remove with % allocation validator that sums to 100%)
  - Endorsement form + history timeline
  - Renewals due list (agent dashboard widget)
  - Clawback watch indicator on policy detail

---

### Sprint 1.3 — Document Vault & Basic FICA (Weeks 8–9)

#### Tasks

- [ ] **Database migrations**
  - `documents` table
  - Retention logic: `retain_until`, `expires_at` fields

- [ ] **Storage (Cloudflare R2)**
  - R2 bucket setup (`insureconsultec-documents-staging`, `insureconsultec-documents-prod`)
  - Storage service wrapper: `uploadFile`, `getPresignedDownloadUrl`, `deleteFile`
  - File path strategy: `{tenant_id}/{entity_type}/{entity_id}/{category}/{filename}`

- [ ] **Documents API**
  - `POST /documents/upload` — multipart, R2 upload, virus scan flag
  - `GET /documents/:id` + `GET /documents/:id/download` (pre-signed URL)
  - `DELETE /documents/:id` — check retention before allowing
  - `GET /documents` — list by category/entity

- [ ] **FICA module — API**
  - `GET /clients/:id/fica` — full CDD profile
  - `PATCH /clients/:id/fica` — update status, risk rating, PEP flag, verification confirmations
  - POA expiry calculation + `poa_refresh_due` auto-set
  - goAML referral flag endpoint

- [ ] **Documents frontend**
  - Document upload component (drag-and-drop, category picker, expiry date)
  - Document list grid per entity (client/agent/policy)
  - Download action (pre-signed URL)
  - Expiry indicator (green/amber/red based on days remaining)

- [ ] **FICA frontend**
  - FICA tab in client 360 view
  - CDD status widget with visual progress steps
  - Document upload slots for ID and POA with verification buttons
  - PEP screening flag toggle
  - Risk rating selector

**Phase 1 Exit Criteria:**
- ✅ Create client with consent, assign to agent, link dependants
- ✅ Lead progresses from New to Won, converts to client
- ✅ Policy created, transitioned through statuses to Active
- ✅ Lapse → reinstate workflow works end-to-end
- ✅ Documents upload to R2, download via pre-signed URL
- ✅ FICA profile tracked, POA expiry calculated
- ✅ Agent can only see their own clients/leads/policies; FO sees all

---

## Phase 2 — Deep Compliance & Commission (Weeks 10–14)

**Goal:** Full FAIS compliance module (FNA, ROA, RPAR), commission engine with clawback.

### Sprint 2.1 — Financial Needs Analysis (Week 10)

#### Tasks

- [ ] **Database migration** — `needs_analyses` (all fields per schema)
- [ ] **FNA API** — full CRUD, `POST /needs-analyses/:id/complete`, PDF generation
- [ ] **PDF service** — `@react-pdf/renderer` server-side, `FNAReport.tsx` template
- [ ] **FNA frontend** — 7-step wizard, gap analysis engine (formula implementation), autosave, Generate PDF button

---

### Sprint 2.2 — Record of Advice (ROA) Builder (Weeks 11–12)

#### Tasks

- [ ] **Database migrations** — `records_of_advice`, `replacement_advice_records`
- [ ] **ROA API**
  - Full CRUD + status machine (`draft → complete → signed_client → signed_agent → filed`)
  - `POST /roas/:id/file` — validates all required fields, timestamped, `retain_until = NOW() + 5 years`
  - `GET /roas/:id/pdf` — `ROADocument.tsx` PDF template
  - `POST /roas/:id/review` — KI/CO review
- [ ] **RPAR API** — full CRUD, linked to ROA, separate PDF template
- [ ] **5-year retention engine**
  - `documents.deleted_at` blocked if `retain_until > NOW()`
  - Same for `records_of_advice`, `replacement_advice_records`
  - API returns `RetentionViolationError` with explanation
- [ ] **ROA frontend**
  - 6-section guided builder with completeness indicator
  - Pre-fill from linked FNA
  - In-app signature capture (canvas)
  - Status progression bar
  - Compliance warning banner on policy detail when ROA not filed
- [ ] **RPAR frontend** — two-column comparison layout (existing vs. proposed)
- [ ] **Policy–ROA link** — policy detail shows ROA status; quick-link to completion
- [ ] **ROA list (compliance view)** — filterable by status, overdue indicator

---

### Sprint 2.3 — Commission Engine (Weeks 13–14)

#### Tasks

- [ ] **Database migrations** — `commissions`, `commission_statements`, `commission_structures`
- [ ] **Commission API**
  - `GET /commissions` + summary
  - `POST /commission-statements` — CSV import (Papa Parse)
  - Commission reconciliation logic
  - `GET /commissions/clawback-watch`
- [ ] **Clawback engine**
  - On policy creation (life products): auto-set `clawback_watch_active = true`, `clawback_watch_expires = commencement_date + 730 days`
  - Clawback calculation service: `calculateClawback(policy, lapseDate)` → returns amount
  - Triggered on `lapse` / `cancel` events within watch period
  - Commission structure definition per product category
- [ ] **Commission frontend**
  - Commission dashboard: earnings chart (monthly), breakdown by product category
  - Statement import page (CSV upload + row-by-row review)
  - Clawback watch list: policies at risk, countdown to safety
  - FSP-level vs. agent-level view toggle

**Phase 2 Exit Criteria:**
- ✅ FNA wizard complete with gap analysis output and PDF
- ✅ ROA created from FNA, fully signed, filed with 5-year retention
- ✅ RPAR created for replacement scenario — both policies linked
- ✅ Deletion blocked on ROA within retention period
- ✅ Commission statement imported from CSV, auto-reconciled
- ✅ Clawback calculated correctly on Year 1 lapse (100%), Year 2 lapse (50%)
- ✅ Compliance officer sees ROA compliance dashboard with accurate %

---

## Phase 3 — Claims, Agent Lifecycle & Reporting (Weeks 15–18)

**Goal:** Complete claims management, full agent onboarding lifecycle, and reporting hub.

### Sprint 3.1 — Claims Management (Week 15)

#### Tasks

- [ ] **Database migration** — `claims` table
- [ ] **Claims API** — full CRUD + status machine, document checklist, Ombud escalation, outcome recording
- [ ] **Claims frontend**
  - FNOL intake form (claim type selector drives required fields)
  - Document checklist with per-item upload + status
  - Status timeline (visual, with dates)
  - Ombud escalation form + 3-year limitation countdown
  - Claims list with status-grouped view

---

### Sprint 3.2 — Agent Lifecycle (Weeks 16–17)

#### Tasks

- [ ] **Database migration** — `agents`, `cpd_activities`
- [ ] **Agents API** — full CRUD, status machine, CPD CRUD, debarment workflow, FSCA register export
- [ ] **CPD tracking API** — log activities, annual target calculation, compliance status
- [ ] **Agents frontend**
  - Agent onboarding tracker (progress steps visualisation)
  - Agent profile with compliance checklist tabs: RE Exams, SAPS Clearance, CPD, Appointment
  - Agent list (FO/KI) with status badges and CPD progress bars
  - CPD log: activity entries, annual progress doughnut chart
  - Debarment initiation workflow (confirmation + reason + document)
  - FSCA representative register download button

---

### Sprint 3.3 — Reports Hub (Week 18)

#### Tasks

- [ ] **Reports API** — all 11 reports (book of business, agent performance, renewal pipeline, lapse, claims, commission reconciliation, POPIA log, FSCA register)
- [ ] **CSV + PDF export** for all reports
- [ ] **Reports frontend**
  - Reports hub with category grouping
  - Each report: date range picker, agent filter, format selector (JSON/CSV/PDF)
  - Preview table before export
  - Scheduled report configuration (Phase 2 future)

**Phase 3 Exit Criteria:**
- ✅ Claims logged from FNOL to outcome, document checklist tracked
- ✅ Ombud escalation with 3-year limitation visible and alerted
- ✅ Agent onboarded through all 6 stages with document uploads
- ✅ CPD hours tracked, annual target progress visible
- ✅ FSCA representative register export generated correctly
- ✅ Book of business report exports all active clients + policies as CSV/PDF

---

## Phase 4 — Automation & Notifications (Weeks 19–21)

**Goal:** Background workflow engine, automated compliance monitoring, notifications.

### Sprint 4.1 — Workflow Engine & Scheduled Jobs (Weeks 19–20)

#### Tasks

- [ ] **BullMQ setup**
  - Queue definitions: `renewals`, `lapse-risk`, `compliance`, `notifications`, `pdf`, `clawback`
  - Worker process (`apps/api/src/workers/`)
  - Railway worker service deployment config

- [ ] **Scheduled jobs (cron)**
  - `renewal-scan`: daily 06:00 → find short-term policies due in 60 days → create tasks for agents
  - `lapse-risk-scan`: every 4h → find policies with `debit_order_failure_count > 0` within grace period → alert agents
  - `grace-period-scan`: daily → find lapsed grace periods expired → trigger lapse event
  - `cpd-compliance-scan`: weekly Monday → check all agents' CPD progress → flag at-risk agents
  - `fica-expiry-scan`: daily → find `poa_refresh_due < NOW() + 10 days` → create FICA refresh task
  - `roa-compliance-scan`: daily 08:00 → find active policies older than 7 days with no filed ROA → compliance alert
  - `clawback-expiry-scan`: daily → find `clawback_watch_expires < NOW() + 7 days` → notify agent
  - `medical-aid-enrolment`: 1 Oct → find all clients with medical aid policies → send open enrolment alert
  - `fsca-licence-check`: monthly → check tenant licence expiry within 90 days → alert FSP owner + CO

- [ ] **Task auto-creation**
  - Renewal scan creates `{type: 'renewal_review', policy_id, due_date: renewal_date - 30d}` task
  - Lapse risk creates `{type: 'lapse_prevention', policy_id, priority: 'high'}` task
  - Tasks assigned to policy's agent

---

### Sprint 4.2 — Notification Service (Week 21)

#### Tasks

- [ ] **Notification API** — list, mark read, preferences
- [ ] **Email templates (SendGrid)**
  - Renewal due notice
  - Lapse risk warning
  - CPD hours shortfall
  - FICA document expiry
  - ROA overdue (compliance alert)
  - Claim status update
  - Password reset
  - User invite
  - Welcome (tenant registration)
  - All templates branded with FSP logo and colours

- [ ] **SMS integration (Africa's Talking)**
  - Claim status update (to client)
  - Lapse risk (to agent — short format)
  - Payment reminder (to client)

- [ ] **In-app notifications**
  - Notification bell + dropdown (real-time via polling every 30s, WebSocket in v2)
  - `/notifications` full page

- [ ] **Notification preference management**
  - Per-user: toggle email/SMS/in-app per notification type
  - Tenant-level defaults

**Phase 4 Exit Criteria:**
- ✅ Renewal task automatically created 60 days before short-term renewal
- ✅ Lapse risk alert fires within 4 hours of debit order failure
- ✅ CPD alert fires at Q3 if hours below target
- ✅ Email delivered to correct agent with correct FSP branding
- ✅ SMS delivered to SA local number via Africa's Talking
- ✅ In-app notification bell shows unread count instantly
- ✅ Notification preferences respected (opt-out of SMS → no SMS sent)

---

## Testing Strategy

### Unit Tests
- All state machine transition validators
- Clawback calculation function (boundary cases: day 365, 366, 730, 731)
- ID number validator (Luhn + DOB extraction)
- Commission calculation (initial, renewal, broker fee cap)
- FAIS 5-year retention blocker
- FNA gap analysis formula

### Integration Tests (API — Jest + Supertest)
- Full auth flow
- Lead → Client conversion
- Quote → Policy creation
- Policy status machine (all valid transitions, all invalid transitions rejected)
- ROA filed → retention block on delete
- Commission import + clawback trigger
- Role access control (agent cannot access other tenant's data)
- RLS verification at PostgreSQL level

### E2E Tests (Playwright)
- New tenant registration → first client created
- Lead pipeline: new to won, convert to client
- Full FNA → quote → policy → ROA → filed flow
- Policy replacement with RPAR generation
- FNOL → claim to outcome
- Agent onboarding: recruiting → active
- Commission CSV import

### Load Testing (k6)
- `/clients` list with 10,000 clients: p95 < 300ms
- `/policies` list with 50,000 policies: p95 < 500ms
- Concurrent tenant requests: 50 tenants, 20 RPS each — no cross-tenant leakage

---
## Phase 5 — CRM & Accounting (Weeks 22–30)

**Goal:** Full Bitrix-like CRM with multi-pipeline Kanban, and a complete double-entry accounting system from invoice through to trial balance and management accounts.

---

### Sprint 5.1 — CRM Core Infrastructure (Weeks 22–23)

#### Tasks

- [ ] **Database migrations** — `crm_pipelines`, `crm_stages`, `crm_organizations`, `crm_contacts`, `crm_deals`, `crm_deal_contacts`, `crm_activities`, `crm_automation_rules`
- [ ] **RLS policies** — apply tenant isolation to all CRM tables
- [ ] **CRM seed data** — default pipeline ("New Business") with 5 stages pre-seeded on tenant creation
- [ ] **Pipeline & Stage API** — full CRUD, stage reorder endpoint, WIP limit enforcement
- [ ] **Contacts API** — full CRUD, search (name, email, phone), tag management, soft delete
- [ ] **Organisations API** — full CRUD, contacts sub-list
- [ ] **Contacts ↔ Clients link** — `client_id` FK on `crm_contacts`; sync display name/email on conversion
- [ ] **Convert contact → client endpoint** — `POST /crm/contacts/:id/convert`; returns created `client_id`

---

### Sprint 5.2 — CRM Deals & Kanban (Weeks 24–25)

#### Tasks

- [ ] **Deals API** — full CRUD; `PATCH /crm/deals/:id/stage` with required-field validation; `GET /crm/deals/board` (grouped by stage)
- [ ] **Stuck deal detection** — BullMQ daily job: set `stuck_since` on deals with no activity > `stuck_threshold_days`; clear `stuck_since` on new activity
- [ ] **CRM frontend — Kanban board**
  - Pipeline selector (multi-pipeline)
  - Drag-and-drop columns (`@dnd-kit/core`)
  - Card component: title, value, assignee avatar, close date, stuck badge, task count
  - Stage entry rule enforcement (required fields modal before move)
  - WIP limit warning toast
  - Toggle: Kanban / Table view
- [ ] **CRM frontend — Deal detail side panel**
  - Linked contacts section
  - Linked insurance records (client, quote, policy)
  - Quick-edit deal fields (inline editing)
- [ ] **CRM frontend — Contact detail** — timeline view (activities + emails + notes)
- [ ] **CRM frontend — Organisation detail** — contact list + deal list
- [ ] **CRM frontend — Contact list** — filterable, bulk tag, bulk assign, bulk export

---

### Sprint 5.3 — CRM Activities & Automation (Week 26)

#### Tasks

- [ ] **Activities API** — full CRUD; calendar endpoint (`?from=&to=`); complete endpoint
- [ ] **Automation rules engine** — BullMQ processor for `deal_idle` trigger; synchronous hook on `stage_entered`/`stage_exited`/`deal_created`/`deal_won`/`deal_lost`
- [ ] **Automation rules API** — full CRUD + toggle active
- [ ] **CRM frontend — Activity calendar** — monthly/weekly view using `react-big-calendar` or similar; add activity modal
- [ ] **CRM frontend — Activity list** — filterable by type, assigned_to, due_date, is_done; bulk complete
- [ ] **CRM frontend — Automation rules builder** — trigger selector → action selector → config form → test rule
- [ ] **Renewal pipeline auto-populate** — notification engine job creates deal in "Renewals" pipeline when policy hits 60-day renewal window
- [ ] **CRM settings page** — pipeline/stage CRUD; custom field builder (JSONB)
- [ ] **Email compose from contact** — SendGrid integration; email logged as activity on send

---

### Sprint 5.4 — Accounting Core (Weeks 27–28)

#### Tasks

- [ ] **Database migrations** — `financial_years`, `chart_of_accounts`, `bank_accounts`, `acc_invoices`, `acc_invoice_line_items`, `acc_payments`, `acc_payment_allocations`, `acc_expense_claims`, `acc_expense_line_items`, `bank_transactions`, `bank_reconciliations`, `journal_entries`, `journal_entry_lines`
- [ ] **RLS policies** — tenant isolation on all accounting tables
- [ ] **SA COA seed** — standard SA chart of accounts template (1000-series assets, 2000-liability, 3000-equity, 4000-revenue, 5000-expense) seeded on `POST /accounting/accounts/seed`
- [ ] **Chart of Accounts API** — full CRUD, tree structure, deactivate with no-transactions guard
- [ ] **Financial Years API** — CRUD; close year endpoint (locks all posted journals in year)
- [ ] **Bank Accounts API** — CRUD; opening balance; linked COA account
- [ ] **Invoicing API**
  - Full CRUD with line item management
  - VAT calculation service: `calculateLineVat(quantity, unitPrice, discountPct, vatRate, vatCategory)` → returns `{ lineAmount, vatAmount, totalAmount }`
  - Invoice totals auto-computed on any line item mutation
  - `POST /accounting/invoices/:id/send` — email tax invoice PDF
  - `POST /accounting/invoices/:id/void` — reverses associated journals
  - `POST /accounting/invoices/:id/credit-note` — creates linked credit note + reversal journal
  - Invoice PDF template (`TaxInvoicePDF.tsx`) — SARS-compliant layout (supplier name, VAT no, invoice date, line items, VAT split, totals)
- [ ] **Commission → accounting integration** — when commission marked `received`, auto-generate journal: DR Bank, CR Commission Income
- [ ] **Clawback → accounting integration** — when clawback triggered, auto-generate journal: DR Clawback Expense, CR Accounts Receivable (insurer)

---

### Sprint 5.5 — Accounting Payments, Bank & Journals (Week 29)

#### Tasks

- [ ] **Payments API** — record payment (received/made); allocate to invoices; partial payment; auto-update invoice `amount_paid` and `status`
- [ ] **Bank transactions API** — manual entry; CSV import (detect SA bank formats: FNB, ABSA, Standard Bank, Nedbank, Capitec column layouts); auto-match transactions to unallocated payments by amount + date proximity
- [ ] **Bank reconciliation API** — start/lock reconciliation; mark transactions as reconciled; compute difference
- [ ] **Journal entries API** — full CRUD; post endpoint (validates `SUM(debit) = SUM(credit)`, throws `UnbalancedJournalError` otherwise); reverse endpoint (creates equal-and-opposite reversal journal)
- [ ] **System journal generation** — shared `JournalService.create()` called by invoice, payment, clawback, commission integrations
- [ ] **Expense claims API** — full CRUD; submit / approve / reject; payment link; receipt document upload
- [ ] **Accounting frontend — Invoice builder wizard** (3 steps: bill-to, line items, preview/send)
- [ ] **Accounting frontend — Invoice list** — filter by status, client, date; aged receivables colour coding (0–30d, 31–60d, 61–90d, >90d)
- [ ] **Accounting frontend — Payment allocation UI** — payment detail page shows unallocated amount; allocate to invoices by checkbox + partial amount input
- [ ] **Accounting frontend — Bank account / transaction view** — paginated transaction list; reconciliation mode (checkbox each matched item; running difference shown)
- [ ] **Accounting frontend — Journal entry builder** — debit/credit line pairs; balanced indicator; post button (disabled if unbalanced)

---

### Sprint 5.6 — Accounting Reports & COA UI (Week 30)

#### Tasks

- [ ] **General Ledger report** — `GET /accounting/reports/general-ledger?account_id=&date_from=&date_to=` — shows all journal lines for an account with running balance
- [ ] **Trial balance report** — `GET /accounting/reports/trial-balance` — debit/credit per account for period; balanced check
- [ ] **P&L report** — revenue accounts vs. expense accounts; gross profit line; net profit line; comparison period support
- [ ] **Balance sheet report** — assets vs. (liabilities + equity) at a point in time; auto-calculates retained earnings as `Revenue - Expenses` for the period
- [ ] **VAT report** — output tax (from sales invoices, standard-rated lines) vs. input tax (from supplier invoices); net VAT payable; maps columns to SARS VAT201 form labels
- [ ] **All reports export** — CSV, PDF; PDF uses `@react-pdf/renderer` financials template
- [ ] **Accounting frontend — COA tree view** — account hierarchy; inline add/edit; seed SA template button (with confirmation: overwrites existing?)
- [ ] **Accounting frontend — Reports hub** — filterable by period; report cards linking to each report type
- [ ] **Accounting frontend — Trial balance page** — full account table with debit/credit; balanced indicator; export buttons
- [ ] **Accounting frontend — P&L page** — grouped by revenue / expenses; gross/net profit rows
- [ ] **Accounting frontend — Balance sheet page** — two-column layout (assets | liabilities + equity); total check

---
## Dependencies & External Accounts Required

| Service | Account Required By | Purpose |
|---|---|---|
| Railway | Sprint 0.1 | Hosting (paid plan for production) |
| Cloudflare (R2) | Sprint 1.3 | Document storage |
| SendGrid | Sprint 4.2 | Email notifications |
| Africa's Talking | Sprint 4.2 | SMS (SA market) |
| DocuSign / SignNow | Phase 2 | E-signature for ROA/RPAR |
| GitHub | Sprint 0.1 | Version control + CI/CD |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FAIS regulatory change | Low | High | Compliance module designed for configuration; product team monitors FSCA gazette |
| Insurer API unavailability | High (many have no API) | Low | Manual entry supported for all data; APIs are optional enhancement |
| POPIA audit | Low | High | Consent audit trail, data subject rights workflow, FAIS retention override logic all in place |
| Railway outage | Low | High | Railway SLA + daily DB backups; can migrate to Render/Fly.io with minimal config change |
| Commission clawback calculation error | Medium | High | Dedicated unit test suite with edge cases; clawback formula reviewed against FAIS regulation |
| Cross-tenant data leak | Very Low | Critical | RLS at DB level (not just ORM); integration test verifies RLS independently of application code |
| PDF generation performance | Medium | Low | PDF generation is async (BullMQ) — never blocks user-facing request |

---

## Definition of Done (per task)

A task is "done" when:
1. ✅ Feature implemented and manually tested
2. ✅ Unit/integration tests written and passing
3. ✅ TypeScript strict mode — no `any` types, no type errors
4. ✅ API: Zod validation on all inputs, standard error format on all errors
5. ✅ Frontend: empty state exists, loading state exists, error state exists
6. ✅ FAIS compliance requirement linked (if applicable) — field/feature maps to regulatory obligation
7. ✅ Deployed to staging and smoke-tested
8. ✅ PR reviewed and merged to `develop`
