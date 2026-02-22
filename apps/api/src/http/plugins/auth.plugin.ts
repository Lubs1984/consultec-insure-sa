import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { config } from '../../config/config.js';
import type { JwtPayload } from '@insureconsultec/shared';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    tenantId: string;
    userRole: string;
  }
}

export const authPlugin = fp(async (app) => {
  // Register cookie plugin
  await app.register(cookie, {
    secret: config.JWT_REFRESH_SECRET,
    hook: 'onRequest',
  });

  // Register JWT plugin
  await app.register(jwt, {
    secret: config.JWT_ACCESS_SECRET,
    sign: {
      expiresIn: config.JWT_ACCESS_EXPIRY,
    },
  });

  // Decorate request with auth context
  app.decorateRequest('userId', '');
  app.decorateRequest('tenantId', '');
  app.decorateRequest('userRole', '');
});

/**
 * requireAuth hook — validates Bearer JWT and populates request context.
 * Apply to individual routes or route groups.
 */
export async function requireAuth(request: Parameters<typeof request.jwtVerify>[0] extends never ? never : any, reply: any) {
  try {
    const payload = await (request as any).jwtVerify<JwtPayload>();
    (request as any).userId = payload.sub;
    (request as any).tenantId = payload.tid;
    (request as any).userRole = payload.role;
  } catch {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid or expired token. Please log in again.',
        requestId: (request as any).id,
      },
    });
  }
}
