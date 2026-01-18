/**
 * Environment Variable Validation
 * Zod-based runtime validation for environment variables
 */

import { z } from 'zod';

// =============================================================================
// Environment Schema
// =============================================================================

const envSchema = z.object({
  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // Supabase Service Key (Optional - for server-side)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Anthropic API (Optional - for Claude integration)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_DEV_FEATURES: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_ENABLE_AI_FEATURES: z
    .string()
    .optional()
    .transform((val) => val !== 'false'),

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .optional(),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .optional(),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

// =============================================================================
// Validation Helper
// =============================================================================

/**
 * Validated environment variables
 * Throws at build/startup if required vars are missing
 */
function getEnv() {
  // In development, allow missing vars with defaults
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Provide safe defaults for development
    const devDefaults = {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      NODE_ENV: process.env.NODE_ENV || 'development',
    };

    return envSchema.parse({
      ...devDefaults,
      ...process.env,
    });
  }

  // Production: strict validation
  return envSchema.parse(process.env);
}

// =============================================================================
// Safe Getters (for edge cases where parse might fail)
// =============================================================================

/**
 * Get environment variable safely without throwing
 */
export function getEnvSafe<K extends keyof z.infer<typeof envSchema>>(
  key: K
): z.infer<typeof envSchema>[K] | undefined {
  try {
    const env = getEnv();
    return env[key];
  } catch {
    return undefined;
  }
}

/**
 * Check if environment is properly configured
 */
export function isEnvConfigured(): boolean {
  try {
    getEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get validation errors without throwing
 */
export function getEnvValidationErrors(): string[] {
  const result = envSchema.safeParse(process.env);
  if (result.success) return [];

  return result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  );
}

// =============================================================================
// Exports
// =============================================================================

export const env = getEnv();
export type Env = z.infer<typeof envSchema>;
export { envSchema };
