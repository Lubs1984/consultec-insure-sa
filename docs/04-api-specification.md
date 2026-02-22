# API Specification

**Project:** InsureConsultec — SA Insurance Agent Lifecycle SaaS
**Framework:** Fastify v5 + TypeScript
**Base URL:** `https://api.insureconsultec.co.za/v1`
**Auth:** Bearer JWT in `Authorization` header; refresh token in httpOnly cookie
**Version:** 1.0
**Date:** February 2026

---

## 1. Conventions

### Request Format
- `Content-Type: application/json`
- All IDs: UUID strings
- Dates: ISO 8601 (`YYYY-MM-DD`)
- Timestamps: ISO 8601 with timezone (`2026-02-21T08:00:00+02:00`)
- Currency: ZAR decimal string (`"15000.00"`)
- Pagination: `?page=1&limit=25` (default limit: 25, max: 100)

### Response Format
```json
{
  "data": {},
  "meta": { "page": 1, "limit": 25, "total": 150, "totalPages": 6 }
}
```

### Error Format
```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [{ "field": "id_number", "message": "Must be 13 digits" }],
  "requestId": "req_abc123"
}
```

### Role Abbreviations (used in permission column)
- `SA` = super_admin
- `FO` = fsp_owner
- `KI` = key_individual
- `CO` = compliance_officer
- `AG` = agent
- `AS` = assistant

---

## 2. Authentication — `/auth`

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/auth/register-tenant` | Create new FSP tenant + first owner user | Public |
| POST | `/auth/login` | Email + password login | Public |
| POST | `/auth/refresh` | Refresh access token using cookie | Public |
| POST | `/auth/logout` | Invalidate refresh token | Any |
| POST | `/auth/forgot-password` | Request password reset email | Public |
| POST | `/auth/reset-password` | Reset password using token | Public |
| GET | `/auth/me` | Get current user + tenant context | Any |
| PATCH | `/auth/me` | Update own profile (name, phone, avatar) | Any |
| PATCH | `/auth/me/password` | Change own password | Any |

### POST `/auth/register-tenant`
```json
// Request
{
  "fsp_name": "ABC Brokers (Pty) Ltd",
  "slug": "abc-brokers",
  "fsca_licence_number": "FSP12345",
  "fsp_category": "I",
  "owner_first_name": "John",
  "owner_last_name": "Smith",
  "owner_email": "john@abcbrokers.co.za",
  "owner_password": "SecurePass123!"
}

// Response 201
{
  "data": {
    "tenant": { "id": "...", "name": "...", "slug": "abc-brokers" },
    "user": { "id": "...", "email": "...", "role": "fsp_owner" },
    "access_token": "eyJ..."
  }
}
```

### POST `/auth/login`
```json
// Request
{ "email": "john@abcbrokers.co.za", "password": "SecurePass123!" }

// Response 200
{
  "data": {
    "access_token": "eyJ...",
    "user": { "id": "...", "email": "...", "role": "fsp_owner", "tenant_id": "..." }
  }
}
// + httpOnly cookie: refresh_token
```

---

## 3. Tenant Management — `/tenants`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/tenants/me` | Get current tenant profile | FO, KI, CO |
| PATCH | `/tenants/me` | Update tenant profile | FO |
| GET | `/tenants/me/users` | List all users in tenant | FO, KI |
| POST | `/tenants/me/users/invite` | Invite a new user | FO |
| PATCH | `/tenants/me/users/:userId` | Update user role / deactivate | FO |
| DELETE | `/tenants/me/users/:userId` | Remove user | FO |
| GET | `/admin/tenants` | List all tenants (platform) | SA |
| POST | `/admin/tenants` | Create tenant (admin) | SA |
| GET | `/admin/tenants/:id` | Get tenant detail | SA |
| PATCH | `/admin/tenants/:id` | Update tenant | SA |

---

## 4. Agents — `/agents`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/agents` | List all agents (paginated, filterable) | FO, KI, CO |
| POST | `/agents` | Create new agent (start onboarding) | FO, KI |
| GET | `/agents/:id` | Get agent detail | FO, KI, CO, AG (own) |
| PATCH | `/agents/:id` | Update agent details | FO, KI |
| DELETE | `/agents/:id` | Soft delete agent | FO |
| PATCH | `/agents/:id/status` | Transition agent status | FO, KI |
| GET | `/agents/:id/cpd` | Get CPD activities for agent | FO, KI, CO, AG (own) |
| POST | `/agents/:id/cpd` | Log a CPD activity | FO, KI, AG (own) |
| DELETE | `/agents/:id/cpd/:activityId` | Remove CPD entry | FO, KI |
| GET | `/agents/:id/documents` | Get agent's compliance documents | FO, KI, CO |
| GET | `/agents/register/export` | Export FSCA representative register | FO, KI, CO |
| POST | `/agents/:id/debarment/initiate` | Start debarment process | FO |
| PATCH | `/agents/:id/debarment/complete` | Complete debarment | FO |

