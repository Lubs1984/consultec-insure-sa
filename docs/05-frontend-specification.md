# Frontend Specification

**Project:** InsureConsultec — SA Insurance Agent Lifecycle SaaS
**Stack:** React 19 · Vite 6 · TypeScript 5 · TanStack Router · TanStack Query · shadcn/ui · Tailwind CSS v4
**Date:** February 2026

---

## 1. Design Principles

- **Role-aware UI:** Every element conditionally rendered based on user role and permissions. Agents see only their own book; FSP owners see the full brokerage.
- **Compliance-first UX:** FAIS-required steps (FNA before ROA, disclosure before quote presentation) are enforced in the UI flow, not just the API.
- **Mobile-responsive:** Agents frequently work in the field on mobile. All views must be functional on 375px width and up.
- **Progressive disclosure:** Complex forms (FNA, ROA) broken into guided wizard steps. Show only relevant fields per step.
- **Audit visibility:** Key actions (status transitions, document uploads, signature events) show timestamps and actor in the UI.
- **South African context:** ZAR currency formatting, DD/MM/YYYY dates, SAST timezone, South African province lists.

---

## 2. Route Structure (TanStack Router)

```
/ (root layout — public)
├── /login
├── /register
├── /forgot-password
├── /reset-password

/ (app layout — authenticated)
├── /dashboard                        Home dashboard
├── /leads                            Lead pipeline (Kanban)
│   ├── /leads/:id                    Lead detail
│   └── /leads/new                    New lead form
├── /clients                          Client list
│   ├── /clients/:id                  Client 360 view
│   │   ├── /clients/:id/overview     Profile + summary
│   │   ├── /clients/:id/policies     Policy list
│   │   ├── /clients/:id/quotes       Quote history
│   │   ├── /clients/:id/roas         ROA history
│   │   ├── /clients/:id/claims       Claims
│   │   ├── /clients/:id/fna          Financial Needs Analysis
│   │   ├── /clients/:id/fica         FICA/CDD profile
│   │   └── /clients/:id/documents    Document vault
│   └── /clients/new                  New client form
├── /policies                         Policy list
│   ├── /policies/:id                 Policy detail
│   └── /policies/new                 New policy wizard
├── /quotes                           Quote list
│   ├── /quotes/:id                   Quote detail
│   └── /quotes/new                   New quote form
├── /roas                             ROA list
│   ├── /roas/:id                     ROA detail / builder
│   └── /roas/new                     New ROA wizard
├── /needs-analysis
│   └── /needs-analysis/:id           FNA form / report
├── /claims                           Claims list
│   ├── /claims/:id                   Claim detail
│   └── /claims/new                   New FNOL form
├── /commissions                      Commission dashboard
│   ├── /commissions/statements       Statement list
│   └── /commissions/clawback         Clawback watch list
├── /compliance                       Compliance dashboard (CO/KI only)
│   ├── /compliance/roa-status        ROA compliance
│   ├── /compliance/cpd               CPD overview
│   ├── /compliance/fica              FICA overview
│   └── /compliance/complaints        Complaint register
├── /agents                           Agent list (FO/KI/CO)
│   ├── /agents/:id                   Agent profile
│   └── /agents/new                   New agent onboarding
├── /reports                          Reports hub
│   ├── /reports/book-of-business
│   ├── /reports/agent-performance
│   ├── /reports/renewals
│   ├── /reports/lapses
│   ├── /reports/commission
│   └── /reports/fsca-register
├── /settings                         Tenant settings
│   ├── /settings/profile             FSP profile
│   ├── /settings/users               User management
│   ├── /settings/commission          Commission structures
│   ├── /settings/notifications       Notification preferences
│   └── /settings/billing             Subscription
├── /crm                              CRM hub
│   ├── /crm/board                    Kanban deal board (default pipeline)
│   ├── /crm/board/:pipelineId        Kanban board for specific pipeline
│   ├── /crm/deals                    Deal list (table view)
│   │   └── /crm/deals/:id            Deal detail
│   ├── /crm/contacts                 Contact list
│   │   ├── /crm/contacts/:id         Contact detail + timeline
│   │   └── /crm/contacts/new         New contact
│   ├── /crm/organizations            Organisation list
│   │   ├── /crm/organizations/:id    Organisation detail
│   │   └── /crm/organizations/new    New organisation
│   ├── /crm/activities               Activity calendar + list
│   └── /crm/settings                 Pipeline & stage configuration
├── /accounting                       Accounting hub
│   ├── /accounting/dashboard         Accounting overview (AR, AP, bank balances)
│   ├── /accounting/invoices          Invoice list
│   │   ├── /accounting/invoices/:id  Invoice detail
│   │   └── /accounting/invoices/new  New invoice
│   ├── /accounting/expenses          Expense claims
│   │   └── /accounting/expenses/:id  Claim detail
│   ├── /accounting/bank              Bank accounts + transactions
│   │   └── /accounting/bank/:id      Bank account + reconciliation
│   ├── /accounting/journals          Journal entries
│   │   └── /accounting/journals/:id  Journal detail
│   ├── /accounting/coa               Chart of accounts
│   └── /accounting/reports           Accounting reports
│       ├── /accounting/reports/trial-balance
│       ├── /accounting/reports/profit-loss
│       ├── /accounting/reports/balance-sheet
│       ├── /accounting/reports/general-ledger
│       └── /accounting/reports/vat
└── /admin                            Super admin (SA only)
    ├── /admin/tenants
    └── /admin/tenants/:id
```

