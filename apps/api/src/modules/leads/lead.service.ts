import { prisma } from '../../infrastructure/database/prisma/prisma.client.js';

// ── Types ───────────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'fna_scheduled'
  | 'quoted' | 'proposal_submitted' | 'awaiting_decision'
  | 'won' | 'lost' | 'dormant';

export type LeadSource =
  | 'referral' | 'cold_call' | 'networking' | 'social_media'
  | 'insurer_lead' | 'aggregator' | 'walk_in' | 'bancassurance'
  | 'website' | 'existing_client' | 'other';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  sourceDetail?: string;
  productInterests?: string[];
  nextFollowUpAt?: string; // ISO datetime
  agentId?: string;
}

export interface UpdateLeadDto extends Partial<CreateLeadDto> {}

export interface MoveLeadDto {
  status: LeadStatus;
  lostReason?: string;
}

export interface ListLeadsOptions {
  tenantId: string;
  status?: LeadStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

export class LeadService {
  /**
   * Returns leads grouped by status for use in the kanban board.
   * Each column gets its own count + page of items.
   */
  async kanban(tenantId: string, search?: string) {
    const statuses: LeadStatus[] = [
      'new', 'contacted', 'qualified', 'fna_scheduled',
      'quoted', 'proposal_submitted', 'awaiting_decision',
      'won', 'lost',
    ];

    const baseWhere = (status: LeadStatus) => ({
      tenantId,
      status: status as any,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName:  { contains: search, mode: 'insensitive' as const } },
              { email:     { contains: search, mode: 'insensitive' as const } },
              { company:   { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    });

    const columns = await Promise.all(
      statuses.map(async (status) => {
        const [items, total] = await Promise.all([
          prisma.lead.findMany({
            where: baseWhere(status),
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              company: true,
              source: true,
              productInterests: true,
              nextFollowUpAt: true,
              createdAt: true,
              agentId: true,
            },
          }),
          prisma.lead.count({ where: baseWhere(status) }),
        ]);
        return { status, items, total };
      }),
    );

    return columns;
  }

  async list({ tenantId, status, search, page = 1, limit = 20 }: ListLeadsOptions) {
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName:  { contains: search, mode: 'insensitive' as const } },
              { email:     { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getById(id: string, tenantId: string) {
    return prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  async create(tenantId: string, userId: string, dto: CreateLeadDto) {
    return prisma.lead.create({
      data: {
        tenantId,
        createdBy: userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase() ?? null,
        phone: dto.phone ?? null,
        company: dto.company ?? null,
        source: (dto.source as any) ?? 'other',
        sourceDetail: dto.sourceDetail ?? null,
        productInterests: dto.productInterests ?? [],
        nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
        agentId: dto.agentId ?? null,
        status: 'new' as any,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateLeadDto) {
    const existing = await prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.lead.update({
      where: { id },
      data: {
        ...(dto.firstName     !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName      !== undefined && { lastName: dto.lastName }),
        ...(dto.email         !== undefined && { email: dto.email?.toLowerCase() ?? null }),
        ...(dto.phone         !== undefined && { phone: dto.phone }),
        ...(dto.company       !== undefined && { company: dto.company }),
        ...(dto.source        !== undefined && { source: dto.source as any }),
        ...(dto.sourceDetail  !== undefined && { sourceDetail: dto.sourceDetail }),
        ...(dto.productInterests !== undefined && { productInterests: dto.productInterests }),
        ...(dto.nextFollowUpAt !== undefined && {
          nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : null,
        }),
        updatedAt: new Date(),
      },
    });
  }

  async move(id: string, tenantId: string, userId: string, dto: MoveLeadDto) {
    const existing = await prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing) return null;

    const isWon  = dto.status === 'won';
    const isLost = dto.status === 'lost';

    return prisma.lead.update({
      where: { id },
      data: {
        status: dto.status as any,
        ...(isWon  && { convertedAt: new Date(), convertedById: userId }),
        ...(isLost && { lostReason: dto.lostReason ?? null }),
        updatedAt: new Date(),
      },
    });
  }

  async addActivity(
    leadId: string,
    tenantId: string,
    userId: string,
    body: { activityType: string; note: string; outcome?: string; durationMins?: number },
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!lead) return null;

    return prisma.leadActivity.create({
      data: {
        leadId,
        tenantId,
        createdBy: userId,
        activityType: body.activityType as any,
        note: body.note,
        outcome: body.outcome ?? null,
        durationMins: body.durationMins ?? null,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await prisma.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }
}

export const leadService = new LeadService();
