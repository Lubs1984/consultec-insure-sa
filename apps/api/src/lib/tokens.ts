import type { FastifyInstance } from 'fastify';
import { config } from '../../config/config.js';

export interface AccessTokenPayload {
  sub: string;       // userId
  tid: string;       // tenantId — matches shared JwtPayload
  role: string;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;       // userId
  tid: string;       // tenantId
  jti: string;       // unique token id (for revocation)
}

export function signAccessToken(
  app: FastifyInstance,
  payload: AccessTokenPayload,
): string {
  return app.jwt.sign(payload, { expiresIn: config.JWT_ACCESS_EXPIRY } as any);
}

export function signRefreshToken(
  app: FastifyInstance,
  payload: RefreshTokenPayload,
): string {
  return (app.jwt as any).sign(payload, {
    secret: config.JWT_REFRESH_SECRET,
    expiresIn: config.JWT_REFRESH_EXPIRY,
  });
}

export function verifyRefreshToken(
  app: FastifyInstance,
  token: string,
): RefreshTokenPayload {
  return (app.jwt as any).verify(token, {
    secret: config.JWT_REFRESH_SECRET,
  }) as RefreshTokenPayload;
}

/** Cookie options for the refresh token */
export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
} as const;

export const REFRESH_COOKIE_NAME = 'ic_refresh';
