import { z } from 'zod';
import { validateSaIdNumber, isSaMobile } from '../utils/index.js';
import {
  FspCategory,
  UserRole,
} from '../enums/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Common primitives
// ─────────────────────────────────────────────────────────────────────────────

export const UuidSchema = z.string().uuid('Must be a valid UUID');

export const SaIdNumberSchema = z
  .string()
  .regex(/^\d{13}$/, 'ID number must be exactly 13 digits')
  .refine(validateSaIdNumber, 'Invalid South African ID number');

export const SaMobileSchema = z
  .string()
  .refine(isSaMobile, 'Invalid South African mobile number');

export const ZarCentsSchema = z
  .number()
  .int('Amount must be in cents (integer)')
  .nonnegative('Amount cannot be negative');

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth schemas
// ─────────────────────────────────────────────────────────────────────────────

export const RegisterTenantSchema = z.object({
  // Tenant / FSP details
  fspName: z.string().min(2).max(200),
  fspNumber: z.string().min(3).max(50),
  fspCategory: z.nativeEnum(FspCategory),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers and hyphens'),
  vatNumber: z.string().regex(/^\d{10}$/, 'VAT number must be 10 digits').optional(),
  // Owner user
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/\d/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  mobile: SaMobileSchema.optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(12)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/\d/)
    .regex(/[^A-Za-z0-9]/),
});

// ─────────────────────────────────────────────────────────────────────────────
// User management schemas
// ─────────────────────────────────────────────────────────────────────────────

export const InviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.nativeEnum(UserRole),
  mobile: SaMobileSchema.optional(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Export inferred types
// ─────────────────────────────────────────────────────────────────────────────

export type RegisterTenantDto = z.infer<typeof RegisterTenantSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type InviteUserDto = z.infer<typeof InviteUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
