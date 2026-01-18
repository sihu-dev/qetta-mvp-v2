/**
 * Server-side Auth Utilities
 * For API routes and Server Components
 */

import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import type { AuthUser, UserProfile } from './config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create Supabase client for Server Components/API Routes
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from Server Component, ignore
        }
      },
    },
  });
}

/**
 * Get current authenticated user
 */
export async function getUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      profile: profile as UserProfile | null,
    };
  } catch {
    return null;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = await createServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return session;
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Require specific role
 */
export async function requireRole(
  allowedRoles: ('user' | 'developer' | 'admin')[]
): Promise<AuthUser> {
  const user = await requireAuth();

  const userRole = user.profile?.system_role || 'user';

  if (!allowedRoles.includes(userRole)) {
    throw new Error('Forbidden');
  }

  return user;
}

/**
 * Check if user has role
 */
export async function hasRole(role: 'user' | 'developer' | 'admin'): Promise<boolean> {
  const user = await getUser();

  if (!user) {
    return false;
  }

  const userRole = user.profile?.system_role || 'user';

  // Admin has all roles
  if (userRole === 'admin') {
    return true;
  }

  // Developer has developer and user roles
  if (userRole === 'developer' && (role === 'developer' || role === 'user')) {
    return true;
  }

  return userRole === role;
}
