import { createEnv } from 'kitcn/server';
import { z } from 'zod';

const envSchema = z.object({
  JWKS: z.string().optional(),
});

export const getEnv = createEnv({
  readOptionalRuntimeEnv: ['JWKS'],
  schema: envSchema,
});

export function getAuthJwks(): string | undefined {
  return getEnv().JWKS?.trim() || undefined;
}