### GET `/agents` Query Params
```
?status=active
&product_category=life
&search=john smith
&supervised_only=true
&page=1&limit=25
```

### POST `/agents` (Create)
```json
{
  "user_id": "uuid",             // Existing user or...
  "email": "agent@broker.co.za", // Create new user from here
  "first_name": "Sipho",
  "last_name": "Dlamini",
  "id_number": "8501015009087",
  "date_of_birth": "1985-01-01",
  "phone": "+27821234567",
  "nqf_level": 4,
  "qualification_description": "National Certificate in Short-Term Insurance",
  "authorised_products": ["life", "funeral", "short_term_personal"]
}
```

### PATCH `/agents/:id/status`
```json
{
  "status": "active",            // Target status (state machine validated)
  "reason": "Supervised period completed and signed off"
}
```

---

## 5. Clients — `/clients`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/clients` | List clients (paginated, filterable) | FO, KI, CO, AG (own) |
| POST | `/clients` | Create new client | AG, KI, AS |
| GET | `/clients/:id` | Get client 360 view | AG (own/assigned), KI, CO |
| PATCH | `/clients/:id` | Update client details | AG (own), KI |
| DELETE | `/clients/:id` | Soft delete client | FO, KI |
| PATCH | `/clients/:id/assign` | Reassign client to different agent | FO, KI |
| GET | `/clients/:id/policies` | Get client's policies | AG, KI, CO |
| GET | `/clients/:id/quotes` | Get client's quotes | AG, KI |
| GET | `/clients/:id/claims` | Get client's claims | AG, KI, CO |
| GET | `/clients/:id/roas` | Get client's ROAs | AG, KI, CO |
| GET | `/clients/:id/needs-analyses` | Get client's FNAs | AG, KI |
| GET | `/clients/:id/fica` | Get FICA/CDD profile | AG, KI, CO |
| PATCH | `/clients/:id/fica` | Update FICA status | AG, KI |
| POST | `/clients/:id/consent` | Record consent event | AG, AS |
| GET | `/clients/:id/popia/export` | Export client's personal data (POPIA right) | FO, KI, CO |
| POST | `/clients/:id/popia/correction-request` | Log correction request | AG, KI |
| POST | `/clients/:id/popia/deletion-request` | Log deletion request | KI, CO |
| GET | `/clients/:id/dependants` | List dependants | AG, KI |
| POST | `/clients/:id/dependants` | Add dependant | AG, KI |
| PATCH | `/clients/:id/dependants/:depId` | Update dependant | AG, KI |
| DELETE | `/clients/:id/dependants/:depId` | Remove dependant | AG, KI |

### GET `/clients` Query Params
```
?agent_id=uuid
&search=thabo
&fica_status=pending
&has_active_policy=true
&province=gauteng
&page=1&limit=25
```

---

## 6. Leads — `/leads`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/leads` | List leads (pipeline view) | FO, KI, AG (own) |
| POST | `/leads` | Create new lead | AG, KI, AS |
| GET | `/leads/:id` | Get lead detail | AG (own), KI |
| PATCH | `/leads/:id` | Update lead info | AG (own), KI |
| DELETE | `/leads/:id` | Archive/delete lead | AG (own), KI |
| PATCH | `/leads/:id/status` | Move lead through pipeline | AG (own), KI |
| POST | `/leads/:id/convert` | Convert qualified lead to client | AG (own), KI |
| GET | `/leads/:id/activities` | Get activities log | AG (own), KI |
| POST | `/leads/:id/activities` | Log an activity (call, email, note) | AG, AS |
| PATCH | `/leads/:id/assign` | Reassign lead | FO, KI |

### PATCH `/leads/:id/status`
```json
{
  "status": "fna_scheduled",
  "note": "FNA booked for 2026-02-25 at 10:00"
}
```

### POST `/leads/:id/convert`
```json
{
  "client_since": "2026-02-21"
}
// Returns: { "data": { "client_id": "uuid" } }
```

---

