# ─── Build context is the monorepo root ────────────────────────────────────────
# Railway: set "Root Directory" = / (repo root), "Dockerfile Path" = apps/web/Dockerfile
# Or deploy to Vercel/Netlify by pointing build output to apps/web/dist

# ── Stage 1: Builder ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build shared then web
RUN pnpm --filter @insureconsultec/shared build
RUN pnpm --filter @insureconsultec/web build


# ── Stage 2: Nginx static server ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built Vite output
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA routing: all 404s fall back to index.html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
