import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../plugins/auth.plugin.js';
import { leadService } from '../../../modules/leads/lead.service.js';

// ── Input schemas ─────────────────────────────────────────────────────────────

const LEAD_STATUSES = [
  'new', 'contacted', 'qualified', 'fna_scheduled',
  'quoted', 'proposal_submitted', 'awaiting_decision',
  'won', 'lost', 'dormant',
] as const;

const LEAD_SOURCES = [
  'referral', 'cold_call', 'networking', 'social_media',
  'insurer_lead', 'aggregator', 'walk_in', 'bancassurance',
  'website', 'existing_client', 'other',
] as const;

const CreateLeadBody = z.object({
  firstName:        z.string().min(1).max(100),
  lastName:         z.string().min(1).max(100),
  email:            z.string().email().optional(),
  phone:            z.string().max(20).optional(),
  company:          z.string().max(200).optional(),
  source:           z.enum(LEAD_SOURCES).optional(),
  sourceDetail:     z.string().max(200).optional(),
  productInterests: z.array(z.string()).optional(),
  nextFollowUpAt:   z.string().datetime().optional(),
  agentId:          z.string().uuid().optional(),
});

const UpdateLeadBody = CreateLeadBody.partial();

const MoveLeadBody = z.object({
  status:     z.enum(LEAD_STATUSES),
  lostReason: z.string().max(500).optional(),
});

const AddActivityBody = z.object({
  activityType: z.enum(['call', 'email', 'whatsapp', 'meeting', 'note', 'sms', 'other']),
  note:         z.string().min(1).max(2000),
  outcome:      z.string().max(200).optional(),
  durationMins: z.number().int().positive().optional(),
});

const KanbanQuery = z.object({
  search: z.string().optional(),
});

const ListQuery = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  search: z.string().optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
});

function ok(data: unknown) {
  return { data };
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function leadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/v1/leads/kanban — grouped by status (for board view)
  app.get('/kanban', async (request, reply) => {
    const { search } = KanbanQuery.parse(request.query);
    const columns = await leadService.kanban((request as any).tenantId, search);
    return reply.send(ok(columns));
  });

  // GET /api/v1/leads — paged flat list
  app.get('/', async (request, reply) => {
    const query = ListQuery.parse(request.query);
    const result = await leadService.list({
      tenantId: (request as any).tenantId,
      status:   query.status,
      search:   query.search,
      page:     query.page,
      limit:    query.limit,
    });
    return reply.send(ok(result));
  });

  // GET /api/v1/leads/:id
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const lead = await leadService.getById(request.params.id, (request as any).tenantId);
    if (!lead) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Lead not found', requestId: (request as any).id },
      });
    }
    return reply.send(ok(lead));
  });

  // POST /api/v1/leads
  app.post('/', async (request, reply) => {
    const body = CreateLeadBody.parse(request.body);
    const lead = await leadService.create(
      (request as any).tenantId,
      (request as any).userId,
      body,
    );
    return reply.status(201).send(ok(lead));
  });

  // PATCH /api/v1/leads/:id
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const body = UpdateLeadBody.parse(request.body);
    const lead = await leadService.update(request.params.id, (request as any).tenantId, body);
    if (!lead) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Lead not found', requestId: (request as any).id },
      });
    }
    return reply.send(ok(lead));
  });

  // PATCH /api/v1/leads/:id/move — status transition
  app.patch<{ Params: { id: string } }>('/:id/move', async (request, reply) => {
    const body = MoveLeadBody.parse(request.body);
    const lead = await leadService.move(
      request.params.id,
      (request as any).tenantId,
      (request as any).userId,
      body,
    );
    if (!lead) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Lead not found', requestId: (request as any).id },
      });
    }
    return reply.send(ok(lead));
  });

  // POST /api/v1/leads/:id/activities
  app.post<{ Params: { id: string } }>('/:id/activities', async (request, reply) => {
    const body = AddActivityBody.parse(request.body);
    const activity = await leadService.addActivity(
      request.params.id,
      (request as any).tenantId,
      (request as any).userId,
      body,
    );
    if (!activity) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Lead not found', requestId: (request as any).id },
      });
    }
    return reply.status(201).send(ok(activity));
  });

  // DELETE /api/v1/leads/:id
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const result = await leadService.remove(request.params.id, (request as any).tenantId);
    if (!result) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Lead not found', requestId: (request as any).id },
      });
    }
    return reply.status(204).send();
  });
}