---

## 3. Layout & Shell

### 3.1 App Shell
```
┌──────────────────────────────────────────────────────┐
│  TOPBAR: Logo | Tenant name | Notifications | Profile│
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  SIDEBAR   │         MAIN CONTENT AREA               │
│            │                                         │
│  Nav items │  Page title + breadcrumbs               │
│  (grouped) │  ─────────────────────────              │
│            │  Content                                │
│  Collapse  │                                         │
│  toggle    │                                         │
│            │                                         │
└────────────┴─────────────────────────────────────────┘
```

### 3.2 Sidebar Navigation Groups

```
OVERVIEW
  Dashboard

SALES
  Leads
  Clients
  Quotes

POLICIES
  Policies
  Claims

COMPLIANCE
  Records of Advice
  Needs Analysis
  Compliance (CO/KI only)

FINANCE
  Commissions

CRM
  Deal Board
  Contacts
  Organisations
  Activities

ACCOUNTING  (FO/KI only)
  Invoices
  Expenses
  Bank Accounts
  Journals
  Chart of Accounts
  Reports

TEAM  (FO/KI only)
  Agents

REPORTS  (FO/KI/CO only)
  Reports

SETTINGS
  Settings
```

### 3.3 Responsive Behaviour
- **Desktop (≥1024px):** Sidebar expanded (240px), collapsible to icon-only (64px)
- **Tablet (768–1023px):** Sidebar collapsed to icons by default
- **Mobile (<768px):** Sidebar as drawer (slide-over) triggered by hamburger

---

## 4. Page Specifications

### 4.1 Dashboard

**Role: Agent view**
```
┌─────────────────────────────────────────────────┐
│  Good morning, Sipho  │  Tasks Due Today: 3     │
├──────────┬──────────┬──────────┬────────────────┤
│ Leads    │ Active   │Commission│  Renewals Due  │
│ pipeline │ Policies │ This Mth │  Next 30 Days  │
│ count    │ count    │  YTD     │  count         │
├──────────┴──────────┴──────────┴────────────────┤
│  MY TASKS (due)                                 │
│  □ Call Themba re lapse risk — Motor policy     │
│  □ Submit ROA — Nomsa Discovery Life            │
│  □ Annual review — Peter (policy #PLY-1234)     │
├─────────────────────────────────────────────────┤
│  LEAD PIPELINE SUMMARY (mini Kanban)            │
├─────────────────────────────────────────────────┤
│  RECENT ACTIVITY                                │
└─────────────────────────────────────────────────┘
```

