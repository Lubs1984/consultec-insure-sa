import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { config } from '../../config/config.js';

export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
    redis: config.NODE_ENV !== 'development' ? undefined : undefined, // Use ioredis instance in prod
    keyGenerator: (req) => {
      // Rate limit by tenant if authenticated, otherwise by IP
      return (req as any).tenantId || req.ip;
    },
    errorResponseBuilder: (req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Retry after ${context.after}.`,
        requestId: req.id,
      },
    }),
  });
});
