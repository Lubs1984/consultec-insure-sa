import { prisma } from '../../infrastructure/database/prisma/prisma.client.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PolicyStatus =
  | 'draft' | 'submitted' | 'underwriting' | 'active'
  | 'amended' | 'lapsed' | 'reinstated' | 'cancelled';

export type ProductCategory =
  | 'life' | 'disability_lump' | 'income_protection' | 'critical_illness'
  | 'funeral' | 'short_term_personal' | 'short_term_commercial'
  | 'medical_aid' | 'gap_cover' | 'retrenchment' | 'investment' | 'key_person';

export type PremiumFrequency = 'monthly' | 'quarterly' | 'bi_annual' | 'annual' | 'once_off';
export type CollectionMethod = 'debit_order' | 'eft' | 'stop_order' | 'credit_card' | 'cash';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreatePolicyDto {
  clientId: string;
  agentId: string;
  policyNumber: string;
  productCategory: ProductCategory;
  productName: string;
  insurerName: string;
  insurerPolicyRef?: string;
  sumAssured: number;
  monthlyPremium: number;
  premiumFrequency?: PremiumFrequency;
  collectionMethod?: CollectionMethod;
  escalationRate?: number;
  inceptionDate: string;      // ISO date
  expiryDate?: string;
  initialCommissionPct?: number;
  renewalCommissionPct?: number;
  clawbackWatchUntil?: string;
}

export interface UpdatePolicyDto extends Partial<Omit<CreatePolicyDto, 'clientId' | 'agentId' | 'policyNumber'>> {}

export interface ListPoliciesOptions {
  tenantId: string;
  clientId?: string;
  status?: PolicyStatus;
  productCategory?: ProductCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Status machine — allowed transitions ──────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
  draft:          ['submitted', 'cancelled'],
  submitted:      ['underwriting', 'cancelled'],
  underwriting:   ['active', 'cancelled'],
  active:         ['amended', 'lapsed', 'cancelled'],
  amended:        ['active', 'lapsed', 'cancelled'],
  lapsed:         ['reinstated', 'cancelled'],
  reinstated:     ['active', 'lapsed', 'cancelled'],
  cancelled:      [],
};

// ── Service ───────────────────────────────────────────────────────────────────

export class PolicyService {
  async list({ tenantId, clientId, status, productCategory, search, page = 1, limit = 20 }: ListPoliciesOptions) {
    const skip = (page - 1) * limit;
    const where: any = {
      tenantId,
      deletedAt: null,
      ...(clientId         ? { clientId }             : {}),
      ...(status           ? { status: status as any } : {}),
      ...(productCategory  ? { productCategory: productCategory as any } : {}),
      ...(search ? {
        OR: [
          { policyNumber:    { contains: search, mode: 'insensitive' } },
          { productName:     { contains: search, mode: 'insensitive' } },
          { insurerName:     { contains: search, mode: 'insensitive' } },
          { insurerPolicyRef:{ contains: search, mode: 'insensitive' } },
          { client: { firstName: { contains: search, mode: 'insensitive' } } },
          { client: { lastName:  { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.policy.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getById(id: string, tenantId: string) {
    return prisma.policy.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, mobilePhone: true } },
        roas: { orderBy: { createdAt: 'desc' }, take: 5 },
        claims: { orderBy: { createdAt: 'desc' }, take: 5 },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async create(tenantId: string, userId: string, dto: CreatePolicyDto) {
    // Guard: client must belong to this tenant
    const client = await prisma.client.findFirst({
      where: { id: dto.clientId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!client) throw Object.assign(new Error('Client not found'), { code: 'NOT_FOUND' });

    return prisma.policy.create({
      data: {
        tenantId,
        createdBy: userId,
        clientId: dto.clientId,
        agentId:  dto.agentId,
        policyNumber:    dto.policyNumber,
        productCategory: dto.productCategory as any,
        productName:     dto.productName,
        insurerName:     dto.insurerName,
        insurerPolicyRef: dto.insurerPolicyRef ?? null,
        sumAssured:     dto.sumAssured,
        monthlyPremium: dto.monthlyPremium,
        premiumFrequency:  (dto.premiumFrequency  as any) ?? 'monthly',
        collectionMethod:  (dto.collectionMethod  as any) ?? 'debit_order',
        escalationRate:    dto.escalationRate    ?? null,
        inceptionDate:     new Date(dto.inceptionDate),
        expiryDate:        dto.expiryDate       ? new Date(dto.expiryDate)       : null,
        initialCommissionPct: dto.initialCommissionPct ?? null,
        renewalCommissionPct: dto.renewalCommissionPct ?? null,
        clawbackWatchUntil:   dto.clawbackWatchUntil ? new Date(dto.clawbackWatchUntil) : null,
        status: 'draft' as any,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdatePolicyDto) {
    const existing = await prisma.policy.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.policy.update({
      where: { id },
      data: {
        ...(dto.productName     !== undefined && { productName:     dto.productName }),
        ...(dto.insurerName     !== undefined && { insurerName:     dto.insurerName }),
        ...(dto.insurerPolicyRef!== undefined && { insurerPolicyRef:dto.insurerPolicyRef }),
        ...(dto.sumAssured      !== undefined && { sumAssured:      dto.sumAssured }),
        ...(dto.monthlyPremium  !== undefined && { monthlyPremium:  dto.monthlyPremium }),
        ...(dto.premiumFrequency!== undefined && { premiumFrequency:dto.premiumFrequency as any }),
        ...(dto.collectionMethod!== undefined && { collectionMethod:dto.collectionMethod as any }),
        ...(dto.escalationRate  !== undefined && { escalationRate:  dto.escalationRate }),
        ...(dto.inceptionDate   !== undefined && { inceptionDate:   new Date(dto.inceptionDate) }),
        ...(dto.expiryDate      !== undefined && { expiryDate:      dto.expiryDate ? new Date(dto.expiryDate) : null }),
        ...(dto.initialCommissionPct !== undefined && { initialCommissionPct: dto.initialCommissionPct }),
        ...(dto.renewalCommissionPct !== undefined && { renewalCommissionPct: dto.renewalCommissionPct }),
        ...(dto.clawbackWatchUntil   !== undefined && { clawbackWatchUntil: dto.clawbackWatchUntil ? new Date(dto.clawbackWatchUntil) : null }),
        updatedAt: new Date(),
      },
    });
  }

  async transition(id: string, tenantId: string, userId: string, toStatus: PolicyStatus, opts?: { lostReason?: string }) {
    const policy = await prisma.policy.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!policy) return null;

    const allowed = ALLOWED_TRANSITIONS[policy.status as PolicyStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      throw Object.assign(
        new Error(`Cannot move policy from ${policy.status} to ${toStatus}`),
        { code: 'INVALID_TRANSITION', current: policy.status, requested: toStatus },
      );
    }

    const now = new Date();
    const extra: any = {};
    if (toStatus === 'lapsed')    extra.lapseDate        = now;
    if (toStatus === 'cancelled') extra.cancellationDate = now;
    if (toStatus === 'cancelled' && opts?.lostReason) extra.cancellationReason = opts.lostReason;

    return prisma.policy.update({
      where: { id },
      data: { status: toStatus as any, ...extra, updatedAt: now },
    });
  }

  async getRenewalsDue(tenantId: string, daysAhead = 60) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return prisma.policy.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['active', 'reinstated'] as any[] },
        expiryDate: { lte: cutoff, gte: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
      include: { client: { select: { id: true, firstName: true, lastName: true, email: true, mobilePhone: true } } },
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await prisma.policy.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;
    return prisma.policy.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
  }
}

export const policyService = new PolicyService();
