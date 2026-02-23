import crypto from 'node:crypto';
import { prisma } from '../../infrastructure/database/prisma/prisma.client.js';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
} from '../../lib/password.js';
import {
  ConflictError,
  NotFoundError,
  UnauthenticatedError,
  ForbiddenError,
} from '../../http/plugins/error-handler.plugin.js';
import { UserRole, TenantStatus, FspCategory } from '@insureconsultec/shared';

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface RegisterTenantDto {
  // Tenant / FSP fields (matches shared RegisterTenantSchema)
  fspName: string;
  slug: string;
  fspNumber?: string;
  fspCategory?: FspCategory;
  vatNumber?: string;
  // Owner fields
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  tenantSlug?: string;      // Optional — if omitted, we find tenant by email domain
}

// Returned token bundle to route handlers (they decide cookies vs body)
export interface TokenBundle {
  accessToken: string;
  refreshToken: string;    // raw (not hashed) — caller hashes before cookie
  expiresIn: number;       // access token TTL in seconds
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  tenant: {
    id: string;
    companyName: string;
    slug: string;
    status: TenantStatus;
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Lower-level auth service — does NOT touch Fastify (no request/reply).
 * Token signing is handled in the route layer so this stays testable.
 */
export class AuthService {

  // ── Register new tenant + owner ──────────────────────────────────────────

  async registerTenant(dto: RegisterTenantDto): Promise<AuthUser> {
    // 1. Check slug uniqueness
    const existing = await prisma.tenant.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError(
        `The subdomain "${dto.slug}" is already taken. Please choose another.`,
      );
    }

    // 2. Check email uniqueness globally
    const existingEmail = await prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existingEmail) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(dto.password);

    // 3. Create Tenant + User in a single transaction
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.fspName,
          slug: dto.slug,
          fscaLicenceNumber: dto.fspNumber ?? null,
          fspCategory: (dto.fspCategory as any) ?? 'I',
          vatNumber: dto.vatNumber ?? null,
          email: dto.email.toLowerCase(),
          status: 'trialing' as any,
          subscriptionStatus: 'trialing',
          subscriptionPlan: 'starter',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.mobile ?? null,
          role: UserRole.FSP_OWNER as any,
          isActive: true,
          isMfaEnabled: false,
          createdBy: 'system',
        },
      });

      return { tenant, user };
    });

    return this._buildAuthUser(user, tenant);
  }

  // ── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthUser> {
    const email = dto.email.toLowerCase();

    // 1. Find user (scope to tenant if slug provided)
    const user = await (dto.tenantSlug
      ? prisma.user.findFirst({
          where: {
            email,
            tenant: { slug: dto.tenantSlug },
            isActive: true,
            deletedAt: null,
          },
          include: { tenant: true },
        })
      : prisma.user.findFirst({
          where: { email, isActive: true, deletedAt: null },
          include: { tenant: true },
        }));

    if (!user) {
      throw new UnauthenticatedError('Invalid email or password.');
    }

    // 2. Check tenant is operational
    if (user.tenant.status === TenantStatus.SUSPENDED) {
      throw new ForbiddenError('Your organisation account is suspended. Please contact support.');
    }
    if (user.tenant.status === TenantStatus.CANCELLED) {
      throw new ForbiddenError('Your organisation account has been cancelled.');
    }

    // 3. Verify password
    const valid = await verifyPassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthenticatedError('Invalid email or password.');
    }

    // 4. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this._buildAuthUser(user, user.tenant);
  }

  // ── Issue JWTs + persist refresh token ───────────────────────────────────

  /** Called by route handler after successful login / register */
  async createRefreshToken(
    userId: string,
    {
      userAgent = 'unknown',
      ipAddress = '0.0.0.0',
      expiresAt,
    }: { userAgent?: string; ipAddress?: string; expiresAt: Date },
  ): Promise<string> {
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        userAgent,
        ipAddress,
        expiresAt,
        revokedAt: null,
      },
    });

    return rawToken;
  }

  // ── Refresh ──────────────────────────────────────────────────────────────

  async refresh(rawToken: string): Promise<AuthUser> {
    const tokenHash = hashToken(rawToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { tenant: true } },
      },
    });

    if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
      throw new UnauthenticatedError('Refresh token is invalid or expired. Please log in again.');
    }

    if (!stored.user.isActive || stored.user.deletedAt) {
      throw new UnauthenticatedError('Account is no longer active.');
    }

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this._buildAuthUser(stored.user, stored.user.tenant);
  }

  // ── Logout ───────────────────────────────────────────────────────────────

  async logout(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Me ───────────────────────────────────────────────────────────────────

  async me(userId: string, tenantId: string): Promise<AuthUser> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: { tenant: true },
    });

    if (!user) throw new NotFoundError('User not found.');

    return this._buildAuthUser(user, user.tenant);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _buildAuthUser(
    user: { id: string; email: string; firstName: string; lastName: string; role: string },
    tenant: { id: string; name: string; slug: string; status: string },
  ): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      tenantId: tenant.id,
      tenant: {
        id: tenant.id,
        companyName: tenant.name,
        slug: tenant.slug,
        status: tenant.status as TenantStatus,
      },
    };
  }
}

export const authService = new AuthService();
