# System Architecture

**Project:** InsureConsultec — SA Insurance Agent Lifecycle SaaS
**Version:** 1.0
**Date:** February 2026

---

## 1. Architecture Overview

InsureConsultec is a multi-tier, multi-tenant SaaS application deployed entirely on Railway. It follows a clean separation between the React frontend (static), Node.js API (stateless), and PostgreSQL database (stateful), with a separate background worker process for async jobs.

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAILWAY PLATFORM                         │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Web Service│    │  API Service │    │  Worker Service  │  │
│  │ React/Vite   │───▶│  Fastify/TS  │───▶│  BullMQ Worker   │  │
│  │ Static Build │    │  Port 3001   │    │  Node.js/TS      │  │
│  │  (Nginx)     │    │              │    │                  │  │
│  └──────────────┘    └──────┬───────┘    └────────┬─────────┘  │
│                             │                     │            │
│                    ┌────────▼─────────────────────▼────────┐   │
│                    │            PostgreSQL                  │   │
│                    │         (Railway managed)              │   │
│                    └───────────────────────────────────────┘   │
│                                                                 │
│                    ┌───────────────────────┐                    │
│                    │   Redis (Railway)     │                    │
│                    │   BullMQ job queues   │                    │
│                    └───────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
  Cloudflare R2         SendGrid API        Africa's Talking
  (Document storage)   (Email delivery)    (SMS delivery)
