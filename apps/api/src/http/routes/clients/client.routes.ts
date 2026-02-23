import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../plugins/auth.plugin.js';
import { clientService } from '../../../modules/clients/client.service.js';

// ── Input schemas ─────────────────────────────────────────────────────────────

const CreateClientBody = z.object({
  firstName:   z.string().min(1).max(100),
  lastName:    z.string().min(1).max(100),
  email:       z.string().email().optional(),
  mobilePhone: z.string().max(20).optional(),
  idType:      z.enum(['rsa_id', 'passport', 'other']).optional(),
  idNumber:    z.string().max(13).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender:      z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  agentId:     z.string().uuid().optional(),
});

const UpdateClientBody = CreateClientBody.partial().omit({ agentId: true });

const ListQuery = z.object({
  search: z.string().optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
});

// ── Helper — wrap response ─────────────────────────────────────────────────────

function ok(data: unknown) {
  return { data };
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function clientRoutes(app: FastifyInstance) {
  // All client routes require auth
  app.addHook('preHandler', requireAuth);

  // GET /api/v1/clients
  app.get('/', async (request, reply) => {
    const query = ListQuery.parse(request.query);
    const result = await clientService.list({
      tenantId: (request as any).tenantId,
      search: query.search,
      page:   query.page,
      limit:  query.limit,
    });
    return reply.send(ok(result));
  });

  // GET /api/v1/clients/:id
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const client = await clientService.getById(
      request.params.id,
      (request as any).tenantId,
    );
    if (!client) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Client not found', requestId: (request as any).id },
      });
    }
    return reply.send(ok(client));
  });

  // POST /api/v1/clients
  app.post('/', async (request, reply) => {
    const body = CreateClientBody.parse(request.body);
    const client = await clientService.create((request as any).tenantId, body);
    return reply.status(201).send(ok(client));
  });

  // PATCH /api/v1/clients/:id
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const body = UpdateClientBody.parse(request.body);
    const client = await clientService.update(
      request.params.id,
      (request as any).tenantId,
      body,
    );
    if (!client) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Client not found', requestId: (request as any).id },
      });
    }
    return reply.send(ok(client));
  });

  // DELETE /api/v1/clients/:id
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const result = await clientService.remove(
      request.params.id,
      (request as any).tenantId,
    );
    if (!result) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Client not found', requestId: (request as any).id },
      });
    }
    return reply.status(204).send();
  });
}
