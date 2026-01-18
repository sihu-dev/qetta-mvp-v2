/**
 * CSRF Protection Module
 * Double-submit cookie pattern for CSRF protection
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

/**
 * Set CSRF token cookie
 */
export async function setCSRFCookie(response: NextResponse): Promise<string> {
  const token = generateCSRFToken();

  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

/**
 * Get CSRF token from cookies (server-side)
 */
export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  // Skip for safe methods
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (safeMethod) {
    return true;
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;
  if (!cookieToken) {
    return false;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return false;
  }

  // Compare tokens (constant-time comparison)
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF middleware helper
 */
export async function csrfMiddleware(
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF for API routes that handle their own auth
  const skipPaths = ['/api/health', '/api/metrics', '/api/webhook'];
  if (skipPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return { valid: true };
  }

  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }

  // Validate token
  const isValid = await validateCSRFToken(request);
  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid or missing CSRF token',
    };
  }

  return { valid: true };
}

/**
 * Generate CSRF input field for forms
 */
export function CSRFInput({ token }: { token: string }) {
  return {
    type: 'hidden',
    name: '_csrf',
    value: token,
  };
}

/**
 * Utility to add CSRF header to fetch requests
 */
export function getCSRFHeaders(token: string): Record<string, string> {
  return {
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Hook helper - Get CSRF token for client-side use
 * Call this from a Server Component and pass to Client Components
 */
export async function getCSRFTokenForClient(): Promise<string> {
  const token = await getCSRFToken();
  if (token) {
    return token;
  }
  // Generate new token if none exists
  return generateCSRFToken();
}
