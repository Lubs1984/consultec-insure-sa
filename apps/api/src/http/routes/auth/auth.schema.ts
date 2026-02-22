import { z } from 'zod';
import { RegisterTenantSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@insureconsultec/shared';

// Re-export shared schemas
export { RegisterTenantSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema };

// Auth response types
export const AuthResponseSchema = z.object({
  data: z.object({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      role: z.string(),
      tenantId: z.string().uuid(),
    }),
    accessToken: z.string(),
    expiresIn: z.number(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