## 7. Needs Analysis — `/needs-analyses`

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/needs-analyses` | Create new FNA | AG, KI |
| GET | `/needs-analyses/:id` | Get FNA detail | AG (own client), KI |
| PATCH | `/needs-analyses/:id` | Update FNA (while in draft) | AG (own), KI |
| POST | `/needs-analyses/:id/complete` | Mark FNA complete | AG, KI |
| GET | `/needs-analyses/:id/pdf` | Generate/download FNA PDF | AG (own), KI |

### POST `/needs-analyses`
```json
{
  "client_id": "uuid",
  "monthly_gross_income": 45000.00,
  "monthly_net_income": 32000.00,
  "total_assets": 850000.00,
  "total_liabilities": 320000.00,
  "monthly_expenses": 18000.00,
  "insurance_objectives": ["death_cover", "income_protection"],
  "risk_tolerance": "medium",
  "health_status": "good",
  "smoker": false,
  "chronic_conditions": [],
  "existing_life_cover": 500000.00,
  "existing_income_protection": 0,
  "existing_funeral_cover": 20000.00,
  "gap_analysis_notes": "Client has significant life cover gap given 3 dependants"
}
```

---

## 8. Quotes — `/quotes`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/quotes` | List quotes | AG (own), KI |
| POST | `/quotes` | Create quote | AG, KI |
| GET | `/quotes/:id` | Get quote detail | AG, KI |
| PATCH | `/quotes/:id` | Update quote | AG, KI |
| DELETE | `/quotes/:id` | Delete quote | AG (own), KI |
| PATCH | `/quotes/:id/status` | Update quote status | AG, KI |
| GET | `/quotes/compare` | Compare multiple quotes side-by-side | AG, KI |
| GET | `/clients/:clientId/quotes/comparison-pdf` | Generate comparison PDF | AG, KI |

### POST `/quotes`
```json
{
  "client_id": "uuid",
  "fna_id": "uuid",
  "insurer_name": "Sanlam",
  "product_category": "life",
  "product_name": "Sanlam Family Protector",
  "premium": 850.00,
  "premium_frequency": "monthly",
  "sum_insured": 1500000.00,
  "commission_rate": 0.75,
  "commencement_date": "2026-03-01",
  "waiting_period_days": 0,
  "exclusions": "Suicide within 24 months"
}
```

---

## 9. Policies — `/policies`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/policies` | List policies (filterable) | FO, KI, CO, AG (own) |
| POST | `/policies` | Create policy | AG, KI |
| GET | `/policies/:id` | Get policy detail | AG (own), KI, CO |
| PATCH | `/policies/:id` | Update policy details | AG (own), KI |
| DELETE | `/policies/:id` | Soft delete | FO, KI |
| PATCH | `/policies/:id/status` | Transition policy status | AG (own), KI |
| GET | `/policies/:id/beneficiaries` | List beneficiaries | AG, KI |
| POST | `/policies/:id/beneficiaries` | Add beneficiary | AG, KI |
| PATCH | `/policies/:id/beneficiaries/:bId` | Update beneficiary | AG, KI |
| DELETE | `/policies/:id/beneficiaries/:bId` | Remove beneficiary | AG, KI |
| GET | `/policies/:id/endorsements` | List endorsements | AG, KI |
| POST | `/policies/:id/endorsements` | Add endorsement | AG, KI |
| POST | `/policies/:id/lapse` | Record policy lapse | System, KI |
| POST | `/policies/:id/reinstate` | Initiate reinstatement | AG, KI |
| POST | `/policies/:id/cancel` | Cancel policy | AG, KI |
| POST | `/policies/:id/debit-order-failure` | Record failed collection | System, AG |
| GET | `/policies/renewals-due` | Policies due for renewal (30/60/90 days) | AG, KI |
| GET | `/policies/lapse-risk` | Policies at lapse risk | AG, KI, CO |

### PATCH `/policies/:id/status`
```json
{
  "status": "active",
  "effective_date": "2026-03-01",
  "reason": "Underwriting completed — accepted at standard rates"
}
```

### POST `/policies/:id/cancel`
```json
{
  "cancellation_date": "2026-03-31",
  "reason": "Client requested cancellation",
  "is_replacement": true,
  "replacement_policy_id": "uuid"  // Triggers RPAR requirement
}
```

---

## 10. Records of Advice — `/roas`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/roas` | List ROAs | AG (own), KI, CO |
| POST | `/roas` | Create ROA draft | AG, KI |
| GET | `/roas/:id` | Get ROA detail | AG (own), KI, CO |
| PATCH | `/roas/:id` | Update ROA (draft only) | AG (own), KI |
| POST | `/roas/:id/submit` | Submit for client signature | AG, KI |
| POST | `/roas/:id/sign/client` | Record client signature (in-app) | AG |
| POST | `/roas/:id/sign/agent` | Agent signs | AG |
| POST | `/roas/:id/file` | File ROA (starts 5-year retention) | KI, CO, AG |
| GET | `/roas/:id/pdf` | Generate/download ROA PDF | AG (own), KI, CO |
| POST | `/roas/:id/review` | KI/CO reviews and approves | KI, CO |
| GET | `/roas/:id/rpar` | Get associated RPAR | AG, KI |
| POST | `/roas/:id/rpar` | Create RPAR (if replacement) | AG, KI |
| PATCH | `/roas/:id/rpar` | Update RPAR | AG, KI |

