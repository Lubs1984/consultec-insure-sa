# ─── Build context is the monorepo root ────────────────────────────────────────
# Railway: set "Root Directory" = / (repo root), "Dockerfile Path" = apps/api/Dockerfile

# ── Stage 1: Builder ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# openssl required by Prisma engine binaries; pin pnpm version to match lockfile
RUN apk add --no-cache openssl && npm install -g pnpm@10.30.1 --quiet

# Copy everything (fast layer cache — .dockerignore excludes node_modules, .env)
COPY . .

# Install all deps (dev included — tsc + prisma CLI needed for build)
RUN pnpm install --frozen-lockfile

# Build shared types first, then API TypeScript
RUN pnpm --filter @insureconsultec/shared build
RUN pnpm --filter @insureconsultec/api build

# Generate Prisma client for linux/amd64 (Railway target)
RUN pnpm --filter @insureconsultec/api db:generate


# ── Stage 2: Production runner ──────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

# Copy the workspace node_modules (all deps, including prisma CLI for migrations)
COPY --from=builder /app/node_modules            ./node_modules

# Copy workspace manifests needed by pnpm to resolve workspace links
COPY --from=builder /app/pnpm-workspace.yaml     ./pnpm-workspace.yaml
COPY --from=builder /app/package.json            ./package.json

# Copy shared package (built JS + package.json for workspace resolution)
COPY --from=builder /app/packages/shared/dist    ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

# Copy API built output
COPY --from=builder /app/apps/api/dist           ./apps/api/dist
COPY --from=builder /app/apps/api/package.json   ./apps/api/package.json

# Copy Prisma schema + migration files (needed for migrate deploy at startup)
COPY --from=builder /app/apps/api/src/infrastructure/database/prisma \
                        ./apps/api/src/infrastructure/database/prisma

EXPOSE 3001

# 1. Apply any pending migrations (safe, idempotent)
# 2. Start the API server
CMD ["sh", "-c", \
  "./node_modules/.bin/prisma migrate deploy \
     --schema=./apps/api/src/infrastructure/database/prisma/schema.prisma \
  && node ./apps/api/dist/server.js"]

