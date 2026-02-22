# Project Scope: SA Insurance Agent Lifecycle SaaS Platform

**Project Codename:** InsureConsultec (working title)
**Date:** February 2026
**Version:** 1.0
**Status:** Scoping & Investigation

---

## 1. Executive Summary

InsureConsultec is a multi-tenant Software-as-a-Service (SaaS) platform that manages the complete lifecycle of a South African insurance agent and their client book. It serves as both a CRM and a compliance management system, covering FAIS Act requirements, POPIA obligations, FICA customer due diligence, and TCF (Treating Customers Fairly) outcomes.

The platform is designed to serve Financial Services Providers (FSPs) of all categories — from sole-operator independent brokers to multi-agent brokerages with compliance officers and key individuals. Each FSP is a tenant with fully isolated data.

**Hosting:** Railway (PostgreSQL, API service, web service, worker service)
**Stack:** Node.js + TypeScript (API) · React + Vite + TypeScript (Frontend) · PostgreSQL (Database)

---

## 2. Business Problem

South African insurance agents and FSPs operate in one of the most heavily regulated financial service environments in the world, governed by:

- **FAIS Act 37 of 2002** — advice standards, representative registers, records of advice
- **POPIA Act 4 of 2013** — client data privacy, consent, breach obligations
- **FICA** — customer due diligence, suspicious transaction reporting
- **Long-Term Insurance Act 52 of 1998** — life, disability, funeral product regulation
- **Short-Term Insurance Act 53 of 1998** — non-life product regulation
- **Medical Schemes Act 131 of 1998** — medical aid broker obligations
- **TCF Framework** — six consumer outcome obligations from the FSCA

Current reality for most brokerages:
- Client records split across spreadsheets, emails, and paper files
- ROAs manually typed in Word documents with no version control
- Commission tracking done manually in Excel with clawback errors
- No centralised compliance monitoring — compliance officers firefighting
- Policy renewals missed due to no automated alerting
- FICA/KYC documents stored inconsistently, no expiry tracking
- Debarment checks not systematically recorded
- Claims assistance untracked — agent involvement not documented

**InsureConsultec solves this** by providing a single, compliant, auditable system of record for the entire insurance agent business lifecycle.

---

## 3. Target Users

| Role | Description | Primary Use Cases |
|---|---|---|
| **FSP Owner / Principal** | FSCA-licenced FSP operator | Business overview, agent management, compliance posture, commission reporting |
| **Key Individual (KI)** | Person managing/overseeing FSP's financial services activities | ROA review, supervised agent oversight, compliance sign-off |
| **Compliance Officer (CO)** | FSCA-approved CO (required if FSP has >1 KI or any reps) | Compliance dashboard, audit prep, complaint log, CPD monitoring |
| **Agent / Representative** | FAIS-appointed representative rendering financial services | CRM, pipeline, FNA, policy management, ROA generation |
| **Assistant** | Admin/support staff | Data entry, document processing, task support |
| **Super Admin** | Platform operator (WeConsult) | Tenant management, billing, system health |

---

## 4. Multi-Tenancy Model

- Every FSP/brokerage is an isolated **tenant**
- All data is segregated at the database level using `tenant_id` on every table
- PostgreSQL Row-Level Security (RLS) enforced at DB layer — no cross-tenant data leakage architecturally possible
- Each tenant has its own FSCA licence details, branding, product authorisations, and user roster
- Subdomain-based routing: `{fsp-slug}.insureconsultec.co.za`
- Platform operator (super admin) manages tenant provisioning, billing, and support access

---

## 5. Module Scope

### 5.1 Module 1 — Platform & Tenant Management

**What it does:**
- Tenant (FSP/brokerage) provisioning and onboarding
- FSP profile: FSCA licence number, category, authorised product subcategories, licence expiry, compliance officer details
- User management: invite, assign roles, deactivate
- Subscription/billing management (integration hook for Stripe)
- Super admin portal: all tenants, usage metrics, support tools

