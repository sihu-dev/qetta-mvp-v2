/**
 * Supabase Server Client
 * 서버사이드에서 사용하는 Supabase 클라이언트
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getEnvSafe, isEnvConfigured } from '@/lib/config/env';

// =============================================================================
// 환경 변수 (validated)
// =============================================================================

const supabaseUrl = getEnvSafe('NEXT_PUBLIC_SUPABASE_URL') || '';
const supabaseAnonKey = getEnvSafe('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = getEnvSafe('SUPABASE_SERVICE_ROLE_KEY') || '';

// =============================================================================
// Mock Client Types
// =============================================================================

interface MockQueryResult<T = unknown> {
  data: T | null;
  error: null;
}

interface MockQueryBuilder {
  eq: (column: string, value: unknown) => MockQueryBuilder;
  neq: (column: string, value: unknown) => MockQueryBuilder;
  gt: (column: string, value: unknown) => MockQueryBuilder;
  gte: (column: string, value: unknown) => MockQueryBuilder;
  lt: (column: string, value: unknown) => MockQueryBuilder;
  lte: (column: string, value: unknown) => MockQueryBuilder;
  like: (column: string, pattern: string) => MockQueryBuilder;
  ilike: (column: string, pattern: string) => MockQueryBuilder;
  is: (column: string, value: unknown) => MockQueryBuilder;
  in: (column: string, values: unknown[]) => MockQueryBuilder;
  contains: (column: string, value: unknown) => MockQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder;
  limit: (count: number) => MockQueryBuilder;
  range: (from: number, to: number) => MockQueryBuilder;
  single: () => Promise<MockQueryResult>;
  maybeSingle: () => Promise<MockQueryResult>;
  then: <TResult>(
    resolve: (value: MockQueryResult<unknown[]>) => TResult
  ) => Promise<TResult>;
}

interface MockTableMethods {
  select: (columns?: string) => MockQueryBuilder;
  insert: (data: unknown) => Promise<MockQueryResult>;
  upsert: (data: unknown) => Promise<MockQueryResult>;
  update: (data: unknown) => {
    eq: (column: string, value: unknown) => Promise<MockQueryResult>;
    match: (query: Record<string, unknown>) => Promise<MockQueryResult>;
  };
  delete: () => {
    eq: (column: string, value: unknown) => Promise<MockQueryResult>;
    match: (query: Record<string, unknown>) => Promise<MockQueryResult>;
  };
}

interface MockAuthMethods {
  getUser: () => Promise<{ data: { user: null }; error: null }>;
  getSession: () => Promise<{ data: { session: null }; error: null }>;
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ data: { user: null; session: null }; error: null }>;
  signUp: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ data: { user: null; session: null }; error: null }>;
  signOut: () => Promise<{ error: null }>;
  resetPasswordForEmail: (email: string) => Promise<{ data: object; error: null }>;
  updateUser: (attributes: Record<string, unknown>) => Promise<{ data: { user: null }; error: null }>;
}

interface MockStorageMethods {
  from: (bucket: string) => {
    upload: (path: string, file: unknown) => Promise<MockQueryResult<{ path: string }>>;
    download: (path: string) => Promise<MockQueryResult<Blob>>;
    remove: (paths: string[]) => Promise<MockQueryResult<{ name: string }[]>>;
    getPublicUrl: (path: string) => { data: { publicUrl: string } };
    list: (path?: string) => Promise<MockQueryResult<{ name: string }[]>>;
  };
}

export interface MockSupabaseClient {
  from: (table: string) => MockTableMethods;
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<MockQueryResult>;
  auth: MockAuthMethods;
  storage: MockStorageMethods;
}

// =============================================================================
// Supabase Client
// =============================================================================

/**
 * 서버사이드 Supabase 클라이언트 생성
 * Service Role Key 사용 (RLS 우회)
 */
export async function createClient() {
  if (!supabaseUrl || !isEnvConfigured()) {
    console.warn('[Supabase] Environment not configured, using mock client');
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

function createMockClient(): MockSupabaseClient {
  const mockQueryBuilder: MockQueryBuilder = {
    eq: () => mockQueryBuilder,
    neq: () => mockQueryBuilder,
    gt: () => mockQueryBuilder,
    gte: () => mockQueryBuilder,
    lt: () => mockQueryBuilder,
    lte: () => mockQueryBuilder,
    like: () => mockQueryBuilder,
    ilike: () => mockQueryBuilder,
    is: () => mockQueryBuilder,
    in: () => mockQueryBuilder,
    contains: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    range: () => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => Promise.resolve(resolve({ data: [], error: null })),
  };

  return {
    from: () => ({
      select: () => mockQueryBuilder,
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
        match: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
        match: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: '' }, error: null }),
        download: () => Promise.resolve({ data: new Blob(), error: null }),
        remove: () => Promise.resolve({ data: [], error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: () => Promise.resolve({ data: [], error: null }),
      }),
    },
  };
}

// =============================================================================
// Exports
// =============================================================================

export { createSupabaseClient };