**Role: FSP Owner / KI view adds:**
- Full brokerage KPIs (all agents)
- Compliance risk alerts (ROA overdue, CPD shortfall, FICA expired)
- Lapse rate chart (last 12 months)
- Commission book total

---

### 4.2 Lead Pipeline (Kanban)

Horizontal Kanban columns, one per status stage:
```
NEW | CONTACTED | QUALIFIED | FNA SCHEDULED | QUOTED | PROPOSAL | AWAITING | WON | LOST
```

Each **lead card** shows:
- Full name + phone
- Source badge (Referral, Cold Call, etc.)
- Days in current stage
- Assigned agent avatar
- Quick actions: Call, Email, Move to next stage

**Filters bar:** Agent (FO/KI), Source, Date range, Search by name/phone

**List view toggle:** For high-volume use, sortable data table alternative to Kanban

---

### 4.3 Client 360 View

Tabbed layout. Overview tab shows:
```
┌────────────────────────────────────────────────────┐
│  SIPHO DLAMINI                                     │
│  RSA ID: 8501015009087 · DOB: 01 Jan 1985          │
│  📱 +27821234567 · 📧 sipho@email.co.za            │
│  Agent: Themba Nkosi · Client since: Jan 2024      │
│  FICA: ✅ Verified · Marketing consent: ✅          │
├───────────────────────┬────────────────────────────┤
│  POLICIES (3 active)  │  TASKS                     │
│  🟢 Sanlam Life       │  📋 Annual review due      │
│  🟢 Santam Motor      │     in 14 days             │
│  🟢 Discovery Med Aid │                            │
├───────────────────────┴────────────────────────────┤
│  RECENT ACTIVITY                                   │
└────────────────────────────────────────────────────┘
```

**FICA tab:** CDD status widget, document upload slots (ID, POA), verification buttons, PEP flag, risk rating badgee

**Documents tab:** Categorised document list with upload, download, expiry indicators

---

### 4.4 New Client Form

Single-page scrollable form with sections (or stepped wizard for mobile):

1. **Identity** — first/last name, ID type, ID number, DOB, gender
2. **Contact** — mobile, email, work phone
3. **Address** — physical + postal (checkbox: same as physical)
4. **Employment** — status, employer, occupation, income
5. **Consent** — POPIA checkboxes (required to create)
6. **Assign agent** (FO/KI only) — select from agent list

**Validation:** Live ID number validation (Luhn algorithm check + date extraction); SA phone number formatting; mandatory fields highlighted

---

### 4.5 Financial Needs Analysis Wizard

7-step wizard with progress indicator:

```
Step 1/7: Financial Position
Step 2/7: Existing Cover Audit
Step 3/7: Insurance Objectives
Step 4/7: Risk Tolerance
Step 5/7: Health & Lifestyle
Step 6/7: Dependants & Responsibilities
Step 7/7: Gap Analysis Review
```

**Step 7 (Gap Analysis):** Auto-calculated gap display
```
Life Cover:
  Recommended:   R 2,500,000  (based on income × 15 - liabilities)
  Existing:      R   500,000
  GAP:           R 2,000,000  ⚠️

Income Protection:
  Recommended:   R  28,500/month (75% of net income)
  Existing:      R       0
  GAP:           R  28,500/month  ⚠️

Funeral Cover:
  Existing:      R  20,000  ✅ (adequate for 1 adult)
```

**Save & Generate PDF** button → triggers PDF generation, stores to document vault

---

### 4.6 Policy Detail View

