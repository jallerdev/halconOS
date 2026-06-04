import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),
  CLERK_SECRET_KEY: z.string().optional().default(''),
  DEV_BYPASS_USER_ID: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-2.5-flash'),
  // Orígenes permitidos para CORS (coma-separados). Ej: https://halcon.app,https://www.halcon.app
  ALLOWED_ORIGINS: z.string().optional().default(''),
  // Google OAuth (Calendar + Meet). Opcionales: si faltan, la conexión con Google queda deshabilitada.
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional().default(''),
  // Google Places API (New) — para Descubrir negocios desde /discover.
  // Si falta, la página renderiza un estado vacío con CTA a configurarla.
  GOOGLE_PLACES_API_KEY: z.string().optional().default(''),
  // Clave para cifrar refresh tokens (AES-256-GCM). 32 bytes en hex (64 chars). Generar: openssl rand -hex 32
  ENCRYPTION_KEY: z
    .string()
    .optional()
    .default('')
    .refine((v) => v === '' || /^[0-9a-f]{64}$/i.test(v), {
      message: 'ENCRYPTION_KEY debe ser 64 chars hex (32 bytes). Generar con: openssl rand -hex 32',
    }),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  DEV_BYPASS_USER_ID: process.env.DEV_BYPASS_USER_ID,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

export const googleConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_OAUTH_REDIRECT_URI && env.ENCRYPTION_KEY,
);

export const placesConfigured = Boolean(env.GOOGLE_PLACES_API_KEY);