**FAIS compliance link:**
- FSCA licence details visible and tracked with expiry alerts
- FSP category and authorised product subcategories stored — agents can only be assigned to product lines the FSP is licenced for

---

### 5.2 Module 2 — Agent Onboarding & Lifecycle Management

**What it does:**
- Full FAIS-compliant representative onboarding workflow
- Track every agent from recruitment through to active status
- CPD hours tracking with annual target enforcement
- RE5/RE1 exam certificate management
- FSCA representative register generation

**Agent status state machine:**
```
recruiting → background_checks → training → re5_pending → re5_passed
→ appointing → supervised → active → resigned / debarred / transferred
```

**Key fields tracked per agent:**
- Personal details, NQF qualification level, ID, contact
- FSCA debarment register check (date last checked, status)
- SAPS clearance (certificate upload, date, expiry)
- Credit check (date, outcome)
- RE5 exam: pass date, certificate upload
- RE1 exam (if key individual): pass date, certificate upload
- Appointment letter: upload, FSP signatory, effective date
- Supervised period: duration (12/24 months), supervisor assigned, ROA review count, sign-off date
- CPD log: activities, provider, date, hours, certificate, annual target % progress
- Product categories authorised to advise on (must match FSP licence)
- Commission structure assigned

**FAIS compliance link:**
- Section 13: Representative register maintained and exportable
- Section 14: Debarment workflow built-in with procedural fairness steps
- Fit and proper requirements: all components tracked with flags
- CPD: Section 8A compliance — annual hours target enforced with alerts

---

### 5.3 Module 3 — CRM: Lead Pipeline

**What it does:**
- POPIA-compliant lead capture with full consent management
- Visual pipeline (Kanban) with configurable stages
- Activity logging: every touchpoint recorded
- Lead source attribution and conversion tracking

**Lead pipeline stages:**
```
new → contacted → qualified → fna_scheduled → quoted
→ proposal_submitted → awaiting_decision → won → lost → dormant
```

**POPIA compliance:**
- Explicit marketing consent captured at lead creation with opt-in/opt-out record
- Consent version/timestamp stored
- Withdrawal of consent workflow
- Purpose limitation: lead data only used for stated purpose
- Data minimisation: only mandatory fields enforced at capture

---

### 5.4 Module 4 — Client Portfolio Management

**What it does:**
- Master client record — single source of truth
- FICA/CDD module with risk rating and document management
- Dependants and beneficiary management
- Client 360 view: all policies, quotes, ROAs, claims, commissions in one screen
- POPIA data subject rights workflow

**FICA / CDD integration:**
- CDD status workflow: `pending → in_progress → verified → enhanced_due_diligence → failed`
- Document uploads: certified ID (with expiry/re-verification prompt), proof of address (3-month refresh alert)
- PEP (Politically Exposed Person) screening flag
- Risk rating: `standard / high`
- goAML referral flag for suspicious transactions

**POPIA rights:**
- Access request form (agent generates client data report)
- Correction request workflow
- Deletion request — system blocks deletion if FAIS 5-year retention active and notifies reason
- All rights requests logged with dates and outcomes

---

### 5.5 Module 5 — Financial Needs Analysis (FNA)

**What it does:**
- Guided digital FNA wizard — FAIS Code of Conduct mandated pre-advice assessment
- Gap analysis engine comparing existing vs. recommended cover
- FNA PDF report output — branded to FSP
- Feeds directly into ROA generation

**FNA sections:**
1. Financial position (income, assets, liabilities, monthly expenses)
2. Existing cover audit (internal policies + externally held policies)
3. Insurance objectives and needs
4. Risk tolerance assessment
5. Health status summary (for life/disability)
6. Dependants and financial responsibilities
7. Gap analysis — auto-calculated shortfalls by category

