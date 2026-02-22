import { z } from 'zod';

const ConfigSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_URL: z.string().url().default('http://localhost:3001'),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  APP_DOMAIN: z.string().default('insureconsultec.co.za'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Cloudflare R2 (optional in development)
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).default('insureconsultec-documents-dev'),
  R2_PUBLIC_URL: z.string().url().optional(),

  // SendGrid (optional in development)
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@insureconsultec.co.za'),
  SENDGRID_FROM_NAME: z.string().default('InsureConsultec'),

  // Africa's Talking (optional in development)
  AT_API_KEY: z.string().min(1).optional(),
  AT_USERNAME: z.string().min(1).default('sandbox'),
  AT_SENDER_ID: z.string().default('InsureConsultec'),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const result = ConfigSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const config: Config = loadConfig();
export const isDev = config.NODE_ENV === 'development';
export const isProd = config.NODE_ENV === 'production';