### POST `/roas`
```json
{
  "client_id": "uuid",
  "policy_id": "uuid",
  "fna_id": "uuid",
  "advice_date": "2026-02-21",
  "financial_position_summary": "Client earns R45,000/month gross. Has 3 dependants. Total liabilities R320,000. Existing life cover R500,000. Monthly surplus R8,000.",
  "products_considered": [
    { "insurer": "Sanlam", "product": "Family Protector", "recommended": true },
    { "insurer": "Old Mutual", "product": "Max Life", "recommended": false, "rejection_reason": "Higher premium for same benefit" }
  ],
  "product_recommended": "Sanlam Family Protector",
  "recommendation_rationale": "Best premium-to-benefit ratio for client's budget. R1.5M cover at R850/month fills identified R1M gap.",
  "commission_disclosed": true,
  "commission_type": "initial",
  "commission_percentage": 0.75,
  "commission_rand_amount": 7650.00,
  "conflict_of_interest": "None",
  "conflict_disclosed": true,
  "risk_warnings": "Policy lapses if premium not paid within 30-day grace period. 24-month exclusion period for suicide.",
  "is_replacement": false
}
```

---

## 11. Claims — `/claims`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/claims` | List claims (filterable) | AG (own), KI, CO |
| POST | `/claims` | Register FNOL | AG, KI, AS |
| GET | `/claims/:id` | Get claim detail | AG (own), KI, CO |
| PATCH | `/claims/:id` | Update claim details | AG, KI |
| PATCH | `/claims/:id/status` | Update claim status | AG, KI |
| POST | `/claims/:id/document-checklist` | Update document checklist | AG, KI, AS |
| POST | `/claims/:id/escalate-ombud` | Escalate to Ombudsman | AG, KI |
| PATCH | `/claims/:id/outcome` | Record claim outcome | AG, KI |

### POST `/claims` (FNOL)
```json
{
  "policy_id": "uuid",
  "claim_type": "death",
  "fnol_date": "2026-02-21",
  "incident_date": "2026-02-20",
  "incident_description": "Policyholder passed away on 2026-02-20 at Groote Schuur Hospital",
  "claimant_name": "Nomsa Dlamini",
  "claimant_id_number": "9203150123081",
  "claimant_relationship": "spouse",
  "claimant_phone": "+27721234567",
  "claimant_email": "nomsa@email.co.za"
}
```

### POST `/claims/:id/escalate-ombud`
```json
{
  "ombud_type": "long_term_insurance_ombud",
  "lodged_date": "2026-02-21",
  "reference": "LTO-2026-12345",
  "reason": "Insurer repudiated claim citing material non-disclosure without sufficient evidence"
}
```

---

## 12. Commissions — `/commissions`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/commissions` | List commissions (filterable by agent, period, insurer) | FO, KI, AG (own) |
| GET | `/commissions/:id` | Get commission detail | FO, KI, AG (own) |
| POST | `/commission-statements` | Import commission statement (CSV) | FO, KI |
| GET | `/commission-statements` | List statements | FO, KI |
| GET | `/commission-statements/:id` | Get statement detail + line items | FO, KI |
| GET | `/commissions/clawback-watch` | Policies within 2-year clawback period | FO, KI |
| GET | `/commissions/summary` | Agent/FSP earnings summary | FO, KI, AG (own) |
| POST | `/commission-structures` | Create commission structure | FO |
| GET | `/commission-structures` | List structures | FO, KI |
| PATCH | `/commission-structures/:id` | Update structure | FO |

### GET `/commissions/summary` Response
```json
{
  "data": {
    "period": "2026-02",
    "agent_id": "uuid",
    "new_business": 25000.00,
    "renewal": 8500.00,
    "broker_fees": 1200.00,
    "clawback_deductions": -3500.00,
    "net_payable": 31200.00,
    "by_product_category": {
      "life": 18000.00,
      "short_term_personal": 7000.00,
      "medical_aid": 6200.00
    },
    "clawback_exposure": {
      "total_at_risk": 45000.00,
      "policies_in_year_1": 12,
      "policies_in_year_2": 8
    }
  }
}
```