```

---

## 2. Repository Structure

**Monorepo** — single repository managed with `pnpm workspaces`.

```
insureconsultec/
├── apps/
│   ├── api/                        # Node.js Fastify API
│   │   ├── src/
│   │   │   ├── config/             # Environment config, constants
│   │   │   ├── db/                 # Prisma client, migrations
│   │   │   │   ├── migrations/
│   │   │   │   ├── schema.prisma
│   │   │   │   └── seed.ts
│   │   │   ├── modules/            # Feature modules (vertical slices)
│   │   │   │   ├── auth/
│   │   │   │   ├── tenants/
│   │   │   │   ├── agents/
│   │   │   │   ├── clients/
│   │   │   │   ├── leads/
│   │   │   │   ├── policies/
│   │   │   │   ├── quotes/
│   │   │   │   ├── needs-analysis/
│   │   │   │   ├── records-of-advice/
│   │   │   │   ├── claims/
│   │   │   │   ├── commissions/
│   │   │   │   ├── compliance/
│   │   │   │   ├── documents/
│   │   │   │   ├── notifications/
│   │   │   │   └── reports/
│   │   │   ├── shared/
│   │   │   │   ├── middleware/     # Auth, tenant, RBAC, rate-limit
│   │   │   │   ├── errors/         # Custom error classes
│   │   │   │   ├── utils/          # Helpers, formatters
│   │   │   │   └── storage/        # R2 client wrapper
│   │   │   ├── workers/            # BullMQ job processors
│   │   │   │   ├── queues.ts
│   │   │   │   ├── renewal.worker.ts
│   │   │   │   ├── lapse.worker.ts
│   │   │   │   ├── compliance.worker.ts
│   │   │   │   └── notification.worker.ts
│   │   │   └── server.ts           # Fastify app bootstrap
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                        # React + Vite + TypeScript
│       ├── src/
│       │   ├── assets/
│       │   ├── components/         # Shared UI components
│       │   │   ├── ui/             # Radix/shadcn base components
│       │   │   ├── forms/          # Reusable form components
│       │   │   ├── layout/         # Shell, sidebar, header
│       │   │   └── data-display/   # Tables, stats, charts
│       │   ├── features/           # Feature-level components (mirror API modules)
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── agents/
│       │   │   ├── clients/
│       │   │   ├── leads/
│       │   │   ├── policies/
│       │   │   ├── quotes/
│       │   │   ├── needs-analysis/
│       │   │   ├── records-of-advice/
│       │   │   ├── claims/
│       │   │   ├── commissions/
│       │   │   ├── compliance/
│       │   │   └── reports/
│       │   ├── hooks/              # Custom React hooks
│       │   ├── lib/                # API client (TanStack Query), utils
│       │   ├── store/              # Zustand global state
│       │   ├── types/              # Local TS types (extended from shared)
│       │   ├── router.tsx          # TanStack Router route tree
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                     # Shared TypeScript types + Zod schemas
│       ├── src/
│       │   ├── types/              # All domain types
│       │   ├── schemas/            # Zod validation schemas
│       │   ├── enums/              # Shared enums (PolicyStatus, etc.)
│       │   └── constants/          # FAIS limits, CPD targets, etc.
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
└── railway.toml                    # Railway deployment config
```

---

## 3. Technology Stack

### 3.1 Frontend — `apps/web`

| Concern | Technology | Rationale |
|---|---|---|
| Framework | React 19 | Ecosystem, SaaS UI patterns |
| Build tool | Vite 6 | Fast HMR, optimised production builds |
| Language | TypeScript 5 | Type safety, shared types with API |
| Routing | TanStack Router v1 | Type-safe routing, file-based, loader support |
| Server state | TanStack Query v5 | Caching, background refetch, optimistic updates |
| Client state | Zustand | Lightweight, simple global state (auth, tenant context) |
| UI components | shadcn/ui + Radix UI | Accessible, unstyled primitives, customisable |
| Styling | Tailwind CSS v4 | Utility-first, consistent with shadcn |
| Forms | React Hook Form + Zod | Shared Zod schemas from `packages/shared` |
| Tables | TanStack Table v8 | Headless, handles large data sets |
| Charts | Recharts | Lightweight, React-native charts |
| PDF client | react-pdf | View compliance documents |
| Date handling | date-fns | Lightweight, tree-shakeable |
| Icons | Lucide React | Consistent icon set |
| Testing | Vitest + Testing Library | Fast, TS-native |
| E2E testing | Playwright | Full browser automation |

### 3.2 API — `apps/api`

| Concern | Technology | Rationale |
|---|---|---|
| Framework | Fastify v5 | ~3x faster than Express, native schema validation, TypeScript |
| Language | TypeScript 5 | Type safety, shared types with frontend |
| ORM | Prisma 6 | Type-safe queries, migration management, PostgreSQL-first |
| Authentication | `@fastify/jwt` + `@fastify/cookie` | Stateless JWT with refresh token rotation |
| Authorisation | Custom RBAC middleware | Tenant + role checks on every route |
| Validation | Zod (shared schemas) + Fastify schema | Dual validation: Fastify schema (serialisation) + Zod (business logic) |
| Password hashing | bcrypt (12 rounds) | Industry standard |
| File uploads | `@fastify/multipart` | Streaming multipart uploads |
| Storage client | `@aws-sdk/client-s3` | S3-compatible (Cloudflare R2) |
| PDF generation | Puppeteer / `@react-pdf/renderer` | ROA, RPAR, FNA, report PDFs |
| Email | `@sendgrid/mail` | Transactional email |
| SMS | Africa's Talking SDK | SA local number SMS |
| Job queues | BullMQ + ioredis | Reliable async job processing |
| Testing | Jest + Supertest | API integration testing |
| Process management | Railway-native | No PM2 needed; Railway manages restarts |

### 3.3 Database — PostgreSQL

| Concern | Specification |
|---|---|
| Version | PostgreSQL 16 (Railway managed) |
| Multi-tenancy | `tenant_id UUID NOT NULL` on all core tables |
| Row-Level Security | Enabled on all tables; policy enforces `tenant_id` match |
| Connection pooling | PgBouncer (Railway add-on or PgBouncer layer) |
| Migrations | Prisma Migrate (tracked, versioned .sql files) |
| Backups | Railway daily automated backups + point-in-time recovery |
| Audit trail | `audit_logs` table — immutable append-only via trigger |
| Soft deletes | `deleted_at TIMESTAMPTZ` on all core entities |
| Indexes | Covering indexes on `tenant_id + status`, `tenant_id + agent_id`, `id_number` |
| Extensions | `uuid-ossp` (UUID generation), `pg_trgm` (text search on names) |

### 3.4 Infrastructure — Railway

| Service | Railway Config |
|---|---|
| Web (React) | Node.js Nginx static server — build `pnpm --filter web build`, serve `dist/` |
| API | Node.js — start `pnpm --filter api start` |
| Worker | Node.js — start `pnpm --filter api start:worker` (separate process) |
| Database | Railway PostgreSQL managed instance |
| Redis | Railway Redis managed instance (BullMQ queues) |
| Environment | Separate `staging` and `production` environments |
| Domains | `app.insureconsultec.co.za` (web) · `api.insureconsultec.co.za` (API) |
| CI/CD | Railway GitHub integration — auto-deploy on push to `main` |

---

## 4. Multi-Tenancy Design

### 4.1 Tenant Isolation Strategy

**Choice: Shared database, shared schema with `tenant_id` + PostgreSQL RLS**

Rationale:
- More cost-efficient than per-tenant databases at SaaS scale
- Easier to manage schema migrations across tenants (single migration run)
- Row-Level Security at PostgreSQL level means even a buggy ORM query cannot leak cross-tenant data
- Can be upgraded to per-tenant schemas for enterprise clients if required

### 4.2 Row-Level Security Implementation

```sql
-- Enable RLS on every tenant-scoped table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy — app connects as role 'app_user'
-- app sets current tenant via session variable
CREATE POLICY tenant_isolation ON clients
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- API middleware sets this before every query
-- In Prisma: use $executeRaw to set before queries
-- SET LOCAL app.current_tenant_id = '<uuid>';
```

### 4.3 Tenant Context in API

```typescript
// Middleware (simplified):
// 1. Decode JWT → extract tenant_id, user_id, role
// 2. Set on Fastify request context
// 3. Before each Prisma query: SET LOCAL app.current_tenant_id
// 4. All Prisma queries automatically filtered by RLS
```

### 4.4 Subdomain-Based Tenant Routing

- `{slug}.insureconsultec.co.za` → API resolves slug to `tenant_id` via `tenants.slug` lookup
- Tenant context injected into all subsequent requests
- Wildcard SSL certificate covers all subdomains

---

## 5. Authentication & Authorisation

### 5.1 Authentication Flow

```
User submits email + password
        │
        ▼
