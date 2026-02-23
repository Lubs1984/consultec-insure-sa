import { prisma } from '../../infrastructure/database/prisma/prisma.client.js';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  email?: string;
  mobilePhone?: string;
  idType?: string;
  idNumber?: string;
  dateOfBirth?: string; // ISO date string
  gender?: string;
  agentId?: string;
}

export interface UpdateClientDto extends Partial<Omit<CreateClientDto, 'agentId'>> {}

export interface ListClientsOptions {
  tenantId: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ClientService {
  async list({ tenantId, search, page = 1, limit = 20 }: ListClientsOptions) {
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName:  { contains: search, mode: 'insensitive' as const } },
              { email:     { contains: search, mode: 'insensitive' as const } },
              { idNumber:  { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
          email: true,
          mobilePhone: true,
          idType: true,
          idNumber: true,
          dateOfBirth: true,
          gender: true,
          createdAt: true,
          agentId: true,
        },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getById(id: string, tenantId: string) {
    const client = await prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return client ?? null;
  }

  async create(tenantId: string, dto: CreateClientDto) {
    return prisma.client.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase() ?? null,
        mobilePhone: dto.mobilePhone ?? null,
        idType: (dto.idType as any) ?? 'rsa_id',
        idNumber: dto.idNumber ?? null,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender ?? null,
        agentId: dto.agentId ?? null,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateClientDto) {
    // Ensure the client belongs to this tenant
    const existing = await prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.client.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName  !== undefined && { lastName:  dto.lastName  }),
        ...(dto.email     !== undefined && { email:     dto.email?.toLowerCase() ?? null }),
        ...(dto.mobilePhone !== undefined && { mobilePhone: dto.mobilePhone }),
        ...(dto.idType    !== undefined && { idType:    dto.idType as any }),
        ...(dto.idNumber  !== undefined && { idNumber:  dto.idNumber }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }),
        ...(dto.gender    !== undefined && { gender:    dto.gender }),
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const existing = await prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    return prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }
}

export const clientService = new ClientService();
