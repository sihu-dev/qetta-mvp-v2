/**
 * Supabase Client Utilities
 * Server-side and client-side Supabase clients
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getEnvSafe } from '@/lib/config/env';

// =============================================================================
// Environment Variables (validated)
// =============================================================================

const supabaseUrl = getEnvSafe('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvSafe('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const supabaseServiceKey = getEnvSafe('SUPABASE_SERVICE_ROLE_KEY');

// Validate required environment variables
function validateEnv(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required'
    );
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

// =============================================================================
// Client-side Supabase Client
// =============================================================================

/**
 * Client-side Supabase client (uses anon key)
 * Lazily initialized to avoid errors during build
 */
let _supabase: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const { url, anonKey } = validateEnv();
    _supabase = createSupabaseClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _supabase;
}

// For backward compatibility - create client on access
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});

// =============================================================================
// Server-side Supabase Client
// =============================================================================

/**
 * Server-side Supabase client (uses service role key)
 * Only use in API routes or server-side code
 */
export function createServerClient() {
  const { url } = validateEnv();

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(url, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// =============================================================================
// Authenticated Client
// =============================================================================

/**
 * Create a typed Supabase client with custom headers
 * Used for requests with a specific user's access token
 */
export function createAuthenticatedClient(accessToken: string) {
  const { url, anonKey } = validateEnv();

  return createSupabaseClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

// =============================================================================
// Type Exports
// =============================================================================

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
