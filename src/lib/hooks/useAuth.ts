'use client';

/**
 * Client-side Auth Hook
 * React hook for authentication state management
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { AuthUser, UserProfile, SystemRole } from '@/lib/auth/config';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { hasMinimumRole, hasPermission, type Permission } from '@/lib/auth/roles';

interface UseAuthReturn {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  hasRole: (role: SystemRole) => boolean;
  canAccess: (permission: Permission) => boolean;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch {
      return null;
    }
  }, []);

  // Set auth state
  const setAuthState = useCallback(
    async (supabaseUser: User | null, currentSession: Session | null) => {
      if (supabaseUser && currentSession) {
        const profile = await fetchProfile(supabaseUser.id);
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          profile,
        });
        setSession(currentSession);
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    },
    [fetchProfile]
  );

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        await setAuthState(currentSession?.user ?? null, currentSession);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      await setAuthState(currentSession?.user ?? null, currentSession);

      if (event === 'SIGNED_OUT') {
        router.push(AUTH_CONFIG.redirects.afterLogout);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, setAuthState]);

  // Sign in with email/password
  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push(AUTH_CONFIG.redirects.afterLogin);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Sign up with email/password
  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        });

        if (error) throw error;
        router.push(AUTH_CONFIG.redirects.afterSignup);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Not authenticated');

      setError(null);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) throw error;

        // Refresh profile
        const profile = await fetchProfile(user.id);
        setUser((prev) => (prev ? { ...prev, profile } : null));
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [user, fetchProfile]
  );

  // Check if user has minimum role
  const checkHasRole = useCallback(
    (role: SystemRole): boolean => {
      return hasMinimumRole(user?.profile?.system_role, role);
    },
    [user]
  );

  // Check if user can access feature
  const canAccess = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(user?.profile?.system_role, permission);
    },
    [user]
  );

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasRole: checkHasRole,
    canAccess,
  };
}
