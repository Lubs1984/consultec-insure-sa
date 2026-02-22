import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../../infrastructure/database/prisma/prisma.client.js';

/**
 * tenantContext plugin
 *
 * Decodes the JWT (already verified by @fastify/jwt) and populates
 * `request.tenantId`, `request.userId`, and `request.userRole`
 * from the access token claims.
 *
 * auth.plugin registers the decorateRequest calls; this plugin simply
 * fills in the values on each authenticated request.
 *
 * MUST be registered after auth.plugin.
 */
export default fp(async function tenantContextPlugin(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return;

    try {
      const payload = await request.jwtVerify<{
        sub: string;
        tid: string;
        role: string;
      }>();
      request.userId = payload.sub;
      request.tenantId = payload.tid;
      request.userRole = payload.role;
    } catch {
      // Invalid / expired token — let requireAuth hooks send the 401
    }
  });
}, {
  name: 'tenant-context-plugin',
  dependencies: ['@fastify/jwt'],
});

// ── Row-Level-Security helpers ──────────────────────────────────────────────
// Until PostgreSQL RLS policies are applied via migrations, we enforce
// tenant isolation at the application layer by scoping every Prisma query
// with `tenantId`. These helpers make it ergonomic.

export function tenantScope(tenantId: string) {
  return { tenantId } as const;
}

export async function assertTenantOwnership(
  table: string,
  id: string,
  tenantId: string,
): Promise<void> {
  // Generic ownership check — each service will do its own typed check,
  // but this is useful for quick guards in route handlers.
  const model = (prisma as any)[table];
  if (!model) throw new Error(`Unknown Prisma model: ${table}`);
  const record = await model.findUnique({ where: { id }, select: { tenantId: true } });
  if (!record) {
    const err = new Error('Not found');
    (err as any).statusCode = 404;
    throw err;
  }
  if (record.tenantId !== tenantId) {
    const err = new Error('Forbidden');
    (err as any).statusCode = 403;
    throw err;
  }
}