**Product categories assessed:**
- Life cover (death benefit)
- Disability (lump sum)
- Income protection (monthly)
- Critical illness / dread disease
- Funeral cover
- Short-term personal lines (motor, home contents, buildings)
- Short-term commercial lines (if applicable)
- Medical aid and gap cover

**FAIS compliance link:**
- FAIS Code of Conduct Section 8: agent must seek appropriate information before making any recommendation — this module is the digital enforcement of that obligation
- FNA output = primary evidence in ROA

---

### 5.6 Module 6 — Quotes

**What it does:**
- Quote capture and storage per client/agent/insurer/product
- Multi-insurer quote comparison
- Quote-to-proposal conversion workflow
- 5-year quote record retention

**Quote status:**
```
draft → presented → accepted → declined → expired
```

**Integration architecture:**
- Adapter pattern for insurer API integrations (future: Santam, Hollard, Discovery, Old Mutual, Sanlam, Liberty, Momentum)
- Manual entry supported for all insurer portals without APIs
- Aggregator webhook receiver: Hippo, CompareGuru integration hooks
- Quote PDF output for client presentation

---

### 5.7 Module 7 — Policy Lifecycle Management

**What it does:**
- Complete policy record from inception to termination
- Full state machine enforcement on policy status
- Endorsement/change management
- Renewal management with automated alerting
- Lapse prevention workflow
- Reinstatement workflow
- Clawback watch dates

**Policy status state machine:**
```
draft → submitted → underwriting → active → amended
      → lapsed → reinstated
      → cancelled
```

**Policy categories:**
| Category | Sub-type | Act |
|---|---|---|
| Life cover | Term, whole life, endowment, life annuity, key person | Long-Term Insurance Act 52/1998 |
| Disability | Lump sum, income protection, permanent disability | Long-Term Insurance Act |
| Critical illness | Dread disease, severity-based | Long-Term Insurance Act |
| Funeral / Assistance | Individual, extended family | Long-Term Insurance Act (assistance business) |
| Short-term personal | Motor, home buildings, home contents, all-risk, personal liability | Short-Term Insurance Act 53/1998 |
| Short-term commercial | Property, business interruption, motor fleet, marine, PI, D&O, cyber | Short-Term Insurance Act |
| Medical aid | Hospital plan, comprehensive plan | Medical Schemes Act 131/1998 |
| Gap cover | In-hospital shortfall, co-payment cover | Long-Term or Short-Term Insurance Act |
| Income protection | Retrenchment cover | Long-Term Insurance Act |
| Investments | Endowment, RA, TFSA, unit trust | FAIS / Collective Investment Schemes |

**Renewal management:**
- Short-term: 60-day pre-renewal alert → agent review task → comparison → client approval
- Life: annual escalation review → premium increase notification
- Medical aid: October/November open enrolment alerts
- Escalation to KI if renewal task not actioned within 30 days

**Lapse prevention:**
- Debit order failure → immediate alert → agent follow-up task created
- Grace period countdown (30/60 days per product)
- Conservation log: attempts recorded
- Lapse event triggers clawback calculation if within Year 1 or 2

---

### 5.8 Module 8 — FAIS Compliance: ROA, RPAR & Document Vault

**What it does:**
- Digital ROA (Record of Advice) builder — the central FAIS compliance document
- RPAR (Replacement Policy Advice Record) for policy replacements
- 5-year retention engine with hard-delete prevention
- Compliance dashboard for the compliance officer
- Document vault for all regulatory documents

**ROA status state machine:**
```
draft → complete → signed_client → signed_agent → filed (5-year timer starts)
```

**ROA mandatory fields (FAIS Code of Conduct):**
1. Client's needs, objectives, and financial information collected
2. Products considered (including rejected alternatives)
3. Product recommended with full rationale
4. Commission/remuneration disclosed (rand amount and %)
5. Conflict of interest disclosure
6. Risk warnings given to client
7. Client consent/acknowledgement
8. Representative details: name, FSP licence number
9. Date of advice