---

## 13. Compliance — `/compliance`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/compliance/dashboard` | Compliance KPI dashboard | KI, CO |
| GET | `/compliance/roa-status` | Policies missing/incomplete ROAs | KI, CO |
| GET | `/compliance/cpd-status` | All agents' CPD progress | KI, CO |
| GET | `/compliance/fica-status` | Clients with incomplete/expired FICA | KI, CO |
| GET | `/compliance/debarment-checks` | Agents' overdue debarment checks | KI, CO |
| GET | `/compliance/complaints` | Complaint register | KI, CO |
| POST | `/compliance/complaints` | Log new complaint | KI, CO, AG |
| GET | `/compliance/complaints/:id` | Get complaint detail | KI, CO |
| PATCH | `/compliance/complaints/:id` | Update complaint | KI, CO |
| POST | `/compliance/complaints/:id/resolve` | Mark complaint resolved | KI, CO |
| GET | `/compliance/representative-register` | FSCA Section 13 register | KI, CO, FO |

### GET `/compliance/dashboard` Response
```json
{
  "data": {
    "roa": {
      "total_active_policies": 245,
      "policies_with_filed_roa": 238,
      "compliance_rate_pct": 97.1,
      "overdue_roas": 7
    },
    "fica": {
      "total_active_clients": 312,
      "fully_verified": 290,
      "poa_expiring_30_days": 14,
      "pending_cdd": 8
    },
    "cpd": {
      "agents_on_track": 8,
      "agents_at_risk": 2,
      "agents_non_compliant": 0
    },
    "debarment_checks": {
      "overdue_30_days": 0,
      "overdue_90_days": 0
    },
    "open_complaints": 2,
    "active_ombud_cases": 1
  }
}
```

---

## 14. Documents — `/documents`

| Method | Path | Description | Roles |
|---|---|---|---|
| POST | `/documents/upload` | Upload a document (multipart) | Any |
| GET | `/documents/:id` | Get document metadata | Any (within tenant) |
| GET | `/documents/:id/download` | Get pre-signed download URL (15 min) | Any |
| DELETE | `/documents/:id` | Delete document (blocked if in retention) | FO, KI |
| GET | `/documents` | List documents (filterable) | FO, KI, CO |

### POST `/documents/upload` (multipart)
```
Fields:
  category: "roa" | "fica_id" | ... (document_category enum)
  client_id: uuid (optional)
  agent_id: uuid (optional)
  policy_id: uuid (optional)
  claim_id: uuid (optional)
  roa_id: uuid (optional)
  description: "ROA for Sipho Dlamini - Sanlam Life Cover"
  file: <binary>
```

---

## 15. Reports — `/reports`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/reports/book-of-business` | All clients + policies export | FO, KI, CO |
| GET | `/reports/agent-performance` | Per-agent KPIs | FO, KI |
| GET | `/reports/renewal-pipeline` | Upcoming renewals | AG, KI, FO |
| GET | `/reports/lapse-report` | Lapses YTD with analysis | KI, FO, CO |
| GET | `/reports/claims-status` | All open claims | AG, KI, CO |
| GET | `/reports/commission-reconciliation` | Commission vs. expected | FO, KI |
| GET | `/reports/popia-request-log` | Data subject rights log | CO, KI |
| GET | `/reports/fsca-register` | FSCA representative register (download) | FO, KI, CO |

### Query Params (common)
```
?format=json          # default
&format=csv           # CSV download
&format=pdf           # PDF download
&date_from=2026-01-01
&date_to=2026-02-28
&agent_id=uuid
```

---

## 16. Notifications — `/notifications`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/notifications` | Get own notifications | Any |
| PATCH | `/notifications/:id/read` | Mark as read | Any |
| POST | `/notifications/mark-all-read` | Mark all read | Any |
| GET | `/notifications/preferences` | Get notification preferences | Any |
| PATCH | `/notifications/preferences` | Update preferences | Any |

---

## 17. Tasks — `/tasks`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/tasks` | Get own tasks (filterable) | Any |
| POST | `/tasks` | Create task | Any |
| GET | `/tasks/:id` | Get task detail | Any |
| PATCH | `/tasks/:id` | Update task | Any (own or KI) |
| PATCH | `/tasks/:id/status` | Change task status | Any (own or KI) |
| DELETE | `/tasks/:id` | Delete task | Any (own or KI) |

---

## 18. Webhook Entry Points (Phase 2)

These endpoints are designed but stubbed in v1:

| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/hippo` | Receive quote leads from Hippo |
| POST | `/webhooks/compare-guru` | Receive quote leads from CompareGuru |
| POST | `/webhooks/docusign` | DocuSign signature completion events |

---

## 19. Health & Internal

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check | Public |
| GET | `/health/ready` | Readiness check (DB + Redis) | Public |

---

## 20. Rate Limiting

| Route Group | Limit |
|---|---|
| `/auth/login` | 10 requests / 15 minutes per IP |
| `/auth/forgot-password` | 5 requests / hour per IP |
| General API | 300 requests / minute per tenant |
| File uploads | 50 uploads / hour per user |
| Report exports | 20 exports / hour per user |

---

## 21. CRM — Pipelines & Stages — `/crm/pipelines`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/crm/pipelines` | List all pipelines | All |
| POST | `/crm/pipelines` | Create pipeline | FSP_OWNER, KI |
| GET | `/crm/pipelines/:id` | Get pipeline with stages | All |
| PATCH | `/crm/pipelines/:id` | Update pipeline | FSP_OWNER, KI |
| DELETE | `/crm/pipelines/:id` | Archive pipeline | FSP_OWNER |
| GET | `/crm/pipelines/:id/stages` | List stages | All |
| POST | `/crm/pipelines/:id/stages` | Create stage | FSP_OWNER, KI |
| PATCH | `/crm/pipelines/:id/stages/:stageId` | Update stage | FSP_OWNER, KI |
| DELETE | `/crm/pipelines/:id/stages/:stageId` | Delete stage (if no deals) | FSP_OWNER |
| PATCH | `/crm/pipelines/:id/stages/reorder` | Reorder stages (array of IDs) | FSP_OWNER, KI |

### POST `/crm/pipelines`
```json
{
  "name": "New Business",
  "description": "Prospecting to policy placement",
  "pipeline_type": "deals"
}
```

---

## 22. CRM — Deals — `/crm/deals`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/crm/deals` | List deals (filterable by pipeline, stage, assigned_to, status) | All |
| POST | `/crm/deals` | Create deal | AG, KI, FSP_OWNER |
| GET | `/crm/deals/:id` | Get deal detail with activities, contacts | All |
| PATCH | `/crm/deals/:id` | Update deal fields | AG (own), KI, FSP_OWNER |
| DELETE | `/crm/deals/:id` | Archive deal | AG (own), KI, FSP_OWNER |
| PATCH | `/crm/deals/:id/stage` | Move deal to different stage | AG (own), KI, FSP_OWNER |
| POST | `/crm/deals/:id/contacts` | Link contact to deal | AG (own), KI |
| DELETE | `/crm/deals/:id/contacts/:contactId` | Unlink contact | AG (own), KI |
| GET | `/crm/deals/board` | Kanban board view (grouped by stage, per pipeline) | All |

### POST `/crm/deals`
```json
{
  "pipeline_id": "uuid",
  "stage_id": "uuid",
  "title": "Sipho Nkosi — Life Cover",
  "value": 1250.00,
  "probability": 60,
  "expected_close_date": "2026-04-30",
  "client_id": "uuid",
  "assigned_to": "uuid"
}
```

### GET `/crm/deals/board`
```json
{
  "pipeline": { "id": "uuid", "name": "New Business" },
  "stages": [
    {
      "id": "uuid",
      "name": "Prospect",
      "sort_order": 0,
      "wip_limit": 10,
      "deals": [
        {
          "id": "uuid",
          "title": "Sipho Nkosi — Life Cover",
          "value": 1250.00,
          "probability": 60,
          "assigned_to": { "id": "uuid", "name": "Thandeka Dlamini" },
          "expected_close_date": "2026-04-30",
          "last_activity_at": "2026-02-20T09:00:00Z",
          "is_stuck": false,
          "tags": ["life", "high_value"]
        }
      ]
    }
  ]
}
```

---

## 23. CRM — Contacts — `/crm/contacts`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/crm/contacts` | List contacts (search, filter by tags, assigned_to) | All |
| POST | `/crm/contacts` | Create contact | AG, KI, FSP_OWNER |
| GET | `/crm/contacts/:id` | Get contact with full timeline | All |
| PATCH | `/crm/contacts/:id` | Update contact | AG (own), KI, FSP_OWNER |
| DELETE | `/crm/contacts/:id` | Archive contact | KI, FSP_OWNER |
| POST | `/crm/contacts/:id/convert` | Convert contact → insurance client (triggers FICA/FNA prompts) | AG, KI |

---

