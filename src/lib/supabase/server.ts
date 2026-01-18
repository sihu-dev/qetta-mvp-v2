/**
 * Supabase Server Client
 * 서버사이드에서 사용하는 Supabase 클라이언트
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// 환경 변수
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// =============================================================================
// Supabase Client
// =============================================================================

/**
 * 서버사이드 Supabase 클라이언트 생성
 * Service Role Key 사용 (RLS 우회)
 */
export async function createClient() {
  if (!supabaseUrl) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL is not set');
    return createMockClient();
  }

  // Service Role Key가 있으면 사용 (RLS 우회)
  const key = supabaseServiceKey || supabaseAnonKey;

  if (!key) {
    console.warn('[Supabase] No API key available');
    return createMockClient();
  }

  return createSupabaseClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Anon Key를 사용하는 클라이언트 생성
 */
export async function createAnonClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing credentials');
    return createMockClient();
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// =============================================================================
// Mock Client (개발/테스트용)
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockClient(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockQueryBuilder: any = {
    eq: () => mockQueryBuilder,
    gte: () => mockQueryBuilder,
    lte: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    range: () => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (value: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve(resolve({ data: [], error: null })),
  };

  return {
    from: () => ({
      select: () => mockQueryBuilder,
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}

// =============================================================================
// Exports
// =============================================================================

export { createSupabaseClient };