API: bcrypt verify password hash
        │
        ▼
Issue access token (JWT, 15 min expiry)
Issue refresh token (JWT, 7 days, stored in httpOnly cookie)
        │
        ▼
Frontend stores access token in memory (Zustand)
Refresh token in httpOnly cookie (sent automatically)
        │
        ▼
On access token expiry: auto-refresh via /auth/refresh endpoint
On refresh token expiry: redirect to login
```

### 5.2 JWT Payload

```typescript
interface JWTPayload {
  sub: string;          // user_id (UUID)
  tenant_id: string;    // tenant UUID
  role: UserRole;       // 'super_admin' | 'fsp_owner' | 'key_individual' | 'compliance_officer' | 'agent' | 'assistant'
  email: string;
  iat: number;
  exp: number;
}
```

### 5.3 Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| `super_admin` | All tenants, platform management, billing |
| `fsp_owner` | Full access within own tenant; user management; all reports |
| `key_individual` | All client/policy/ROA data; agent oversight; compliance dashboards |
| `compliance_officer` | Compliance dashboard; ROA review; document vault; complaint log; reports. No write access to policies |
| `agent` | Own clients/leads/policies/ROAs only; no access to other agents' data |
| `assistant` | Assigned clients only; no financial data (commissions); no document vault |

**Implementation:** Route-level `preHandler` hooks check role; resource-level checks compare `created_by` or `assigned_agent_id` to `request.user.id` for `agent` and `assistant` roles.

---

## 6. Module Architecture Pattern

Each module follows a consistent vertical slice pattern:

```
modules/policies/
├── policy.routes.ts        # Fastify route definitions + schemas
├── policy.service.ts       # Business logic + Prisma queries
├── policy.schema.ts        # Zod schemas (shared from packages/shared or local)
├── policy.types.ts         # Module-specific TypeScript types
└── policy.test.ts          # Integration tests
```

**No controllers** — Fastify handlers are thin; business logic lives in services.

---

## 7. State Machines

All status transitions are enforced in the service layer using a state machine utility. Invalid transitions throw a `400 Bad Request`.

```typescript
// packages/shared/src/state-machines/policy.machine.ts

