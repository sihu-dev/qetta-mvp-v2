/**
 * Auth Configuration
 * Supabase Auth settings and constants
 */

export const AUTH_CONFIG = {
  // Session settings
  session: {
    expiryMargin: 60, // seconds before expiry to refresh
    persistSession: true,
  },

  // Redirect paths
  redirects: {
    afterLogin: '/dashboard',
    afterLogout: '/login',
    afterSignup: '/dashboard',
    unauthorized: '/login',
  },

  // Protected routes
  routes: {
    public: ['/', '/login', '/register', '/forgot-password', '/reset-password'],
    protected: ['/dashboard'],
    developer: ['/dashboard/dev'],
    admin: ['/dashboard/admin'],
  },

  // Cookie names
  cookies: {
    accessToken: 'sb-access-token',
    refreshToken: 'sb-refresh-token',
  },
} as const;

export type SystemRole = 'user' | 'developer' | 'admin';

export interface UserProfile {
  id: string;
  system_role: SystemRole;
  display_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  onboarding_completed: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}
