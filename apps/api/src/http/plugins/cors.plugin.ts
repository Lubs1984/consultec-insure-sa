import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { config } from '../../config/config.js';

export const corsPlugin = fp(async (app) => {
  await app.register(cors, {
    origin: [config.WEB_URL, ...(config.NODE_ENV === 'development' ? ['http://localhost:5173'] : [])],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 600, // 10 minutes preflight cache
  });
});