```
┌─────────────────────────────────────────────────────┐
│  POLICY #POL-2024-00312                             │
│  Sanlam Family Protector — Life Cover               │
│  Status: ACTIVE 🟢  │  Premium: R850/month          │
├─────────────────────────────────────────────────────┤
│  Sum Insured: R 1,500,000                           │
│  Commenced: 01 Mar 2024  │  Renewal: 01 Mar 2025    │
│  Collection: Debit Order — 1st of month             │
│  Last Collection: 01 Feb 2026 ✅                    │
│  Clawback watch: Until 01 Mar 2026 (8 days remain)  │
├─────────────────────────────────────────────────────┤
│  BENEFICIARIES        │  COMPLIANCE                 │
│  Nomsa (Spouse) 70%   │  ROA: Filed ✅              │
│  Junior (Child) 30%   │  RPAR: N/A                  │
├─────────────────────────────────────────────────────┤
│  [View ROA] [Add Endorsement] [Record Claim]        │
│  [Cancel Policy] [Log Premium Failure]              │
└─────────────────────────────────────────────────────┘
```

**Endorsement history** tab — timeline of all changes with before/after diffs

**Status transitions** — clearly labelled action buttons per valid next state

---

### 4.7 ROA Builder

Guided 6-section form:

```
Section 1: Needs Summary (pre-filled from FNA)
Section 2: Products Considered (add/remove insurer+product rows)
Section 3: Recommendation & Rationale
Section 4: Disclosures (commission, conflicts — required fields)
Section 5: Risk Warnings
Section 6: Review & Sign
```

**Completeness indicator:** Progress ring showing % complete; must reach 100% before `Complete` action is available

**Section 6 — Sign:**
- QR code or link for client to sign on their own device
- Or: In-app signature pad
- Agent signature captured after client
- Status bar: `Draft → Complete → Awaiting Client Sig → Awaiting Agent Sig → Filed`

**When `is_replacement = true`:** After completing ROA, wizard automatically proceeds to RPAR step

---

### 4.8 RPAR Form

Two-column comparison layout:

```
┌─────────────────────────┬────────────────────────────┐
│  EXISTING POLICY        │  PROPOSED REPLACEMENT       │
│  Insurer: Old Mutual    │  Insurer: Sanlam            │
│  Product: Max Life      │  Product: Family Protector  │
│  Premium: R920/month    │  Premium: R850/month        │
│  Benefit: R1.2M         │  Benefit: R1.5M             │
│  Exclusions: ...        │  Exclusions: ...            │
│  Wait periods: None     │  Wait periods: None         │
└─────────────────────────┴────────────────────────────┘

Why is replacement in best interest:
[Text area]

Disadvantages the client should be aware of:
☑ New waiting periods may apply
☑ Clawback on existing policy may trigger
☐ Loss of existing policy benefits

Client acknowledgement: [Signature capture]
```

---

### 4.9 Claims Tracker

**List view:** Status-grouped with urgency indicators

```
FILED (2)          DOCUMENTS PENDING (3)  UNDER ASSESSMENT (1)
──────────────     ─────────────────────  ─────────────────────
🔴 Themba - Death  🟡 Sipho - Vehicle     🔵 Nomsa - Disability
   Filed: 2 days      Outstanding: 2 docs    In review: 5 days
   
APPROVED (1)       REPUDIATED (1)         OMBUD ESCALATED (1)
```

**Claim detail:** Document checklist (checkboxes with upload button per item), status timeline, insurer contact details, escalation actions

---

### 4.10 Compliance Dashboard (CO / KI)

```
┌────────────────────────────────────────────────────────┐
│  COMPLIANCE OVERVIEW — February 2026                   │
├────────────┬──────────────┬───────────┬───────────────┤
│ ROA         │ FICA         │ CPD       │ Complaints    │
│ 97.1% ✅    │ 8 pending ⚠️ │ 2 at risk │ 2 open        │
│ 7 overdue   │ 14 expiring  │ ⚠️        │ 1 Ombud       │
│             │ in 30 days   │           │               │
├────────────┴──────────────┴───────────┴───────────────┤
│                                                        │
│  ⚠️ CRITICAL ACTIONS REQUIRED (7 items)                │
│  ─────────────────────────────────────────────────    │
│  □ Sipho Dlamini — POA expired 3 days ago              │
│  □ Motor policy #POL-2024-0048 — No ROA filed          │
│  □ Agent Thandeka — CPD: 2.0/6.0 hours (Q3 alert)     │
│  ...                                                   │
└────────────────────────────────────────────────────────┘
```

