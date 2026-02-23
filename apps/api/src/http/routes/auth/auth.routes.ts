import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../../../modules/auth/auth.service.js';
import { requireAuth } from '../../plugins/auth.plugin.js';
import {
  signAccessToken,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
} from '../../../lib/tokens.js';

// ── Zod schemas ──────────────────────────────────────────────────────────────

const RegisterTenantBody = z.object({
  companyName: z.string().min(2).max(120),
  slug: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  fspNumber: z.string().optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function refreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

async function issueTokens(
  app: FastifyInstance,
  authUser: Awaited<ReturnType<typeof authService.me>>,
  reply: any,
  request: any,
) {
  const accessToken = signAccessToken(app, {
    sub: authUser.id,
    tid: authUser.tenantId,
    role: authUser.role,
    email: authUser.email,
  });

  const rawRefresh = await authService.createRefreshToken(authUser.id, {
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip,
    expiresAt: refreshTokenExpiry(),
  });

  reply.setCookie(REFRESH_COOKIE_NAME, rawRefresh, REFRESH_COOKIE_OPTIONS);

  return {
    data: {
      accessToken,
      expiresIn: 900,
      user: {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        role: authUser.role,
        tenant: authUser.tenant,
      },
    },
  };
}

// ── Route handlers ───────────────────────────────────────────────────────────

/**
 * Auth routes — Sprint 0.3
 * POST /api/v1/auth/register-tenant
 * POST /api/v1/auth/login
 * POST /api/v1/auth/refresh
 * POST /api/v1/auth/logout
 * POST /api/v1/auth/forgot-password
 * POST /api/v1/auth/reset-password   (stub — Sprint 0.4)
 * GET  /api/v1/auth/me
 */
export async function authRoutes(app: FastifyInstance) {

  /** POST /register-tenant */
  app.post('/register-tenant', async (request, reply) => {
    const body = RegisterTenantSchema.parse(request.body);
    const authUser = await authService.registerTenant(body);
    const response = await issueTokens(app, authUser, reply, request);
    return reply.status(201).send(response);
  });

  /** POST /login */
  app.post('/login', async (request, reply) => {
    const body = LoginBody.parse(request.body);
    const authUser = await authService.login(body);
    const response = await issueTokens(app, authUser, reply, request);
    return reply.status(200).send(response);
  });

  /** POST /refresh */
  app.post('/refresh', async (request, reply) => {
    const rawToken: string | undefined = (request.cookies as any)?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      return reply.status(401).send({
        error: { code: 'UNAUTHENTICATED', message: 'No refresh token provided.' },
      });
    }
    const authUser = await authService.refresh(rawToken);
    const response = await issueTokens(app, authUser, reply, request);
    return reply.status(200).send(response);
  });

  /** POST /logout */
  app.post('/logout', async (request, reply) => {
    const rawToken: string | undefined = (request.cookies as any)?.[REFRESH_COOKIE_NAME];
    if (rawToken) await authService.logout(rawToken);
    reply.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_OPTIONS.path });
    return reply.status(204).send();
  });

  /** GET /me */
  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = await authService.me(request.userId, request.tenantId);
    return reply.status(200).send({ data: user });
  });

  /** POST /forgot-password */
  app.post('/forgot-password', async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);
    void email; // TODO Sprint 0.4: send reset email via SendGrid
    return reply.status(202).send({
      data: { message: 'If that email is registered, you will receive a reset link shortly.' },
    });
  });

  /** POST /reset-password — Sprint 0.4 */
  app.post('/reset-password', async (_request, reply) => {
    return reply.status(501).send({
      error: { code: 'NOT_IMPLEMENTED', message: 'Password reset available in Sprint 0.4.' },
    });
  });
}
