import Fastify from 'fastify';
import { config, isDev } from './config/config.js';

// Plugins
import { corsPlugin } from './http/plugins/cors.plugin.js';
import { helmetPlugin } from './http/plugins/helmet.plugin.js';
import { authPlugin } from './http/plugins/auth.plugin.js';
import tenantContextPlugin from './http/plugins/tenant-context.plugin.js';
import { rateLimitPlugin } from './http/plugins/rate-limit.plugin.js';
import { errorHandlerPlugin } from './http/plugins/error-handler.plugin.js';

// Routes
import { healthRoutes } from './http/routes/health/health.routes.js';
import { authRoutes } from './http/routes/auth/auth.routes.js';
import { clientRoutes } from './http/routes/clients/client.routes.js';
import { leadRoutes } from './http/routes/leads/lead.routes.js';
import { policyRoutes } from './http/routes/policies/policy.routes.js';

// Infrastructure
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma/prisma.client.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: isDev ? 'debug' : 'info',
      ...(isDev
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
            },
          }
        : {}),
    },
    genReqId: () => `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,
    requestIdHeader: 'x-request-id',
  });

  // ── Security plugins ────────────────────────────────────────────────────
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);

  // ── Auth plugin (JWT + cookies) ─────────────────────────────────────────
  await app.register(authPlugin);

  // ── Tenant context (reads JWT claims into request.tenantId etc.) ────────
  await app.register(tenantContextPlugin);

  // ── Error handler ───────────────────────────────────────────────────────
  await app.register(errorHandlerPlugin);

  // ── Routes ──────────────────────────────────────────────────────────────
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(clientRoutes, { prefix: '/api/v1/clients' });
  await app.register(leadRoutes,    { prefix: '/api/v1/leads' });
  await app.register(policyRoutes,  { prefix: '/api/v1/policies' });

  return app;
}

async function start() {
  const app = await buildServer();

  // Connect to PostgreSQL before accepting requests
  await connectDatabase();

  // Railway injects PORT; fall back to API_PORT for local dev
  const port = parseInt(process.env.PORT ?? String(config.API_PORT), 10);

  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 InsureConsultec API listening on port ${port}`);
    app.log.info(`   Environment: ${config.NODE_ENV}`);
    app.log.info(`   API URL: ${config.API_URL}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully…`);
    await app.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start();