---

### 4.11 Agent Profile (Onboarding Tracker)

```
SIPHO NKOSI — AGENT ONBOARDING
Status: supervised  [Progress: 4/6 steps complete]

✅ Background checks complete (FSCA: clear, SAPS: 12 Mar 2025)
✅ Product training complete
✅ RE5 passed (14 Jan 2025)
✅ Appointment letter signed (01 Feb 2025)
⏳ Supervised period (12 months - ends 01 Feb 2026 — 8 days remaining)
   ROA reviews by KI: 34/40 completed ████████░░
□  Full active status

CPD: 4.5 / 6.0 hours  ████████░░  (target 6.0 hrs by 31 Dec 2026)
```

---

### 4.12 CRM — Kanban Deal Board (`/crm/board/:pipelineId`)

```
CRM — DEAL BOARD                     [+ New Deal]  [Pipeline: New Business ▼]

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐
│  PROSPECT    │  │  QUALIFIED   │  │  PROPOSAL    │  │  NEGOTIATION │  │  WON ✓   │
│  6 deals     │  │  4 deals     │  │  3 deals     │  │  2 deals     │  │  12 deals│
│  R 48,000    │  │  R 32,500    │  │  R 29,000    │  │  R 18,000    │  │          │
├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────┤
│ 📋 Sipho N   │  │ 📋 Maria V   │  │ 📋 James K   │  │ 📋 Priya S   │  │          │
│ Life Cover   │  │ Group Scheme │  │ Retirement   │  │ Short-term   │  │          │
│ R 1,250/mth  │  │ R 8,400/mth  │  │ R 3,600/mth  │  │ R 2,100/mth  │  │          │
│ Due: 30 Mar  │  │ Due: 15 Mar  │  │ Due: 20 Mar  │  │ Due: 28 Mar  │  │          │
│ 🔴 Stuck 8d  │  │ ⚡ Thandeka  │  │ ⚡ Sipho     │  │ ⚡ John      │  │          │
│              │  │              │  │              │  │              │  │          │
│ 📋 Thembi M  │  │ 📋 Ahmed P   │  │              │  │              │  │          │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘
```

**Card component fields:**
- Deal title + client name
- Deal value (monthly premium or total deal value)
- Expected close date
- Assigned agent avatar
- Stuck indicator (red badge if idle > `stuck_threshold_days`)
- Activity badge (count of open tasks)
- Click → Deal detail side panel (no full page navigation for quick edits)

**Board controls:**
- Pipeline selector dropdown (top right)
- Filter bar: assigned agent, tags, value range, date range
- Toggle: Kanban / Table view
- Drag-and-drop between columns (updates `stage_id`; enforces `required_fields` rules)

---

### 4.13 CRM — Deal Detail (`/crm/deals/:id`)

Side panel (sheet) or full page:
```
DEAL: Sipho Nkosi — Life Cover                           [Edit] [Won] [Lost]
Value: R 1,250/mth  |  Probability: 60%  |  Close: 30 Mar 2026
Assigned: Thandeka Dlamini  |  Pipeline: New Business → Proposal

CONTACTS LINKED
  Sipho Nkosi (Primary)  sipho@email.com  072 555 1234
  [+ Link contact]

LINKED RECORDS
  Client: Sipho Nkosi  [→ Client 360]
  Quote: QTE-2026-0012  [→ Quote]
  Policy: —

ACTIVITY TIMELINE  [+ Log Activity ▼]
  ────────────────────────────────────────────────────
  ✅ CALL  21 Feb 2026 — Thandeka
     "Discovery call — discussed life cover gap of R1M. Client interested."

  📅 MEETING  28 Feb 2026 — Scheduled
     "Product presentation — Sanlam Family Protector"
     [Mark Done]  [Edit]

  📝 NOTE  18 Feb 2026 — Thandeka
     "Referred by Andre van der Berg"
  ────────────────────────────────────────────────────
```

