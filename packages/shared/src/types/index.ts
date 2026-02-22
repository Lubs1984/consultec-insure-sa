import type { UserRole } from '../enums/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// API Response wrappers
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    requestId?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination / filter input
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth types
// ─────────────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // user id
  tid: string;       // tenant id
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  expiresIn: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared value types
// ─────────────────────────────────────────────────────────────────────────────

export type UUID = string;
export type ISODateString = string;
export type ZarCents = number;  // All monetary values stored as cents

export interface Address {
  line1: string;
  line2?: string;
  suburb: string;
  city: string;
  province: SaProvince;
  postalCode: string;
  country: 'ZA';
}

export enum SaProvince {
  GAUTENG = 'GP',
  WESTERN_CAPE = 'WC',
  KWAZULU_NATAL = 'KZN',
  EASTERN_CAPE = 'EC',
  LIMPOPO = 'LP',
  MPUMALANGA = 'MP',
  NORTH_WEST = 'NW',
  FREE_STATE = 'FS',
  NORTHERN_CAPE = 'NC',
}