## 24. CRM — Organisations — `/crm/organizations`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/crm/organizations` | List organisations | All |
| POST | `/crm/organizations` | Create organisation | AG, KI, FSP_OWNER |
| GET | `/crm/organizations/:id` | Get org with contacts and deals | All |
| PATCH | `/crm/organizations/:id` | Update | AG (own), KI, FSP_OWNER |
| DELETE | `/crm/organizations/:id` | Archive | KI, FSP_OWNER |

---

## 25. CRM — Activities — `/crm/activities`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/crm/activities` | List activities (filter: assigned_to, is_done, due_date, type) | All |
| POST | `/crm/activities` | Log activity | AG, KI, FSP_OWNER |
| GET | `/crm/activities/:id` | Get activity detail | All |
| PATCH | `/crm/activities/:id` | Update activity | AG (own), KI |
| PATCH | `/crm/activities/:id/complete` | Mark as done | AG (own), KI |
| DELETE | `/crm/activities/:id` | Delete activity | AG (own), KI |
| GET | `/crm/activities/calendar` | Calendar view (date range, assigned_to) | All |

### POST `/crm/activities`
```json
{
  "activity_type": "call",
  "subject": "Discovery call — life cover needs",
  "deal_id": "uuid",
  "contact_id": "uuid",
  "scheduled_at": "2026-02-25T10:00:00Z",
  "assigned_to": "uuid",
  "description": "Discuss increasing death benefit and adding income protection"
}
```

---

## 26. CRM — Automation — `/crm/automations`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/crm/automations` | List automation rules | FSP_OWNER, KI |
| POST | `/crm/automations` | Create rule | FSP_OWNER, KI |
| PATCH | `/crm/automations/:id` | Update rule | FSP_OWNER, KI |
| PATCH | `/crm/automations/:id/toggle` | Enable / disable | FSP_OWNER, KI |
| DELETE | `/crm/automations/:id` | Delete rule | FSP_OWNER |

---

## 27. Accounting — Chart of Accounts — `/accounting/accounts`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/accounts` | Full COA list (tree structure) | FSP_OWNER, KI, CO |
| POST | `/accounting/accounts` | Create account | FSP_OWNER, KI |
| PATCH | `/accounting/accounts/:id` | Update account | FSP_OWNER, KI |
| DELETE | `/accounting/accounts/:id` | Deactivate (if no transactions) | FSP_OWNER |
| POST | `/accounting/accounts/seed` | Seed SA standard COA template | FSP_OWNER |

---

## 28. Accounting — Financial Years — `/accounting/years`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/years` | List financial years | FSP_OWNER, KI |
| POST | `/accounting/years` | Create financial year | FSP_OWNER |
| PATCH | `/accounting/years/:id/close` | Close year (locks all journals) | FSP_OWNER |

---

## 29. Accounting — Invoices — `/accounting/invoices`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/invoices` | List invoices (filter: status, client, date range) | All |
| POST | `/accounting/invoices` | Create invoice | AG, KI, FSP_OWNER |
| GET | `/accounting/invoices/:id` | Get invoice detail with line items | All |
| PATCH | `/accounting/invoices/:id` | Update (draft only) | AG (own), KI, FSP_OWNER |
| POST | `/accounting/invoices/:id/send` | Mark as sent; email to client | AG (own), KI, FSP_OWNER |
| POST | `/accounting/invoices/:id/void` | Void invoice | KI, FSP_OWNER |
| POST | `/accounting/invoices/:id/credit-note` | Create credit note against invoice | KI, FSP_OWNER |
| GET | `/accounting/invoices/:id/pdf` | Download tax invoice PDF | All |

### POST `/accounting/invoices`
```json
{
  "financial_year_id": "uuid",
  "invoice_date": "2026-02-21",
  "due_date": "2026-03-06",
  "client_id": "uuid",
  "payment_terms": "Net 14",
  "line_items": [
    {
      "description": "Financial Planning Consultation (2hrs @ R750/hr)",
      "quantity": 2,
      "unit_price": 750.00,
      "vat_rate": 15.00,
      "vat_category": "standard_rated",
      "coa_account_id": "uuid"
    },
    {
      "description": "Short-Term Insurance Advice Fee",
      "quantity": 1,
      "unit_price": 500.00,
      "vat_rate": 0.00,
      "vat_category": "exempt",
      "coa_account_id": "uuid"
    }
  ]
}
```

---

## 30. Accounting — Payments — `/accounting/payments`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/payments` | List payments | FSP_OWNER, KI |
| POST | `/accounting/payments` | Record payment | KI, FSP_OWNER |
| GET | `/accounting/payments/:id` | Get payment detail + allocations | FSP_OWNER, KI |
| POST | `/accounting/payments/:id/allocate` | Allocate payment to invoice(s) | KI, FSP_OWNER |
| PATCH | `/accounting/payments/:id/void` | Void payment | FSP_OWNER |