---

### 4.14 CRM — Contact Detail (`/crm/contacts/:id`)

```
CONTACT: Sipho Nkosi                   [Convert to Client] [Edit]
Email: sipho@email.com  |  Mobile: 072 555 1234
Organisation: —  |  Source: Referral  |  Tags: high_value, life_focus
Assigned: Thandeka Dlamini

OPEN DEALS (1)
  Sipho Nkosi — Life Cover  |  New Business → Proposal  |  R 1,250/mth

COMMUNICATION TIMELINE
  [same format as deal timeline above]
```

---

### 4.15 CRM — Activity Calendar (`/crm/activities`)

```
ACTIVITIES                          [Month ▼] [February 2026 ◄ ►]  [+ New Activity]

[Calendar grid: Mon–Sun with activity pills per day]

Mon 24 Feb:
  🔵 CALL 10:00 — Sipho N (Thandeka)
  🟢 MEETING 14:00 — Maria V (John)

[List view toggle: upcoming tasks by agent]
```

---

### 4.16 Accounting — Dashboard (`/accounting/dashboard`)

```
ACCOUNTING                                        Period: Feb 2026 [Change]

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Invoiced     │ Received     │ Outstanding  │ Overdue      │
│ R 48,500    │ R 32,200     │ R 16,300     │ R 4,800      │
│ this period  │ this period  │ AR balance   │ >30 days     │
└──────────────┴──────────────┴──────────────┴──────────────┘

BANK BALANCES
  FNB Business Cheque:   R 142,530.00  [Last reconciled: 31 Jan 2026]
  Petty Cash:            R 1,240.00

RECENT INVOICES
  INV-2026-0021  Sipho Nkosi  R 1,725.00  Overdue (7 days)  [Send Reminder]
  INV-2026-0022  ABC Corp     R 9,200.00  Sent (due 6 Mar)
  INV-2026-0023  Maria V      R 575.00    Paid ✓

UPCOMING EXPENSES
  3 expense claims pending approval  [Review]
```

---

### 4.17 Accounting — Invoice Builder (`/accounting/invoices/new`)

Wizard-style form:

**Step 1 — Bill-to details:**
- Search existing client / CRM contact / organisation
- Or: free-type billing name + address

**Step 2 — Line items:**
```
DESCRIPTION                    QTY    UNIT PRICE    DISC    VAT      TOTAL
Financial Planning Fee          1      R 1,500.00    0%     15%      R 1,725.00
Short-term Insurance Advice     1      R 500.00      0%     Exempt   R 500.00
[+ Add line item]
─────────────────────────────────────────────────────────────────────────────
                                                    Subtotal: R 2,000.00
                                                    VAT:        R 225.00
                                                    TOTAL:    R 2,225.00
```

**Step 3 — Payment terms + notes → Preview PDF → Send / Save Draft**

---

### 4.18 Accounting — Trial Balance (`/accounting/reports/trial-balance`)

```
TRIAL BALANCE                              Period: 01 Jan 2026 — 31 Jan 2026
                                           [Export CSV] [Export PDF]

Account Code  Account Name                  Account Type   Debit        Credit
─────────────────────────────────────────────────────────────────────────────
1000          Bank — FNB Business            Asset          169,300.00
1100          Accounts Receivable            Asset           16,300.00
2000          Accounts Payable               Liability                    4,200.00
3000          Owner's Equity                 Equity                      45,000.00
4000          Commission Income              Revenue                     48,500.00
4100          Consultation Fees              Revenue                      9,200.00
5000          Salaries — Admin               Expense         28,000.00
5100          Office Rent                    Expense         12,000.00
5200          Vehicle Expenses               Expense          3,800.00
6000          FSCA Levy                      Expense          4,500.00
─────────────────────────────────────────────────────────────────────────────
TOTALS                                                      233,900.00   106,900.00
                                                            Balanced: ✅
```

---

### 4.19 Accounting — Chart of Accounts (`/accounting/coa`)

