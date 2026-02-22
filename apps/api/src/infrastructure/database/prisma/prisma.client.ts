import { PrismaClient } from '@prisma/client';
import { config, isDev } from '../../config/config.js';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: config.DATABASE_URL },
    },
    log: isDev
      ? [
          { level: 'query', emit: 'event' },
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
    errorFormat: 'minimal',
  });
}

// In development, reuse the client to avoid connection exhaustion with tsx watch.
export const prisma: PrismaClient =
  global.__prisma ?? createPrismaClient();

if (isDev) {
  global.__prisma = prisma;

  // Log slow queries in dev
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 200) {
      console.warn(`[Prisma] Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
