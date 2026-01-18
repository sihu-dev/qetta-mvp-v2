'use client';

/**
 * RoleGate Component
 * Controls access based on user system role
 */

import { type ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { SystemRole } from '@/lib/auth/config';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: SystemRole[];
  fallback?: ReactNode;
}

const ROLE_HIERARCHY: Record<SystemRole, number> = {
  user: 1,
  developer: 2,
  admin: 3,
};

export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <h3 className="text-gray-900 font-medium">로그인이 필요합니다</h3>
        <p className="text-gray-500 text-sm mt-1">이 페이지에 접근하려면 로그인하세요.</p>
      </div>
    );
  }

  const userRole = user.profile?.system_role || 'user';
  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    return fallback || (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <h3 className="text-gray-900 font-medium">접근 권한이 없습니다</h3>
        <p className="text-gray-500 text-sm mt-1">이 페이지에 접근할 권한이 없습니다.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function hasRole(userRole: SystemRole, requiredRole: SystemRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isDeveloper(userRole?: SystemRole): boolean {
  if (!userRole) return false;
  return hasRole(userRole, 'developer');
}

export function isAdmin(userRole?: SystemRole): boolean {
  if (!userRole) return false;
  return hasRole(userRole, 'admin');
}

export default RoleGate;