```
CHART OF ACCOUNTS                           [+ Add Account] [Seed SA Template]

ASSETS
  1000  Bank — FNB Business        Current Asset    Debit    [Edit] [+Sub]
  1010  Bank — Standard Bank       Current Asset    Debit    [Edit] [+Sub]
  1100  Accounts Receivable        Current Asset    Debit    [Edit]
  1200  Prepaid Expenses            Current Asset    Debit    [Edit]
  1500  Office Equipment            Fixed Asset      Debit    [Edit]

LIABILITIES
  2000  Accounts Payable            Current Liability Credit   [Edit]
  2100  VAT Control Account         Current Liability Credit   [Edit]

[EQUITY / REVENUE / EXPENSES sections follow same pattern]
```

---

## 5. Shared Components

### 5.1 Data Tables
- TanStack Table v8
- Column sorting, multi-column filtering
- Row-level actions (dropdown menu)
- Bulk select + bulk actions
- CSV/PDF export button
- Pagination controls
- Sticky header on scroll

### 5.2 Status Badges
Consistent colour coding across all entities:

| Status | Colour |
|---|---|
| active / filed / verified | Green |
| draft / pending / in_progress | Blue |
| lapsed / expired / failed | Red |
| submitted / under_assessment / supervised | Amber |
| cancelled / lost / debarred | Grey |
| won / approved / paid | Emerald |

### 5.3 Document Upload Component
- Drag-and-drop zone + file browser
- Accepted types: PDF, DOCX, JPG, PNG (max 25MB)
- Progress bar, success/error states
- Inline preview for images
- Category selector dropdown
- Expiry date picker (for FICA docs, SAPS cert)
- Virus scan status indicator

### 5.4 Signature Capture
- Canvas-based signature pad (touch/mouse)
- Clear/redo controls
- Saved as PNG embedded in PDF
- Alternative: DocuSign link generation

### 5.5 Currency Input
- ZAR prefix (R) shown
- Thousands separator auto-formatted
- Decimal limited to 2 places
- Mobile: numeric keyboard triggered

### 5.6 ID Number Input
- 13-digit validation with Luhn check
- Auto-extract DOB and gender on valid input
- SA vs. passport selector

### 5.7 Date Picker
- South African format: DD/MM/YYYY
- No future dates for ID issue, past events
- SAST timezone awareness

### 5.8 Phone Input
- SA mobile format: +27 XX XXX XXXX
- Auto-format as user types
- Landline support (010/011 etc.)

### 5.9 Province Select
All 9 SA provinces:
Gauteng, Western Cape, KwaZulu-Natal, Eastern Cape, Limpopo, Mpumalanga, North West, Free State, Northern Cape

### 5.10 Notification Bell
- Unread count badge
- Dropdown: last 10 notifications with links
- Mark all read
- "View all" → `/notifications` page

---

## 6. Forms Strategy

All forms use **React Hook Form** with **Zod** schemas from `packages/shared`:

```typescript
// Example: new client form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateClientSchema } from '@insureconsultec/shared/schemas';

const form = useForm({
  resolver: zodResolver(CreateClientSchema),
  defaultValues: { ... }
});
```

**Error display:** Inline red error text below each field, field border turns red on error. Summary error banner at form top for server errors.

**Dirty state tracking:** Unsaved changes indicator; browser `beforeunload` warning for long forms (FNA, ROA).

**Autosave:** FNA and ROA builders autosave draft every 60 seconds to prevent data loss.

---

## 7. State Management

| State Type | Solution |
|---|---|
| Server/remote data | TanStack Query (cache, background refresh, optimistic updates) |
| Auth + user session | Zustand (`useAuthStore`) |
| Tenant context | Zustand (`useTenantStore`) |
| UI state (modals, drawers) | Local `useState` per component |
| Form state | React Hook Form |

### Zustand Auth Store
```typescript
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}
```

---

## 8. API Client

TanStack Query + custom fetch wrapper:

