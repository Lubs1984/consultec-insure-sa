# Engineering Standards

**Project:** InsureConsultec — SA Insurance Agent Lifecycle SaaS
**Stack:** Node.js/Fastify/TypeScript · React/Vite/TypeScript · PostgreSQL · Railway
**Date:** February 2026
**Status:** Authoritative — all PRs must conform before merge

---

## Table of Contents

1. [Architecture — Clean Architecture Principles](#1-architecture--clean-architecture-principles)
2. [Naming Conventions](#2-naming-conventions)
3. [TypeScript Standards](#3-typescript-standards)
4. [API Layer Standards](#4-api-layer-standards)
5. [Database Standards](#5-database-standards)
6. [Security Standards](#6-security-standards)
7. [Frontend Standards](#7-frontend-standards)
8. [Testing Standards](#8-testing-standards)
9. [Error Handling Standards](#9-error-handling-standards)
10. [Logging & Observability Standards](#10-logging--observability-standards)
11. [Git & CI/CD Standards](#11-git--cicd-standards)
12. [Definition of Done Checklist](#12-definition-of-done-checklist)

---

## 1. Architecture — Clean Architecture Principles

### 1.1 Layer Definitions

InsureConsultec follows a strict four-layer clean architecture. Dependencies always point **inward**. Outer layers may depend on inner layers. Inner layers must never import from outer layers.

```
┌─────────────────────────────────────────┐
│  4. Infrastructure (outermost)          │
│     Fastify routes, Prisma, R2, Redis,  │
│     SendGrid, BullMQ adapters           │
├─────────────────────────────────────────┤
│  3. Interface Adapters                  │
│     Controllers, DTOs, Presenters,      │
│     Repository implementations          │
├─────────────────────────────────────────┤
│  2. Application (Use Cases)             │
│     Business workflows, orchestration,  │
│     no framework imports allowed        │
├─────────────────────────────────────────┤
│  1. Domain (innermost)                  │
│     Entities, Value Objects,            │
│     Domain Events, Repository interfaces│
│     Pure TypeScript — zero deps         │
└─────────────────────────────────────────┘
```

### 1.2 Directory Structure — API (`apps/api/src/`)

```
apps/api/src/
├── domain/                         # Layer 1 — pure domain
│   ├── entities/                   # e.g. Client.ts, Policy.ts
│   ├── value-objects/              # e.g. IdNumber.ts, ZarAmount.ts
│   ├── events/                     # e.g. PolicyLapsed.ts
│   ├── errors/                     # Domain-specific error classes
│   └── repositories/               # Repository interfaces (no impl)
│
├── application/                    # Layer 2 — use cases
│   ├── clients/
│   │   ├── CreateClientUseCase.ts
│   │   ├── GetClientUseCase.ts
│   │   └── ConvertLeadToClientUseCase.ts
│   ├── policies/
│   ├── roas/
│   └── ...                         # One folder per module
│
├── infrastructure/                 # Layer 3+4 — adapters + frameworks
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── repositories/           # PrismaClientRepository.ts etc.
│   ├── storage/                    # R2StorageAdapter.ts
│   ├── email/                      # SendGridEmailAdapter.ts
│   ├── sms/                        # AfricasTalkingSmsAdapter.ts
│   ├── queue/                      # BullMQAdapter.ts
│   └── pdf/                        # PdfGeneratorAdapter.ts
│
├── http/                           # Fastify layer (outermost)
│   ├── plugins/                    # auth, cors, helmet, rateLimit
│   ├── middleware/                 # tenantContext, requireAuth, requireRole
│   ├── routes/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts      # Route registration
│   │   │   ├── auth.controller.ts  # Thin — calls use case, formats response
│   │   │   ├── auth.schema.ts      # Zod input/output schemas
│   │   │   └── auth.test.ts        # Integration test co-located
│   │   ├── clients/
│   │   └── ...
│   └── server.ts
│
├── workers/                        # BullMQ workers (outermost)
│   ├── renewal.worker.ts
│   ├── lapse-risk.worker.ts
│   └── ...
│
└── config/                         # Typed env config
    └── config.ts
```

### 1.3 Use Case Pattern

Every business operation is a Use Case class. Controllers are thin and only:
1. Parse and validate input (via Zod schema)
2. Call the use case
3. Format the HTTP response

```typescript
// ✅ CORRECT — thin controller
export async function createClientHandler(req: FastifyRequest, reply: FastifyReply) {
  const dto = CreateClientSchema.parse(req.body);
  const result = await createClientUseCase.execute(dto, req.tenantId, req.userId);
  return reply.status(201).send(result);
}

// ❌ WRONG — business logic in route handler
export async function createClientHandler(req: FastifyRequest, reply: FastifyReply) {
  const existing = await prisma.client.findFirst({ where: { idNumber: req.body.idNumber } });
  if (existing) throw new Error('Duplicate');
  const client = await prisma.client.create({ data: req.body });
  // ... more logic
}
```

### 1.4 Repository Pattern

All database access flows through a repository interface defined in the domain layer, implemented in the infrastructure layer. Use cases depend on the **interface**, never on Prisma directly.

```typescript
// domain/repositories/IClientRepository.ts
export interface IClientRepository {
  findById(id: string, tenantId: string): Promise<Client | null>;
  findAll(filters: ClientFilters): Promise<PaginatedResult<Client>>;
  save(client: Client): Promise<Client>;
  softDelete(id: string, tenantId: string): Promise<void>;
}

// infrastructure/database/repositories/PrismaClientRepository.ts
export class PrismaClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaClient) {}
  // implementations...
}
```

### 1.5 Dependency Injection

Use constructor injection throughout. No service locators. No global singletons (except the Fastify instance).

```typescript
// ✅ CORRECT
export class CreateClientUseCase {
  constructor(
    private readonly clientRepo: IClientRepository,
    private readonly eventBus: IEventBus,
    private readonly auditLog: IAuditLogService,
  ) {}

  async execute(dto: CreateClientDto, tenantId: string, actorId: string): Promise<Client> {
    // ...
  }
}
```

### 1.6 Domain Events

State changes on domain entities emit typed domain events. The application layer subscribes to events to trigger side effects (notifications, audit logs, queue jobs). This decouples modules.

```typescript
// domain/events/PolicyLapsed.ts
export class PolicyLapsed {
  readonly occurredAt = new Date();
  constructor(
    public readonly policyId: string,
    public readonly tenantId: string,
    public readonly lapseDate: Date,
  ) {}
}
```

---

## 2. Naming Conventions

### 2.1 Files and Directories

| Artifact | Convention | Example |
|---|---|---|
| Directory | `kebab-case` | `needs-analyses/`, `crm-deals/` |
| Use Case file | `PascalCase` + `UseCase.ts` suffix | `CreateClientUseCase.ts` |
| Repository interface | `PascalCase` + `I` prefix + `Repository.ts` | `IClientRepository.ts` |
| Repository impl | `PascalCase` + `Repository.ts` | `PrismaClientRepository.ts` |
| Route file | module + `.routes.ts` | `clients.routes.ts` |
| Controller file | module + `.controller.ts` | `clients.controller.ts` |
| Zod schema file | module + `.schema.ts` | `clients.schema.ts` |
| Test file | co-located, same name + `.test.ts` | `clients.controller.test.ts` |
| Domain entity | `PascalCase.ts` | `Client.ts`, `Policy.ts` |
| Domain event | `PascalCase.ts` (past tense) | `PolicyLapsed.ts`, `ClientCreated.ts` |
| Domain error | `PascalCase` + `Error.ts` | `RetentionViolationError.ts` |
| Worker file | module + `.worker.ts` | `renewal.worker.ts` |
| Config file | `kebab-case.ts` | `config.ts`, `database.ts` |

### 2.2 TypeScript Identifiers

| Identifier | Convention | Example |
|---|---|---|
| Class | `PascalCase` | `CreateClientUseCase` |
| Interface | `PascalCase` with `I` prefix | `IClientRepository` |
| Type alias | `PascalCase` | `CreateClientDto`, `PaginatedResult<T>` |
| Enum | `PascalCase` (name) + `UPPER_SNAKE_CASE` (members) | `PolicyStatus.ACTIVE`, `UserRole.FSP_OWNER` |
| Function | `camelCase` (verb-first) | `createClient`, `calculateClawback` |
| Variable | `camelCase` | `clientId`, `monthlyPremium` |
| Constant (module-level immutable) | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE_BYTES`, `CLAWBACK_WATCH_DAYS` |
| React component | `PascalCase` | `ClientCard`, `PolicyStatusBadge` |
| React hook | `camelCase` with `use` prefix | `useClientDetail`, `usePolicyStatus` |
| Zod schema variable | `PascalCase` + `Schema` suffix | `CreateClientSchema`, `UpdatePolicySchema` |
| Boolean variable | prefix with `is`, `has`, `can`, `should` | `isActive`, `hasFiledRoa`, `canDelete` |

### 2.3 Database (PostgreSQL)

| Artifact | Convention | Example |
|---|---|---|
| Table | `snake_case`, plural | `clients`, `audit_logs`, `crm_deals` |
| Column | `snake_case` | `first_name`, `tenant_id`, `retain_until` |
| Primary key | always `id` with type `UUID` | `id UUID PRIMARY KEY` |
| Foreign key | referenced table (singular) + `_id` | `client_id`, `agent_id`, `policy_id` |
| Boolean column | `is_`, `has_`, `can_` prefix | `is_active`, `has_filed_roa`, `is_pep` |
| Timestamp column | `_at` suffix | `created_at`, `deleted_at`, `lapced_at` |
| Status/enum column | noun, no suffix | `status`, `role`, `product_category` |
| Index | `idx_` + table + `_` + columns | `idx_clients_tenant`, `idx_policies_renewal_date` |
| Trigger function | `fn_` + description | `fn_audit_trigger` |
| PostgreSQL enum type | `snake_case` | `policy_status`, `user_role` |

### 2.4 API Routes

| Pattern | Convention | Example |
|---|---|---|
| Resource collection | `kebab-case`, plural noun | `/clients`, `/records-of-advice` |
| Resource instance | collection + `/:id` | `/clients/:id` |
| Sub-resource | `/parent/:id/child` | `/clients/:id/policies` |
| Action on resource | `POST` to verb path | `POST /policies/:id/cancel` |
| No verbs in resource paths | Use HTTP method instead | ✅ `DELETE /documents/:id` not `POST /documents/:id/delete` |
| Query params | `camelCase` | `?pageSize=20&sortBy=createdAt` |
| Response envelope | always `{ data, meta?, error? }` | see section 4 |

### 2.5 Environment Variables

All `UPPER_SNAKE_CASE`. Grouped by service prefix:

```
DATABASE_URL
DIRECT_URL
REDIS_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
AT_API_KEY
AT_USERNAME
AT_SENDER_ID
API_PORT
API_URL
WEB_URL
NODE_ENV
```

### 2.6 Git Branches

| Branch | Purpose |
|---|---|
| `main` | Production — protected, no direct push |
| `develop` | Staging — all feature branches merge here |
| `feature/IC-{ticket}-short-description` | New feature |
| `fix/IC-{ticket}-short-description` | Bug fix |
| `chore/short-description` | Config, deps, non-code changes |
| `hotfix/IC-{ticket}-short-description` | Emergency prod fix |

### 2.7 Commit Messages (Conventional Commits)

```
<type>(<scope>): <short description in imperative mood>

[optional body]

[optional footer: closes IC-123]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`

Scope: module name — `auth`, `clients`, `policies`, `roas`, `crm`, `accounting`

```
# ✅ Good examples
feat(clients): add POPIA consent capture to create flow
fix(commissions): correct clawback calculation on Year 2 boundary
test(roas): add integration test for 5-year retention block
perf(policies): add covering index on renewal_date

# ❌ Bad examples
fixed stuff
update client
WIP
```

---

## 3. TypeScript Standards

### 3.1 Compiler Settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"]
  }
}
```

### 3.2 Rules

- **No `any`** — use `unknown` and narrow explicitly. ESLint `@typescript-eslint/no-explicit-any: error`.
- **No type assertions with `as`** unless narrowing from `unknown` — prefer type guards.
- **No non-null assertions (`!`)** unless the value is provably non-null within the scope and a comment explains why.
- **No `// @ts-ignore`** — fix the type problem instead.
- **Prefer `type` over `interface`** for data shapes and DTOs. Use `interface` only when extension or declaration merging is intentional.
- **Prefer `readonly`** on all DTO and entity properties that should not be mutated after construction.
- **Explicit return types** on all exported functions and class methods.
- **Enums from `packages/shared`** — all status/role/category enums live in the shared package and are imported in both API and web.

### 3.3 Zod — Input Validation

Every API endpoint input and output is validated with a Zod schema defined in the `.schema.ts` file. Schemas are the single source of truth for TypeScript types at the boundary:

```typescript
// clients.schema.ts
export const CreateClientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  idNumber: z.string().regex(/^\d{13}$/).refine(validateSaIdNumber, 'Invalid SA ID'),
  email: z.string().email().optional(),
  mobile: z.string().regex(/^(\+27|0)[6-8]\d{8}$/, 'Invalid SA mobile number').optional(),
  popiaConsentGiven: z.literal(true, { errorMap: () => ({ message: 'POPIA consent required' }) }),
});

export type CreateClientDto = z.infer<typeof CreateClientSchema>;
```

### 3.4 Immutability

Prefer immutable data structures. Use `Object.freeze` on constants. Use `readonly` arrays and tuples wherever mutation is not needed. Never mutate function arguments.

---

## 4. API Layer Standards

### 4.1 Standard Response Envelope

All API responses use a consistent envelope:

```typescript
// Success
{
  "data": { /* resource or array */ },
  "meta": {            // present on paginated lists
    "page": 1,
    "pageSize": 20,
    "total": 347,
    "totalPages": 18
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",       // machine-readable code
    "message": "Validation failed",   // human-readable summary
    "details": [                      // present on validation errors
      { "field": "idNumber", "message": "Invalid SA ID number" }
    ],
    "requestId": "req_01HT..."        // for support/debugging
  }
}
```

### 4.2 Error Codes (Standard Set)

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema validation failure |
| `UNAUTHENTICATED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Authenticated but insufficient role/ownership |
| `NOT_FOUND` | 404 | Resource does not exist (or RLS hides it) |
| `CONFLICT` | 409 | Duplicate (e.g., duplicate ID number) |
| `RETENTION_VIOLATION` | 409 | Attempted deletion within retention period |
| `STATE_MACHINE_VIOLATION` | 422 | Invalid status transition |
| `UNBALANCED_JOURNAL` | 422 | Debit ≠ Credit in journal entry |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error (no internal details leaked) |

### 4.3 Pagination

All list endpoints support:
- `?page=1` (1-based, default 1)
- `?pageSize=20` (default 20, max 100)
- `?sortBy=createdAt` (validated against allowed fields whitelist)
- `?sortOrder=asc|desc` (default `desc`)

### 4.4 Route Versioning

All routes are prefixed `/v1/`. Breaking changes introduce `/v2/`.

### 4.5 Idempotency

`POST` endpoints that create resources accept an optional `Idempotency-Key` header (UUID). Duplicate requests with the same key within 24 hours return the cached response without re-executing.

---

## 5. Database Standards

### 5.1 Migration Rules

- All schema changes via Prisma migrations — never raw DDL in production outside migrations.
- Migration filenames: Prisma auto-names them; add a `--name` describing the change: `prisma migrate dev --name add_clawback_watch_fields`.
- Every migration is reviewed in PR before merge.
- Migrations must be **backward-compatible** unless a coordinated deployment window is scheduled. Prefer expand-then-contract pattern (add new column → deploy → backfill → remove old column).
- No migration may drop or rename a column without explicit confirmation it is unused.

### 5.2 Row-Level Security (RLS)

- Every table that stores tenant data **must** have `tenant_id UUID NOT NULL REFERENCES tenants(id)`.
- Every such table **must** have RLS enabled and a policy enforcing `tenant_id = current_setting('app.current_tenant_id')::uuid`.
- The application always sets the tenant context as the **first statement** in a transaction via Prisma `$extends` / middleware — never as an afterthought.
- RLS is **tested independently** of application code in dedicated integration tests that connect directly to the DB as `app_user` with a manually set tenant context.
- `super_admin` role bypasses RLS only on the `tenants` table, not on tenant data tables.

### 5.3 Indexing Rules

- Every `tenant_id` column is part of a composite index with the most common filter column.
- Every foreign key column has an index.
- Every column used in `ORDER BY` on large tables has an index.
- GIN indexes on array columns (`TEXT[]`) used in containment queries.
- `pg_trgm` GIN index on name columns used in fuzzy search (`first_name`, `last_name`, `company_name`).
- No over-indexing — each index is justified by a specific query pattern.

### 5.4 Soft Deletes

All deletions are soft deletes using `deleted_at TIMESTAMPTZ` (NULL = active). Hard deletes are blocked by the application for any record with `retain_until > NOW()`. Hard deletes are only ever executed by a privileged `RetentionPurgeService` after the retention period expires, never by a user-facing API call.

### 5.5 Timestamps

Every table has `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`. `updated_at` is maintained by a PostgreSQL trigger on all tables (not relying solely on Prisma's `@updatedAt`).

### 5.6 Query Standards

- No `SELECT *` in any production query — always enumerate columns or use Prisma `select`.
- No N+1 queries — use `include` (Prisma) or `LEFT JOIN` with careful cardinality consideration.
- No unbounded queries — all list queries have `LIMIT` enforced.
- Transactions used for any operation that writes to more than one table.

---

## 6. Security Standards

### 6.1 Authentication

| Requirement | Implementation |
|---|---|
| Password hashing | `bcrypt` with cost factor 12 |
| Password minimum length | 12 characters; must contain upper, lower, digit, symbol |
| Access token | JWT, HS256, 15-minute expiry, signed with 256-bit secret |
| Refresh token | Opaque UUID, 7-day expiry, stored as `httpOnly; Secure; SameSite=Strict` cookie, hashed in DB |
| Refresh token rotation | Every use issues a new refresh token and invalidates the old one (rotation) |
| Token family detection | If a used (rotated-out) refresh token is presented again, the entire family is revoked (reuse detection) |
| Logout | Deletes refresh token from DB immediately |
| Password reset token | Cryptographically random 32-byte hex, 1-hour expiry, single-use, hashed in DB |
| Session management | Stateless (JWT) — no server-side session store |

### 6.2 Authorisation

```
Principle: Deny by default. Explicitly grant.
```

- Every route requires `requireAuth` — no public routes except `/auth/login`, `/auth/register-tenant`, `/auth/forgot-password`, `/auth/reset-password`, `/health`, `/health/ready`.
- Role hierarchy enforced at route and use-case level (not just one or the other).
- Agents have an additional `requireOwnResource` check — they can only read/write their own records, enforced at the application layer in addition to RLS.
- Super admin access is restricted to routes under `/admin` and requires an additional IP allowlist check in production.

### 6.3 Input Validation & Injection Prevention

- **All inputs validated** with Zod before reaching business logic — no raw `req.body` usage.
- **All database queries** via Prisma parameterised queries — raw SQL via `prisma.$queryRaw` is tagged template literal only (no string concatenation ever).
- **Path parameter IDs** validated as UUIDs before use.
- **File uploads**: type checked by MIME type + magic bytes (not just extension); max 25MB enforced; filename sanitised (no `../` traversal).
- **SQL injection**: impossible via Prisma parameterised queries; raw SQL usage is code-reviewed and tagged in PR.
- **XSS**: React escapes by default; `dangerouslySetInnerHTML` is banned by ESLint rule; CSP headers set via `@fastify/helmet`.
- **SSRF**: No fetch/axios calls to user-supplied URLs.

### 6.4 Transport Security

- HTTPS only — HTTP redirects to HTTPS, enforced by Railway + Cloudflare.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- TLS 1.2 minimum (TLS 1.3 preferred) — enforced at Cloudflare edge.
- All API ↔ DB connections over Railway internal network (private networking).

### 6.5 HTTP Security Headers (via `@fastify/helmet`)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; img-src 'self' data: https://storage.insureconsultec.co.za; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.insureconsultec.co.za
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### 6.6 Rate Limiting

| Endpoint Group | Limit | Window |
|---|---|---|
| `POST /auth/login` | 10 requests | 15 minutes per IP |
| `POST /auth/forgot-password` | 5 requests | 1 hour per IP |
| `POST /auth/register-tenant` | 3 requests | 1 hour per IP |
| General authenticated API | 300 requests | 1 minute per tenant |
| File uploads | 50 uploads | 1 hour per user |
| Report exports | 20 exports | 1 hour per user |
| PDF generation | 30 requests | 1 hour per user |

Limits are applied at the API gateway using `@fastify/rate-limit` with Redis backing (so limits persist across API instances).

### 6.7 Secrets Management

- All secrets in Railway environment variables — never in code or `.env` files committed to Git.
- `.env` files are in `.gitignore`. `.env.example` (no real values) is committed.
- Secrets are rotated every 90 days for production (calendar reminder in team calendar).
- JWT signing secrets are separate per environment (dev/staging/prod).
- Database credentials: separate Railway DB user per environment.
- No secret ever appears in API responses, logs, or error messages.
- ESLint `no-secrets` rule enabled to catch accidentally hardcoded credentials.

### 6.8 POPIA / Data Privacy Security Controls

- **Data minimisation**: Only fields required for FAIS compliance are collected. Optional fields use `OPTIONAL` label in UI.
- **Consent before capture**: No PII stored without confirmed POPIA consent (enforced in `CreateClientUseCase`).
- **Encryption at rest**: All documents in Cloudflare R2 with AES-256 SSE. DB at rest encrypted by Railway managed PostgreSQL.
- **Encryption in transit**: TLS 1.3 for all connections.
- **Access logging**: All reads of client PII logged to `audit_logs` with actor, timestamp, IP, and action.
- **Data subject rights**: POPIA subject access/deletion request workflow in compliance module triggers review queue — not automated bulk delete (FAIS retention overrides).
- **Breach detection**: Anomaly detection via Railway metrics + PagerDuty alerting on unusual query volumes or failed auth spikes.

### 6.9 Dependency Security

- `pnpm audit` runs on every CI build; HIGH and CRITICAL findings block merge.
- Dependabot / Renovate configured for automated patch-version PRs.
- No packages from unverified authors with < 100 weekly downloads without security review.
- `package-lock` / `pnpm-lock.yaml` committed and verified in CI.

### 6.10 Multi-Tenancy Security

- RLS enforced at PostgreSQL level — even if application code has a bug, the DB denies cross-tenant access.
- All `tenant_id` values come from the verified JWT claim, never from the request body/query.
- Subdomain-based tenant resolution (`{slug}.insureconsultec.co.za`) — slug resolved to `tenant_id` via DB lookup, cached in Redis for 5 minutes.
- Tenant slug validation: alphanumeric + hyphens only, 3–50 characters, no reserved words.

### 6.11 Audit Trail

- `audit_logs` table captures every create, update, delete on all business-critical tables.
- The DB trigger `fn_audit_trigger` fires at the DB level — application code cannot bypass it.
- `app_user` PostgreSQL role has `REVOKE UPDATE, DELETE ON audit_logs` — records are immutable.
- Audit records include: `tenant_id`, `actor_id`, `action` (`INSERT|UPDATE|DELETE`), `table_name`, `record_id`, `old_value` (JSONB), `new_value` (JSONB), `ip_address`, `occurred_at`.
- Audit log retention: 7 years (FAIS maximum).

---

## 7. Frontend Standards

### 7.1 Component Architecture

```
apps/web/src/
├── routes/                         # TanStack Router route files
│   ├── _auth/                      # Authenticated layout
│   │   ├── clients/
│   │   │   ├── index.tsx           # /clients list
│   │   │   └── $clientId/
│   │   │       └── index.tsx       # /clients/:id
│   │   └── ...
│   └── _public/                    # Public layout (login etc.)
│
├── components/
│   ├── ui/                         # shadcn/ui base components (do not edit)
│   ├── shared/                     # Cross-domain reusable components
│   │   ├── DataTable/
│   │   ├── StatusBadge/
│   │   ├── ConfirmModal/
│   │   └── ...
│   └── {module}/                   # Domain-specific components
│       └── clients/
│           ├── ClientCard.tsx
│           ├── ClientStatusBadge.tsx
│           └── ...
│
├── hooks/                          # Custom React hooks
│   ├── useClients.ts
│   ├── usePolicies.ts
│   └── ...
│
├── stores/                         # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
│
├── lib/
│   ├── api.ts                      # Axios/fetch instance with interceptors
│   ├── queryClient.ts              # TanStack Query client config
│   └── utils.ts                    # cn() and other utilities
│
└── types/                          # Frontend-only types (not in shared)
```

### 7.2 Component Rules

- **One component per file**. File name matches component name (`ClientCard.tsx` exports `ClientCard`).
- **Props interface** always defined explicitly (no inline type literals):
  ```typescript
  interface ClientCardProps {
    readonly client: ClientSummary;
    readonly onSelect: (id: string) => void;
  }
  ```
- **No prop drilling** beyond 2 levels — lift to context or Zustand store.
- **Server state** (API data) managed exclusively by TanStack Query. **Client state** (UI toggles, form state) managed by React state or Zustand.
- **No `useEffect` for data fetching** — use TanStack Query `useQuery`.
- **Every query has `staleTime`** set appropriately — never 0 for static reference data.
- **Loading states**: every data-dependent component renders a skeleton, not a spinner (non-layout-shifting).
- **Error states**: every `useQuery` error is displayed to the user — no silent failures.
- **Empty states**: every list page has an explicit empty state component with a call to action.

### 7.3 Styling Rules

- Tailwind CSS v4 utility classes only — no custom CSS files except for global base styles.
- No inline `style` props.
- Responsive breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px).
- All interactive elements have visible focus rings (`focus-visible:` classes).
- Colour tokens come from shadcn/ui CSS variables — no hardcoded hex/rgb values in JSX.
- Dark mode support via `dark:` variant classes throughout.

### 7.4 Forms

- All forms use `react-hook-form` with `@hookform/resolvers/zod` and the shared Zod schema.
- Submit button is disabled while submitting.
- Validation errors displayed inline next to the field (not a toast).
- Destructive actions (delete, debarment, cancel policy) require a confirmation modal with the action typed in a text field.

---

## 8. Testing Standards

### 8.1 Coverage Requirements

| Layer | Minimum Coverage | Tool |
|---|---|---|
| Domain (entities, value objects, use cases) | 90% branch | Vitest |
| API routes (integration) | All happy paths + key error paths | Vitest + Supertest |
| Frontend components | Smoke test on all interactive components | Vitest + Testing Library |
| E2E critical paths | 8 critical user journeys | Playwright |

### 8.2 Test File Organisation

- Unit/integration tests co-located with the file under test: `CreateClientUseCase.test.ts` next to `CreateClientUseCase.ts`.
- E2E tests in `apps/web/e2e/` directory.
- Test factories in `tests/factories/` — never use random auto-generated data without a seed.

### 8.3 Test Naming Convention

```
describe('CreateClientUseCase', () => {
  describe('when ID number is invalid', () => {
    it('throws ValidationError with field-level detail', async () => { ... });
  });
  describe('when POPIA consent is not given', () => {
    it('throws ValidationError stating consent required', async () => { ... });
  });
  describe('when all inputs are valid', () => {
    it('persists the client and emits ClientCreated event', async () => { ... });
  });
});
```

Pattern: `describe` = subject, nested `describe` = condition, `it` = expected behaviour (imperative).

### 8.4 No Magic in Tests

- No `setTimeout` in tests — use fake timers.
- No real HTTP calls in unit/integration tests — mock the interface boundaries.
- No real DB in unit tests — use in-memory test doubles.
- Integration tests **do** use a real test DB (separate from dev/prod) with transaction rollback after each test.

---

## 9. Error Handling Standards

### 9.1 Error Class Hierarchy

```typescript
// domain/errors/BaseError.ts
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

// domain/errors/RetentionViolationError.ts
export class RetentionViolationError extends BaseError {
  readonly code = 'RETENTION_VIOLATION';
  readonly httpStatus = 409;
  constructor(retainUntil: Date) {
    super(`Record cannot be deleted until ${retainUntil.toISOString()} (FAIS 5-year retention)`, { retainUntil });
  }
}
```

### 9.2 Error Propagation

- Domain errors thrown in use cases propagate to the Fastify error handler.
- The global error handler maps `BaseError` subclasses to the standard error envelope.
- Unexpected errors (not `BaseError`) are logged with full stack trace but the client receives only `INTERNAL_ERROR` with a `requestId` for support — no stack traces or internal messages ever sent to client.
- Never catch and swallow errors silently. Either re-throw, log, or handle explicitly.

---

## 10. Logging & Observability Standards

### 10.1 Log Levels

| Level | Usage |
|---|---|
| `fatal` | Process about to crash |
| `error` | Unexpected error (needs investigation) |
| `warn` | Expected error condition occurring unusually (too many retries, etc.) |
| `info` | Normal business event (request received, job completed) |
| `debug` | Developer-facing detail — disabled in production |

### 10.2 What to Log

**Always log:**
- Every inbound request: method, path, `requestId`, `tenantId`, `userId`, duration, status code
- Every outbound external call: service, method, duration, status
- Every background job start and completion (with duration)
- Every domain event emitted
- Every failed authentication attempt (with IP, no credential details)

**Never log:**
- Passwords, tokens, or secrets
- Full credit card numbers, banking details
- SA ID numbers (log masked version: `XXXXXXX####X`)
- Full request/response bodies containing PII — log only field names present, not values

### 10.3 Structured Logging

All logs are structured JSON (Pino defaults). Every log line includes:
```json
{
  "level": "info",
  "time": "2026-02-22T10:00:00.000Z",
  "requestId": "req_01HT...",
  "tenantId": "uuid",
  "userId": "uuid",
  "msg": "Client created successfully",
  "clientId": "uuid"
}
```

---

## 11. Git & CI/CD Standards

### 11.1 Branch Protection Rules (GitHub)

- `main`: require 2 approvals, require status checks (lint, test, build), no force push, no direct push.
- `develop`: require 1 approval, require status checks, no force push.

### 11.2 CI Pipeline (GitHub Actions)

Every PR runs:
1. `pnpm lint` — ESLint (zero warnings policy)
2. `pnpm typecheck` — `tsc --noEmit`
3. `pnpm test` — Vitest (must pass, coverage threshold enforced)
4. `pnpm build` — build API and web
5. `pnpm audit` — security audit (HIGH/CRITICAL = fail)

### 11.3 PR Standards

- PR title must follow Conventional Commits format.
- PR description must include: what changed, why, how to test, any migration steps.
- Screenshot/recording required for UI changes.
- Maximum 400 lines changed per PR (excluding generated files and migrations) — split larger changes.
- All review comments must be resolved before merge.
- Squash merge to `develop`; merge commit to `main` (for clean release history).

### 11.4 Deployment

- Every merge to `develop` → auto-deploys to staging (Railway).
- Every merge to `main` → auto-deploys to production (Railway).
- Prisma migrations run automatically as part of the Railway deployment start command: `prisma migrate deploy && node dist/server.js`.
- Zero-downtime deploys — Railway rolling restarts.
- Rollback: revert the commit and push; Railway redeploys the previous build.

---

## 12. Definition of Done Checklist

A task is **not done** until every item below is checked:

**Code Quality**
- [ ] TypeScript strict mode — zero `any`, zero `@ts-ignore`, zero type errors
- [ ] ESLint passes with zero warnings
- [ ] No `console.log` in committed code (use Pino logger)
- [ ] No hardcoded strings that should be constants or config

**Architecture**
- [ ] Business logic is in a Use Case class, not in a route handler
- [ ] DB access is via a Repository interface implementation
- [ ] New tables have RLS enabled and a tenant isolation policy
- [ ] New tables have `created_at`, `updated_at`, `tenant_id`

**Security**
- [ ] All inputs validated with Zod schema
- [ ] No raw SQL string concatenation
- [ ] No secret values in code
- [ ] Role/permission check added for new routes
- [ ] Sensitive data not included in logs or error responses

**Testing**
- [ ] Unit tests cover happy path and at least two error paths
- [ ] Integration test covers the HTTP route
- [ ] Tests pass in CI

**Data**
- [ ] Prisma migration committed
- [ ] Migration is backward-compatible (or deployment window documented)
- [ ] Indexes added for new filter/sort columns

**Frontend (if applicable)**
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented
- [ ] Mobile responsive (tested at 375px)
- [ ] Focus management correct for keyboard users (WCAG 2.1 AA)

**Documentation**
- [ ] API schema file updated (if new endpoint)
- [ ] Relevant spec document updated (if new behaviour)

**Deployment**
- [ ] Deployed to staging
- [ ] Smoke tested on staging
- [ ] PR reviewed and approved
- [ ] Merged to `develop`