**RPAR fields (on replacement):**
- Existing policy: insurer, product, premium, benefits, exclusions, waiting periods
- Proposed replacement: insurer, product, premium, benefits, exclusions, waiting periods
- Rationale for replacement being in best interest
- Disclosure of potential disadvantages: loss of benefits, new waiting periods, clawback exposure
- Client acknowledgement

**Document vault categories:**
- ROA (per advice event)
- RPAR (per replacement)
- FICA CDD documents (ID, proof of address — with expiry alerts)
- Client consent records
- Commission disclosure documents
- Agent CPD certificates
- Agent RE5/RE1 exam certificates
- SAPS clearance certificates
- Debarment check records
- FSP FSCA licence document
- Complaint records

**E-signature:** DocuSign/SignNow API — ROA and RPAR require client + agent signatures before status = `filed`

**Compliance dashboard KPIs:**
- % active policies with filed ROA
- Documents pending client signature
- Documents pending agent signature
- Overdue FICA document refreshes (proof of address > 3 months)
- Agents with CPD shortfall (current year)
- Open complaints (FAIS Ombud)

---

### 5.9 Module 9 — Commission & Remuneration Tracking

**What it does:**
- Commission structure configuration per agent per product category
- Commission statement import and reconciliation
- Automated clawback calculation (life: 2-year watch period)
- Medical aid broker fee tracking (CMS-regulated R100.95/member/month cap)
- Agent and FSP-level earnings reports

**Commission types:**
| Type | Products | Structure | Clawback |
|---|---|---|---|
| Initial / upfront | Life, disability, critical illness | % of first-year annualised premium | Yes — Year 1: 100%, Year 2: 50% |
| Renewal / trail | Life, disability | % of premium per year (7.5–10%) | No |
| Monthly commission | Short-term personal/commercial | % of monthly premium (12.5–20%) | No (annual renewal) |
| Binder fee | Short-term (if binder agreement held) | Capped, regulated | No |
| Broker fee | Medical aid | R100.95/member/month (CMS cap) | No |

**Clawback engine:**
- On policy creation: record `clawback_watch_expires_at = commencement_date + 2 years`
- On lapse/cancellation event:
  - Check `days_since_commencement`
  - Year 1 (≤365 days): 100% clawback of initial commission
  - Year 2 (366–730 days): 50% clawback
  - After Year 2 (>730 days): no clawback
- Generate `clawback_deduction` record linked to commission record
- Alert FSP owner and agent of clawback amount

---

### 5.10 Module 10 — Claims Management

**What it does:**
- FNOL (First Notification of Loss) intake
- Document checklist per claim type
- Status tracking from FNOL to outcome
- Ombudsman escalation tracking

**Claim status state machine:**
```
filed → documents_pending → under_assessment → approved → paid
                                             → repudiated → ombud_escalated → ombud_determination
```

**Claim types and required documents:**

| Claim Type | Required Documents |
|---|---|
| Death | Death certificate, certified ID (deceased + claimant), claim form, policy schedule, banking details, original policy document |
| Disability | Medical reports, claim form, attending physician report, employer disability confirmation |
| Retrenchment | Retrenchment letter, UIF confirmation, claim form |
| Vehicle (short-term) | Police affidavit (theft/hijack), driver's licence, claim form, photos of damage, repair quotes |
| Property (short-term) | Police affidavit (theft/vandalism), claim form, photos, repair quotes, proof of ownership |
| Critical illness | Diagnosis letter, specialist reports, claim form |
| Funeral | Death certificate, certified ID, claim form, banking details |

**Ombudsman escalation:**
- FAIS Ombud: advice-related complaints (Section 20, FAIS Act) — 3-year statute of limitations
- Ombudsman for Long-Term Insurance: life, disability, funeral repudiations
- Short-Term Insurance Ombudsman: motor, home, property repudiations
- Each escalation tracked with date, reference, and 3-year limitation countdown

---

### 5.11 Module 11 — Notifications & Workflow Engine