```typescript
// lib/api.ts
const api = {
  get: <T>(path: string): Promise<T> => fetchWithAuth('GET', path),
  post: <T>(path: string, body: unknown): Promise<T> => fetchWithAuth('POST', path, body),
  patch: <T>(path: string, body: unknown): Promise<T> => fetchWithAuth('PATCH', path, body),
  delete: <T>(path: string): Promise<T> => fetchWithAuth('DELETE', path),
};

// lib/queries/clients.ts
export const clientsQuery = {
  list: (params) => ({
    queryKey: ['clients', params],
    queryFn: () => api.get(`/clients?${new URLSearchParams(params)}`)
  }),
  detail: (id: string) => ({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/clients/${id}`)
  }),
};
```

**Error handling:** Global query error handler shows toast notifications. 401 triggers auto-refresh; on refresh failure, redirects to `/login`.

---

## 9. Compliance Flow Enforcement (UI-level)

These UX constraints enforce FAIS obligations:

| Flow | Enforcement |
|---|---|
| Creating a policy | UI checks: client must have completed FNA. Warning shown if no FNA. Blocked if product requires FNA (life, disability). |
| Filing an ROA | `Complete` button disabled until all mandatory fields populated and commission disclosure confirmed |
| Presenting a quote | Disclosure tooltip appears on first quote presentation — confirms commission will be disclosed |
| Policy replacement | On cancellation with replacement: RPAR wizard auto-triggered before cancel can be confirmed |
| Agent rendering services | Agent status must be `active` or `supervised` — debarred/resigned agents' data shown in read-only mode |

---

## 10. Theming & Branding

- **Default theme:** Professional, clean, insurance-industry appropriate (navy + white + emerald green accents)
- **Per-tenant branding:** Tenant logo shown in topbar; primary brand colour configurable → applied to buttons, badges, sidebar accent
- **Dark mode:** Supported via Tailwind `dark:` classes (optional, defaults to light)
- **Font:** Geist Sans (system-like, professional)
- **shadcn/ui theme tokens:** Extended via CSS variables per tenant colour

---

## 11. Empty States

All list pages have thoughtful empty states:

- **No leads yet:** "Start building your pipeline. Add your first lead." + CTA button
- **No ROA for policy:** "This policy requires a Record of Advice. Complete your FAIS obligation." + CTA button (with amber warning colour)
- **No FICA documents:** "FICA verification is outstanding. Upload certified ID and proof of address." + upload CTA
- **No claims:** "No claims logged. When a client needs to claim, start the process here."

---

## 12. Key UX Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Kanban vs. table for leads | Both (toggle) | Kanban for pipeline feel; table for high-volume brokerages |
| Wizard vs. single form for FNA | Wizard | Reduces overwhelm; enforces completeness per section |
| ROA signing | In-app capture + optional DocuSign | Most agents sign on same device; DocuSign for remote clients |
| Policy status change | Confirmation modal with reason required | Irreversible state transitions need friction |
| Delete operations | Soft delete only + confirmation | FAIS retention; no accidental permanent data loss |
| Notification delivery | In-app toast + sidebar indicator | Primary; email/SMS as supplement |
| CRM deal navigation | Side panel (sheet) for quick edits, full page for detail | Minimises context-switch on Kanban board; full page for deep work |
| CRM pipelines | Each pipeline has its own Kanban URL | Enables bookmarking; shareable team views |
| CRM activity logging | Inline on deal/contact timeline | No separate activity creation page needed for simple entries |
| CRM contact → client conversion | Explicit button with FICA/FNA prompt modal | Prevents creating insurance records without compliance awareness |
| Accounting invoice creation | Step-by-step wizard (bill-to → line items → preview → send) | Reduces errors; forces VAT category selection per line |
| Accounting line items | Free-text description + COA account picker | Flexible enough for service businesses; still maps to ledger |
| Trial balance display | Full account list with debit/credit columns | Standard accountant expectation; export-ready |
| Accounting vs. insurance quotes | Separate modules with cross-link | Insurance quotes are FAIS-regulated; accounting quotes are commercial documents |
