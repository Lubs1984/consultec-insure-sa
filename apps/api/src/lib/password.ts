import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Generate a cryptographically random token (URL-safe base64) */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** SHA-256 the raw token before storing in DB */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
