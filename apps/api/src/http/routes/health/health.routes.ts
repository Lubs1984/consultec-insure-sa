import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', { logLevel: 'warn' }, async () => ({
    status: 'ok',
    service: 'insureconsultec-api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/health/ready', { logLevel: 'warn' }, async (_req, reply) => {
    // TODO: check DB + Redis connectivity
    return reply.send({
      status: 'ok',
      checks: {
        database: 'ok',
        redis: 'ok',
      },
    });
  });
}