**What it does:**
- Event-driven and scheduled automated notifications
- Multi-channel: email (SendGrid) + SMS (Africa's Talking)
- Internal task queue for agents with escalation rules
- Configurable notification preferences per tenant

**Core automated workflows:**

| Trigger | Action | Channel | Audience |
|---|---|---|---|
| 60 days before short-term renewal | Create renewal review task | In-app + email | Agent |
| Annual life policy anniversary | Prompt annual review task | In-app + email | Agent |
| October 1 each year | Medical aid open enrolment alert | Email | Agents with med aid clients |
| Debit order failure | Create lapse risk task | In-app + SMS | Agent |
| Grace period 50% elapsed | Escalate lapse risk to KI | In-app + email | KI |
| Policy lapses | Trigger clawback calculation | System | Commission module |
| Clawback watch expires (2 years) | Clear clawback risk flag | System + notification | Agent |
| FICA proof of address > 80 days | Refresh reminder | Email | Agent |
| Agent CPD hours < target by Q3 | CPD warning | Email | Agent + CO |
| CPD deadline 30 days away, still short | Escalate to KI | Email | KI + CO |
| Policy active with no filed ROA | Compliance risk alert | In-app | CO |
| ROA pending client signature > 7 days | Follow-up reminder | Email | Agent |
| FSCA licence expiry 90 days away | Licence renewal alert | Email | FSP Owner + CO |
| Complaint lodged | Notification | Email | KI + CO |
| Claim status updated | Notification | Email + SMS | Agent + Client |

---

### 5.12 Module 12 — Reporting & Analytics

**What it does:**
- Comprehensive business intelligence for FSP owners, KIs, and COs
- Exportable reports (CSV, PDF) for FSCA audit preparation
- Agent performance management

**Reports catalogue:**

| Report | Audience | Description |
|---|---|---|
| Business Overview Dashboard | FSP Owner, KI | Live KPIs: new business, active book, lapses, conversion rate, commission |
| Book of Business | FSP Owner, KI | All clients + policies, filterable, exportable |
| Agent Performance Report | FSP Owner, KI | Per-agent new business, renewals, lapses, CPD status |
| Compliance Status Report | CO | ROA %, FICA status, CPD tracking, debarment check dates |
| Commission Reconciliation | FSP Owner | Expected vs. received per insurer, clawback exposure |
| FSCA Representative Register | CO | FSCA Section 13-compliant register export |
| Renewal Pipeline | Agent | Upcoming renewals in next 30/60/90 days |
| Lapse Report | KI, CO | Policies lapsed YTD, conservation attempts, reasons |
| Claims Status Report | Agent, KI | All open claims, status, outstanding docs |
| POPIA Data Request Log | CO | All data subject rights requests and outcomes |
| Complaint Register | CO, KI | All lodged complaints, Ombud references, resolution dates |

---

### 5.13 Module 13 — Full CRM (Bitrix-like)

**What it does:**
- Enterprise-grade CRM extending the basic lead pipeline into a configurable multi-pipeline deal management system with full contact/organisation management, activity tracking, automation rules, and calendar integration
- Designed for insurance FSPs managing complex stakeholder relationships beyond individual retail clients

**Core capabilities:**

| Feature | Description |
|---|---|
| **Multi-pipeline Kanban** | Unlimited configurable pipelines (e.g., New Business, Renewals, Group Schemes, Referral Partners). Each pipeline has custom stages with configurable win/loss rules |
| **Contacts** | Full B2C contact profiles (extends `clients`); supports contacts not yet converted to insurance clients |
| **Organisations** | B2B company profiles with multiple contacts; useful for group schemes, corporate broking |
| **Deals** | Deal cards link to pipeline + stage, organisation, contacts, monetary value, probability, expected close date |
| **Activities** | Calls, emails, meetings, tasks, notes — all logged against deals, contacts, or organisations with timestamps |
| **Calendar** | Shared team calendar showing all activities; sync to Google Calendar / Outlook (Phase 2) |
| **Custom Fields** | Admin-configurable custom fields per entity type (contacts, deals, organisations) — stored as JSONB |
| **Tags** | Free-form tagging on contacts, deals, organisations with autocomplete |
| **Segmentation** | Saved filters / smart lists for bulk communication targeting |
| **Bulk Actions** | Reassign, tag, export, or message multiple contacts/deals at once |
| **Communication Timeline** | Unified thread of all emails, calls, tasks, notes per contact/deal |
| **Automation Rules** | Trigger–Action rules (e.g., "when deal moves to stage X → assign task to agent Y"; "when deal is idle 7 days → notify agent") |
| **Email Compose** | Compose emails from within contact or deal record; logged to timeline; templates supported |
| **Pipeline Analytics** | Conversion rates per stage, average deal duration, win/loss ratio, pipeline value by agent |

**Kanban board behaviour:**
- Drag-and-drop cards between stages
- Stage entry/exit rules (required fields before moving)
- Stuck indicator (configurable, e.g., no activity > N days)
- WIP limits per stage (configurable)
- Colour-coded by probability / overdue status
- Compact and expanded card views
- Quick-add card from column header

**Contacts vs. clients:**
- CRM Contacts is a superset of insurance clients — converting a contact to a client triggers FICA/FNA requirements
- All existing `clients` records are visible in CRM Contacts automatically

**Insurance-specific CRM extensions:**
- Deal type can be linked to a quote / policy for traceability
- Activities include "Policy sms follow-up", "ROA reminder call" as preset activity types
- Renewal pipeline auto-populated by notification engine (upcoming renewals create deals automatically)

---

### 5.14 Module 14 — Accounting

**What it does:**
- Full double-entry bookkeeping from quotation through to management accounts
- SA-compliant VAT treatment (14%/15%; VAT Act 89 of 1991)
- Designed for FSP in-house financial management (not audit-grade software replacement — designed to complement external accountant workflows)

**Scope:**

| Sub-Module | Features |
|---|---|
| **Chart of Accounts** | Fully configurable COA structured as Assets, Liabilities, Equity, Revenue, Expenses. Pre-seeded SA-standard template. Account codes, account types, VAT category per account |
| **Financial Years** | Configurable financial year (not constrained to March year-end). Multiple years can be open simultaneously (for corrections). Year-end close process |
| **Invoicing** | Tax invoices with line items; VAT (Standard-rated, Zero-rated, Exempt); payment terms (Net 7/14/30, COD, EOM); invoice status machine (draft → sent → partially_paid → paid → void); PDF generation |
| **Quotes (Sales)** | Sales quotes (distinct from insurance quotes); line items + VAT; convert quote → invoice; expiry date |
| **Credit Notes** | Credit notes linked to original invoice; auto-reverse journal entries |
| **Payments Received** | Allocate payment to one or more invoices; partial payments; over-payments as credit; bank account linked |
| **Supplier Invoices** | Capture supplier bills; expense accounts; VAT input tax |
| **Expense Claims** | Employee expense submissions → approval workflow → payment; per-category spend limits |
| **Bank Accounts** | Multiple bank accounts per tenant; opening balances; running balance |
| **Bank Transactions** | Manual transaction entry; CSV import (standard SA bank export format); auto-match to invoices/payments |
| **Bank Reconciliation** | Statement vs. ledger reconciliation; unmatched items; reconciliation lock |
| **Journal Entries** | Manual double-entry journals; system-generated (from payments, invoices, clawbacks); recurring journals |
| **General Ledger** | Full transaction history per account; filterable by date range, account, reference |
| **Trial Balance** | Debit/credit totals per account; period comparison; export to CSV/PDF |
| **Profit & Loss** | Revenue vs. Expenses; gross profit; net profit; period-on-period comparison |
| **Balance Sheet** | Assets = Liabilities + Equity at any point in time; export |
| **VAT Report** | Output VAT (sales invoices) vs. Input VAT (supplier invoices); net VAT payable; maps to SARS VAT201 fields |

**Insurance-specific accounting integration:**
- Commission income auto-posts to Revenue when commission records are marked `received`
- Clawback auto-creates a negative commission journal entry
- Policy premiums collected (where FSP acts as intermediary) segregated from own revenue
- FSCA levy expense category pre-seeded in COA

**SA compliance notes:**
- VAT Act 89 of 1991: correct treatment of exempt financial services vs. taxable admin fees
- Income Tax Act: commission income correctly categorised as gross income
- Companies Act 71 of 2008: basic financial statements capability (management accounts)
- SARS e-filing export format targeted for VAT201

---

## 6. Compliance Requirements Matrix

| Regulation | Obligation | System Feature |
|---|---|---|
| FAIS Act S13 | Representative register | Agent module + register export |
| FAIS Act S14 | Debarment procedure | Debarment workflow |
| FAIS Act S15 | Code of Conduct — needs analysis | FNA module |
| FAIS Act S15 | Code of Conduct — disclosure | ROA commission disclosure fields |
| FAIS Act S16 | ROA requirement | ROA builder |
| FAIS Act S17 | Compliance officer | CO role + compliance dashboard |
| FAIS Act S18 | 5-year record keeping | Retention engine, hard-delete prevention |
| FAIS Act S8A | CPD obligations | CPD tracker |
| POPIA | Consent management | Consent capture + audit trail |
| POPIA | Data subject rights | Rights workflow (access, correct, delete) |
| POPIA | Breach notification | Security alert workflow |
| POPIA | Retention + deletion | FAIS override logic, retention engine |
| FICA | CDD / KYC | FICA module, document management |
| FICA | PEP screening | PEP flag on client record |
| FICA | STR reporting | goAML referral flag + report generator |
| FICA | 5-year record keeping | Document vault retention |
| TCF Outcome 3 | Client kept informed | Communication log, notification templates |
| TCF Outcome 4 | Suitable advice | FNA + ROA completeness validation |
| TCF Outcome 5 | Products perform as expected | Policy tracking, renewal management |
| TCF Outcome 6 | No unreasonable post-sale barriers | Claims workflow, Ombud escalation |
| VAT Act S7 | Output tax on taxable supplies | Invoicing VAT calculation + VAT report |
| VAT Act S16 | Input tax credits | Supplier invoice VAT capture |
| Companies Act S30 | Annual financial statements | P&L, Balance Sheet export |

| Regulation | Obligation | System Feature |
|---|---|---|
| FAIS Act S13 | Representative register | Agent module + register export |
| FAIS Act S14 | Debarment procedure | Debarment workflow |
| FAIS Act S15 | Code of Conduct — needs analysis | FNA module |
| FAIS Act S15 | Code of Conduct — disclosure | ROA commission disclosure fields |
| FAIS Act S16 | ROA requirement | ROA builder |
| FAIS Act S17 | Compliance officer | CO role + compliance dashboard |
| FAIS Act S18 | 5-year record keeping | Retention engine, hard-delete prevention |
| FAIS Act S8A | CPD obligations | CPD tracker |
| POPIA | Consent management | Consent capture + audit trail |
| POPIA | Data subject rights | Rights workflow (access, correct, delete) |
| POPIA | Breach notification | Security alert workflow |
| POPIA | Retention + deletion | FAIS override logic, retention engine |
| FICA | CDD / KYC | FICA module, document management |
| FICA | PEP screening | PEP flag on client record |
| FICA | STR reporting | goAML referral flag + report generator |
| FICA | 5-year record keeping | Document vault retention |
| TCF Outcome 3 | Client kept informed | Communication log, notification templates |
| TCF Outcome 4 | Suitable advice | FNA + ROA completeness validation |
| TCF Outcome 5 | Products perform as expected | Policy tracking, renewal management |
| TCF Outcome 6 | No unreasonable post-sale barriers | Claims workflow, Ombud escalation |

---

## 7. Integration Architecture

### Current (Manual Entry Supported)
All insurer data can be captured manually. System is functional without any external integrations.

### Phase 2 Integration Hooks (Designed, Not Implemented in v1)

| Integration | Type | Purpose |
|---|---|---|
| DHA / LexisNexis / MIE | REST API | RSA ID verification against Home Affairs |
| FSCA Entity Register | REST API | FSCA debarment check and licence verification |
| TransUnion / Experian SA | REST API | Credit check for fit and proper |
| Santam Broker Portal | REST API | Quote, policy status, new business submission |
| Old Mutual / OMadvise | REST API | Quote, policy status |
| Discovery Broker Portal | REST API | Quote, policy data |
| Sanlam SanlamConnect | REST API | Quote, policy data |
| Liberty / Momentum | REST API | Quote, policy data |
| Hippo / CompareGuru | Webhook | Short-term quote import |
| DocuSign / SignNow | REST API | ROA / RPAR electronic signature |
| SendGrid | REST API | Email notifications |
| Africa's Talking | REST API | SMS notifications (SA local numbers) |
| Stripe | REST API | SaaS subscription billing |
| Cloudflare R2 | S3-compatible | Compliance document storage |
| FIC goAML | REST API | STR / CTR submission |

---

## 8. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Data isolation** | PostgreSQL RLS — zero cross-tenant data access at DB layer |
| **Availability** | 99.5% uptime target (Railway managed infrastructure) |
| **Performance** | API response < 300ms (p95) for standard CRUD; < 1s for reports |
| **Document storage** | Files encrypted at rest (Cloudflare R2 SSE); access logged |
| **Audit trail** | Immutable audit log for all mutations to client, policy, ROA, commission data |
| **Data retention** | FAIS 5-year minimum; POPIA minimality overridden where FAIS applies |
| **Authentication** | JWT with refresh tokens; HTTPS only; token expiry 15 min (access) / 7 days (refresh) |
| **Password security** | Bcrypt hashing; minimum 12 characters; MFA optional (Phase 2) |
| **File uploads** | Virus scan on ingest; max 25MB per file; PDF, DOCX, JPEG, PNG accepted |
| **Localisation** | ZAR currency, South African date format (DD/MM/YYYY), SAST timezone |
| **Accessibility** | WCAG 2.1 AA compliance target |
| **Mobile** | Responsive web (React) — agents frequently working on mobile; PWA Phase 2 |
| **Export formats** | CSV, PDF, XLSX for all reports |

---

## 9. Out of Scope (v1)

- Native mobile app (iOS/Android) — PWA approach in v2
- Real-time insurer API integrations (hook architecture in place; connections in v2)
- Direct DHA identity verification (FSCA register check manual in v1)
- MFA / two-factor authentication (password + email OTP in v1; authenticator app in v2)
- Investment product analytics / portfolio tracking beyond basic policy record
- Group scheme / employee benefit management
- Automated premium financing
- WhatsApp Business API integration (designed for v2)
- Video KYC / biometric verification

---

## 10. Success Criteria

| Metric | Target (12 months post-launch) |
|---|---|
| Active tenants | 25+ FSPs onboarded |
| Policies tracked on platform | 10,000+ active policies |
| ROA compliance rate (on platform) | >95% of active policies have filed ROA |
| FICA CDD completion rate | >90% of active clients fully verified |
| Agent CPD tracking adoption | 100% of agents' CPD logged in system |
| System uptime | >99.5% |
| User satisfaction (NPS) | >40 |
| FSCA audit pass rate | 100% of tenants who undergo FSCA audit pass with system-generated reports |
| CRM adoption | >80% of active policies linked to a CRM deal in pipeline |
| Invoices processed on platform | >500 invoices/month across tenant base |
| Trial balance export | 100% of tenants can self-serve a reconciled trial balance |
