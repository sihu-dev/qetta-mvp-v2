'use client';

/**
 * Auth Provider Component
 * Provides authentication context to the app
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Session } from '@supabase/supabase-js';
import type { AuthUser, UserProfile, SystemRole } from '@/lib/auth/config';
import type { Permission } from '@/lib/auth/roles';

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Require auth wrapper - shows loading while checking auth
 */
interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  if (!user) {
    return null; // Middleware will redirect
  }

  return <>{children}</>;
}

/**
 * Role gate - only render if user has required role
 */
interface RoleGateProps {
  children: ReactNode;
  allowedRoles: SystemRole[];
  fallback?: ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { user, hasRole, loading } = useAuthContext();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const hasAccess = allowedRoles.some((role) => hasRole(role));

  if (!hasAccess) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
        <p className="text-gray-500">이 페이지에 접근할 수 있는 권한이 없습니다.</p>
      </div>
    );
  }

  return <>{children}</>;
}
