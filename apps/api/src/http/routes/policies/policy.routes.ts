import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../plugins/auth.plugin.js';
import { policyService } from '../../../modules/policies/policy.service.js';

// ── Validation constants ───────────────────────────────────────────────────────

const POLICY_STATUSES = ['draft','submitted','underwriting','active','amended','lapsed','reinstated','cancelled'] as const;
const PRODUCT_CATEGORIES = ['life','disability_lump','income_protection','critical_illness','funeral','short_term_personal','short_term_commercial','medical_aid','gap_cover','retrenchment','investment','key_person'] as const;
const PREMIUM_FREQUENCIES = ['monthly','quarterly','bi_annual','annual','once_off'] as const;
const COLLECTION_METHODS  = ['debit_order','eft','stop_order','credit_card','cash'] as const;

// ── Schemas ────────────────────────────────────────────────────────────────────

const CreatePolicyBody = z.object({
  clientId:           z.string().uuid(),
  agentId:            z.string().uuid(),
  policyNumber:       z.string().min(1).max(50),
  productCategory:    z.enum(PRODUCT_CATEGORIES),
  productName:        z.string().min(1).max(200),
  insurerName:        z.string().min(1).max(200),
  insurerPolicyRef:   z.string().max(100).optional(),
  sumAssured:         z.number().positive(),
  monthlyPremium:     z.number().positive(),
  premiumFrequency:   z.enum(PREMIUM_FREQUENCIES).optional(),
  collectionMethod:   z.enum(COLLECTION_METHODS).optional(),
  escalationRate:     z.number().min(0).max(1).optional(),
  inceptionDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  initialCommissionPct: z.number().min(0).max(1).optional(),
  renewalCommissionPct: z.number().min(0).max(1).optional(),
  clawbackWatchUntil:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const UpdatePolicyBody = CreatePolicyBody.omit({ clientId: true, agentId: true, policyNumber: true }).partial();

const TransitionBody = z.object({
  status:     z.enum(POLICY_STATUSES),
  reason:     z.string().max(500).optional(),
});

const ListQuery = z.object({
  clientId:        z.string().uuid().optional(),
  status:          z.enum(POLICY_STATUSES).optional(),
  productCategory: z.enum(PRODUCT_CATEGORIES).optional(),
  search:          z.string().optional(),
  page:            z.coerce.number().int().positive().default(1),
  limit:           z.coerce.number().int().positive().max(100).default(20),
});

function ok(data: unknown) { return { data }; }

function errNotFound(request: any) {
  return { error: { code: 'NOT_FOUND', message: 'Policy not found', requestId: request.id } };
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function policyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // GET /api/v1/policies/renewals-due
  app.get('/renewals-due', async (request, reply) => {
    const days = Number((request.query as any).days ?? 60);
    const items = await policyService.getRenewalsDue((request as any).tenantId, days);
    return reply.send(ok(items));
  });

  // GET /api/v1/policies
  app.get('/', async (request, reply) => {
    const query = ListQuery.parse(request.query);
    const result = await policyService.list({
      tenantId:        (request as any).tenantId,
      clientId:        query.clientId,
      status:          query.status,
      productCategory: query.productCategory,
      search:          query.search,
      page:            query.page,
      limit:           query.limit,
    });
    return reply.send(ok(result));
  });

  // GET /api/v1/policies/:id
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const policy = await policyService.getById(request.params.id, (request as any).tenantId);
    if (!policy) return reply.status(404).send(errNotFound(request));
    return reply.send(ok(policy));
  });

  // POST /api/v1/policies
  app.post('/', async (request, reply) => {
    const body = CreatePolicyBody.parse(request.body);
    try {
      const policy = await policyService.create((request as any).tenantId, (request as any).userId, body);
      return reply.status(201).send(ok(policy));
    } catch (err: any) {
      if (err.code === 'NOT_FOUND') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: err.message } });
      throw err;
    }
  });

  // PATCH /api/v1/policies/:id
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const body = UpdatePolicyBody.parse(request.body);
    const policy = await policyService.update(request.params.id, (request as any).tenantId, body);
    if (!policy) return reply.status(404).send(errNotFound(request));
    return reply.send(ok(policy));
  });

  // PATCH /api/v1/policies/:id/status — state machine transition
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const { status, reason } = TransitionBody.parse(request.body);
    try {
      const policy = await policyService.transition(
        request.params.id,
        (request as any).tenantId,
        (request as any).userId,
        status,
        { lostReason: reason },
      );
      if (!policy) return reply.status(404).send(errNotFound(request));
      return reply.send(ok(policy));
    } catch (err: any) {
      if (err.code === 'INVALID_TRANSITION') {
        return reply.status(422).send({
          error: {
            code: 'INVALID_TRANSITION',
            message: err.message,
            current: err.current,
            requested: err.requested,
          },
        });
      }
      throw err;
    }
  });

  // POST /api/v1/policies/:id/lapse
  app.post<{ Params: { id: string } }>('/:id/lapse', async (request, reply) => {
    const policy = await policyService.transition(request.params.id, (request as any).tenantId, (request as any).userId, 'lapsed');
    if (!policy) return reply.status(404).send(errNotFound(request));
    return reply.send(ok(policy));
  });

  // POST /api/v1/policies/:id/cancel
  app.post<{ Params: { id: string } }>('/:id/cancel', async (request, reply) => {
    const { reason } = z.object({ reason: z.string().max(500).optional() }).parse(request.body ?? {});
    const policy = await policyService.transition(request.params.id, (request as any).tenantId, (request as any).userId, 'cancelled', { lostReason: reason });
    if (!policy) return reply.status(404).send(errNotFound(request));
    return reply.send(ok(policy));
  });

  // POST /api/v1/policies/:id/reinstate
  app.post<{ Params: { id: string } }>('/:id/reinstate', async (request, reply) => {
    const policy = await policyService.transition(request.params.id, (request as any).tenantId, (request as any).userId, 'reinstated');
    if (!policy) return reply.status(404).send(errNotFound(request));
    return reply.send(ok(policy));
  });

  // DELETE /api/v1/policies/:id (soft)
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const result = await policyService.remove(request.params.id, (request as any).tenantId);
    if (!result) return reply.status(404).send(errNotFound(request));
    return reply.status(204).send();
  });
}