---

## 31. Accounting — Bank Accounts & Transactions — `/accounting/bank`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/bank/accounts` | List bank accounts | FSP_OWNER, KI |
| POST | `/accounting/bank/accounts` | Create bank account | FSP_OWNER |
| PATCH | `/accounting/bank/accounts/:id` | Update account details | FSP_OWNER |
| GET | `/accounting/bank/accounts/:id/transactions` | List transactions (filter: date, reconciled) | FSP_OWNER, KI |
| POST | `/accounting/bank/accounts/:id/transactions` | Manual transaction entry | KI, FSP_OWNER |
| POST | `/accounting/bank/accounts/:id/import` | CSV import (auto-match to payments) | KI, FSP_OWNER |
| GET | `/accounting/bank/accounts/:id/reconciliations` | List reconciliations | FSP_OWNER, KI |
| POST | `/accounting/bank/accounts/:id/reconciliations` | Start reconciliation | KI, FSP_OWNER |
| PATCH | `/accounting/bank/accounts/:id/reconciliations/:reconId/lock` | Lock reconciliation | FSP_OWNER |

---

## 32. Accounting — Journal Entries — `/accounting/journals`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/journals` | List journals (filter: status, date, type) | FSP_OWNER, KI |
| POST | `/accounting/journals` | Create manual journal | KI, FSP_OWNER |
| GET | `/accounting/journals/:id` | Get journal with lines | FSP_OWNER, KI |
| PATCH | `/accounting/journals/:id` | Update draft journal | KI, FSP_OWNER |
| POST | `/accounting/journals/:id/post` | Post journal (validates balanced debits = credits) | KI, FSP_OWNER |
| POST | `/accounting/journals/:id/reverse` | Reverse posted journal | FSP_OWNER |

### POST `/accounting/journals`
```json
{
  "financial_year_id": "uuid",
  "entry_date": "2026-02-28",
  "description": "Prepaid insurance adjustment — Feb 2026",
  "reference": "JNL-2026-0047",
  "lines": [
    { "coa_account_id": "uuid", "description": "Prepaid insurance", "debit_amount": 2500.00, "credit_amount": 0.00 },
    { "coa_account_id": "uuid", "description": "Insurance expense", "debit_amount": 0.00, "credit_amount": 2500.00 }
  ]
}
```

---

## 33. Accounting — Expense Claims — `/accounting/expenses`

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/expenses` | List expense claims | All (own), KI, FSP_OWNER |
| POST | `/accounting/expenses` | Submit expense claim | AG, KI, FSP_OWNER |
| GET | `/accounting/expenses/:id` | Get claim with line items | Own, KI, FSP_OWNER |
| PATCH | `/accounting/expenses/:id` | Update (draft) | Own |
| POST | `/accounting/expenses/:id/submit` | Submit for approval | Own |
| POST | `/accounting/expenses/:id/approve` | Approve claim | KI, FSP_OWNER |
| POST | `/accounting/expenses/:id/reject` | Reject with reason | KI, FSP_OWNER |

---

## 34. Accounting — Reports

| Method | Path | Description | Roles |
|---|---|---|---|
| GET | `/accounting/reports/trial-balance` | Trial balance for a period | FSP_OWNER, KI |
| GET | `/accounting/reports/profit-loss` | P&L for a period | FSP_OWNER, KI |
| GET | `/accounting/reports/balance-sheet` | Balance sheet at a date | FSP_OWNER, KI |
| GET | `/accounting/reports/general-ledger` | GL transactions per account | FSP_OWNER, KI |
| GET | `/accounting/reports/vat` | VAT report — output vs. input tax | FSP_OWNER, KI |
| GET | `/accounting/reports/aged-receivables` | Outstanding invoices by age bucket | FSP_OWNER, KI |

All report endpoints accept:
- `?year_id=uuid` — financial year filter
- `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` — custom range
- `?format=json|csv|pdf` — export format

### GET `/accounting/reports/trial-balance` response
```json
{
  "period": { "from": "2026-01-01", "to": "2026-01-31" },
  "generated_at": "2026-02-21T10:00:00Z",
  "accounts": [
    {
      "account_code": "1000",
      "account_name": "Bank — FNB Business",
      "account_type": "asset",
      "opening_balance": 125000.00,
      "total_debits": 89500.00,
      "total_credits": 45200.00,
      "closing_balance": 169300.00
    }
  ],
  "totals": {
    "total_debits": 342100.00,
    "total_credits": 342100.00,
    "balanced": true
  }
}
```
