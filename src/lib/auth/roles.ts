/**
 * Role Utilities
 * Permission checks and role hierarchy
 */

import type { SystemRole } from './config';

/**
 * Role hierarchy (higher index = more permissions)
 */
const ROLE_HIERARCHY: Record<SystemRole, number> = {
  user: 0,
  developer: 1,
  admin: 2,
};

/**
 * Check if user role meets minimum required role
 */
export function hasMinimumRole(
  userRole: SystemRole | undefined | null,
  requiredRole: SystemRole
): boolean {
  const actualRole = userRole || 'user';
  return ROLE_HIERARCHY[actualRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can access developer features
 */
export function canAccessDeveloper(role: SystemRole | undefined | null): boolean {
  return hasMinimumRole(role, 'developer');
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(role: SystemRole | undefined | null): boolean {
  return hasMinimumRole(role, 'admin');
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: SystemRole): string {
  const displayNames: Record<SystemRole, string> = {
    user: '일반 사용자',
    developer: '개발자',
    admin: '관리자',
  };
  return displayNames[role];
}

/**
 * Get role badge color (Tailwind classes)
 */
export function getRoleBadgeColor(role: SystemRole): string {
  const colors: Record<SystemRole, string> = {
    user: 'bg-slate-100 text-slate-700',
    developer: 'bg-blue-100 text-blue-700',
    admin: 'bg-amber-100 text-amber-700',
  };
  return colors[role];
}

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': ['user', 'developer', 'admin'] as SystemRole[],

  // Evidence
  'evidence:view': ['user', 'developer', 'admin'] as SystemRole[],
  'evidence:create': ['user', 'developer', 'admin'] as SystemRole[],
  'evidence:delete': ['developer', 'admin'] as SystemRole[],

  // Tender
  'tender:view': ['user', 'developer', 'admin'] as SystemRole[],
  'tender:analyze': ['user', 'developer', 'admin'] as SystemRole[],
  'tender:generate': ['user', 'developer', 'admin'] as SystemRole[],

  // AGI
  'agi:view': ['user', 'developer', 'admin'] as SystemRole[],
  'agi:execute': ['developer', 'admin'] as SystemRole[],

  // Developer
  'dev:logs': ['developer', 'admin'] as SystemRole[],
  'dev:metrics': ['developer', 'admin'] as SystemRole[],
  'dev:test': ['developer', 'admin'] as SystemRole[],

  // Admin
  'admin:users': ['admin'] as SystemRole[],
  'admin:settings': ['admin'] as SystemRole[],
  'admin:billing': ['admin'] as SystemRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if role has permission
 */
export function hasPermission(
  role: SystemRole | undefined | null,
  permission: Permission
): boolean {
  const actualRole = role || 'user';
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(actualRole);
}