export const POLICY_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
  draft:          ['submitted'],
  submitted:      ['underwriting', 'cancelled'],
  underwriting:   ['active', 'cancelled'],
  active:         ['amended', 'lapsed', 'cancelled'],
  amended:        ['active', 'lapsed', 'cancelled'],
  lapsed:         ['reinstated', 'cancelled'],
  reinstated:     ['active', 'lapsed', 'cancelled'],
  cancelled:      [],
};

export function assertValidTransition(
  from: PolicyStatus,
  to: PolicyStatus,
  machine: Record<PolicyStatus, PolicyStatus[]>
): void {
  if (!machine[from].includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}
```

State machines defined for:
- `PolicyStatus`
- `LeadStatus`
- `ClaimStatus`
- `ROAStatus`
- `AgentStatus`
- `FICAStatus`

---

## 8. Audit Log

Every mutation to a sensitive table writes an immutable audit record:

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      TEXT NOT NULL,  -- 'INSERT' | 'UPDATE' | 'DELETE'
  changed_by  UUID NOT NULL,  -- user_id
  old_data    JSONB,
  new_data    JSONB,
  metadata    JSONB,          -- IP address, user agent, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No UPDATE or DELETE allowed on audit_logs (enforced by GRANT + RLS)
```

PostgreSQL triggers (or Prisma middleware) emit audit records on INSERT/UPDATE/DELETE for:
`clients`, `policies`, `records_of_advice`, `commissions`, `agents`, `claims`, `fica_profiles`

---

## 9. Document Storage

All compliance documents are stored in Cloudflare R2 (S3-compatible):

```
Bucket: insureconsultec-documents-{env}
├── {tenant_id}/
│   ├── clients/{client_id}/
│   │   ├── fica/           # CDD documents (ID, POA)
│   │   └── consent/        # POPIA consent records
│   ├── agents/{agent_id}/
│   │   ├── re-exams/       # RE5/RE1 certificates
│   │   ├── cpd/            # CPD certificates
│   │   ├── saps/           # SAPS clearance
│   │   └── qualifications/ # NQF certificates
│   ├── policies/{policy_id}/
│   │   └── roa/            # Record of Advice PDFs
│   └── claims/{claim_id}/  # Claim documents
```

**Security:**
- Pre-signed URLs (15-minute expiry) for download — no public bucket exposure
- All uploads virus-scanned via ClamAV lambda (or Cloudflare integration)
- AES-256 server-side encryption (R2 native)
- Access logged per file per user in `audit_logs`

---

## 10. Background Worker Architecture

BullMQ with Railway Redis instance:

```typescript
// workers/queues.ts
export const queues = {
  renewals:     new Queue('renewals', { connection }),
  lapseRisk:    new Queue('lapse-risk', { connection }),
  compliance:   new Queue('compliance-checks', { connection }),
  notifications: new Queue('notifications', { connection }),
  pdf:          new Queue('pdf-generation', { connection }),
  clawback:     new Queue('clawback', { connection }),
};
```

**Scheduled jobs (cron-based via BullMQ repeat):**

| Job | Schedule | Description |
|---|---|---|
| `renewal-scan` | Daily 06:00 SAST | Find policies due for renewal in 60 days |
| `lapse-risk-scan` | Every 4 hours | Find policies with failed debit orders |
| `cpd-compliance-scan` | Weekly Monday 07:00 | Check agents' CPD hours vs. targets |
| `fica-expiry-scan` | Daily 07:00 | Find FICA docs approaching expiry |
| `roa-compliance-scan` | Daily 08:00 | Find active policies with no filed ROA |
| `clawback-expiry-scan` | Daily 06:30 | Find policies where 2-year clawback watch expires |
| `medical-aid-enrolment` | 1 Oct annually | Trigger open enrolment alerts |

---

## 11. PDF Generation Strategy

ROA, RPAR, FNA, commission statements, and reports are generated as PDFs server-side:

**Approach:** `@react-pdf/renderer` — write PDF templates as React components, render server-side in the API worker. Benefits: same TS/React skills used by frontend team; consistent with web components.

**Templates:**
- `ROADocument.tsx` — FAIS-mandated ROA layout
- `RPARDocument.tsx` — Replacement policy advice record
- `FNAReport.tsx` — Financial needs analysis report
- `CommissionStatement.tsx` — Monthly commission reconciliation
- `ClientPortfolio.tsx` — Client 360 report
- `RepresentativeRegister.tsx` — FSCA Section 13 register

All PDF templates include: FSP branding (logo, colour), FSCA licence number, date, page numbers, version.

---

## 12. Error Handling

### API Error Response Format

```typescript
interface APIError {
  statusCode: number;
  code: string;           // e.g. 'VALIDATION_ERROR', 'UNAUTHORIZED', 'INVALID_TRANSITION'
  message: string;        // Human-readable
  details?: unknown;      // Zod errors, field-level details
  requestId: string;      // Trace ID for debugging
}
```

### Error Classes

```
AppError (base)
├── ValidationError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── ConflictError (409)       — duplicate ID number, etc.
├── InvalidTransitionError (422) — state machine violations
├── RetentionViolationError (422) — FAIS 5-year deletion attempt
└── InternalError (500)
```

---

## 13. Environment Configuration

```bash
# apps/api/.env

# Database
DATABASE_URL="postgresql://user:pass@host:5432/insureconsultec"
DIRECT_URL="postgresql://user:pass@host:5432/insureconsultec"  # For Prisma migrations

# Redis
REDIS_URL="redis://default:pass@host:6379"

# JWT
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="insureconsultec-documents-prod"
R2_PUBLIC_URL="https://documents.insureconsultec.co.za"

# SendGrid
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="noreply@insureconsultec.co.za"

# Africa's Talking
AT_API_KEY="..."
AT_USERNAME="insureconsultec"
AT_SENDER_ID="InsureConsultec"

# DocuSign (Phase 2)
DOCUSIGN_INTEGRATION_KEY="..."
DOCUSIGN_SECRET="..."
DOCUSIGN_BASE_URL="https://demo.docusign.net/restapi"

# App
NODE_ENV="production"
PORT=3001
API_URL="https://api.insureconsultec.co.za"
WEB_URL="https://app.insureconsultec.co.za"
```

---

## 14. Deployment Pipeline

```
Developer pushes to feature branch
        │
        ▼
GitHub Actions: lint + test (Vitest + Jest)
        │
        ▼
Merge to 'develop' → Railway auto-deploy to STAGING
        │
        ▼
Manual QA + smoke tests on staging
        │
        ▼
Merge to 'main' → Railway auto-deploy to PRODUCTION
        │
        ▼
Railway runs: prisma migrate deploy → restart services
```

**Railway services per environment:**
- `insureconsultec-web-staging` / `insureconsultec-web-prod`
- `insureconsultec-api-staging` / `insureconsultec-api-prod`
- `insureconsultec-worker-staging` / `insureconsultec-worker-prod`
- `insureconsultec-db-staging` / `insureconsultec-db-prod`
- `insureconsultec-redis-staging` / `insureconsultec-redis-prod`
