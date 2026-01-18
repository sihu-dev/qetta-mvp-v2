/**
 * API Security Module
 * Unified security middleware for API routes
 *
 * Features:
 * - Rate Limiting (Token Bucket)
 * - CSRF Protection (Double-Submit Cookie)
 * - Request Validation
 * - Security Headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, getClientIdentifier, type RateLimiter } from './rate-limiter';
import { validateCSRFToken } from './csrf';
import { RateLimitError, AuthenticationError } from './resilience/errors';
import { createServerClient } from './supabase';
import { logger } from './logging';

// ============================================================
// Types
// ============================================================

export interface ApiSecurityOptions {
  /** Rate limiter to use (defaults to 'api') */
  rateLimiter?: 'api' | 'auth' | 'ai' | 'upload' | RateLimiter;
  /** Require authentication */
  requireAuth?: boolean;
  /** Require CSRF token for mutations (POST, PUT, PATCH, DELETE) */
  requireCSRF?: boolean;
  /** Skip rate limiting for certain conditions */
  skipRateLimit?: (request: NextRequest) => boolean;
  /** Skip CSRF for certain conditions */
  skipCSRF?: (request: NextRequest) => boolean;
}

export interface SecurityContext {
  /** Client identifier for rate limiting */
  clientId: string;
  /** Authenticated user ID (if authenticated) */
  userId?: string;
  /** User's organization ID */
  orgId?: string;
  /** Request ID for tracing */
  requestId: string;
  /** Rate limit headers to include in response */
  rateLimitHeaders: Record<string, string>;
}

export interface SecureApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

// ============================================================
// Default Options
// ============================================================

const DEFAULT_OPTIONS: ApiSecurityOptions = {
  rateLimiter: 'api',
  requireAuth: false,
  requireCSRF: false,
};

// Safe HTTP methods that don't require CSRF protection
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Paths that skip CSRF validation
const CSRF_SKIP_PATHS = [
  '/api/health',
  '/api/metrics',
  '/api/webhook',
];

// Paths that skip rate limiting
const RATE_LIMIT_SKIP_PATHS = [
  '/api/health',
];

// ============================================================
// Security Middleware
// ============================================================

/**
 * Apply security checks to an API route
 * Returns a security context or an error response
 */
export async function withSecurity(
  request: NextRequest,
  options: ApiSecurityOptions = {}
): Promise<{ context?: SecurityContext; response?: NextResponse }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const clientId = getClientIdentifier(request);
  const path = request.nextUrl.pathname;

  // 1. Rate Limiting
  const shouldSkipRateLimit =
    opts.skipRateLimit?.(request) ||
    RATE_LIMIT_SKIP_PATHS.some(p => path.startsWith(p));

  if (!shouldSkipRateLimit) {
    const limiter = typeof opts.rateLimiter === 'string'
      ? rateLimiters[opts.rateLimiter]
      : opts.rateLimiter;

    if (limiter && !limiter.isAllowed(clientId)) {
      const headers = limiter.getHeaders(clientId);
      const retryAfter = headers['X-RateLimit-Reset'];

      logger.warn('Rate limit exceeded', { clientId, path, requestId });

      return {
        response: NextResponse.json(
          {
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: parseInt(retryAfter),
          },
          {
            status: 429,
            headers: {
              ...headers,
              'Retry-After': String(Math.ceil((parseInt(retryAfter) * 1000 - Date.now()) / 1000)),
              'x-request-id': requestId,
            },
          }
        ),
      };
    }
  }

  // 2. CSRF Protection (for mutations)
  const isMutation = !SAFE_METHODS.includes(request.method);
  const shouldCheckCSRF =
    opts.requireCSRF &&
    isMutation &&
    !opts.skipCSRF?.(request) &&
    !CSRF_SKIP_PATHS.some(p => path.startsWith(p));

  if (shouldCheckCSRF) {
    const isValid = await validateCSRFToken(request);
    if (!isValid) {
      logger.warn('CSRF validation failed', { clientId, path, requestId });

      return {
        response: NextResponse.json(
          {
            error: 'Invalid or missing CSRF token',
            code: 'CSRF_ERROR',
          },
          {
            status: 403,
            headers: { 'x-request-id': requestId },
          }
        ),
      };
    }
  }

  // 3. Authentication Check
  let userId: string | undefined;
  let orgId: string | undefined;

  if (opts.requireAuth) {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      logger.warn('Authentication required', { clientId, path, requestId });

      return {
        response: NextResponse.json(
          {
            error: 'Authentication required',
            code: 'AUTHENTICATION_ERROR',
          },
          {
            status: 401,
            headers: { 'x-request-id': requestId },
          }
        ),
      };
    }

    userId = user.id;

    // Try to get user's organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    orgId = membership?.org_id;
  }

  // 4. Build rate limit headers for response
  const limiter = typeof opts.rateLimiter === 'string'
    ? rateLimiters[opts.rateLimiter]
    : opts.rateLimiter;
  const rateLimitHeaders = limiter?.getHeaders(clientId) || {};

  return {
    context: {
      clientId,
      userId,
      orgId,
      requestId,
      rateLimitHeaders,
    },
  };
}

/**
 * Wrap an API handler with security checks
 */
export function secureApiHandler<T>(
  handler: (request: NextRequest, context: SecurityContext) => Promise<T>,
  options: ApiSecurityOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { context, response } = await withSecurity(request, options);

    if (response) {
      return response;
    }

    if (!context) {
      return NextResponse.json(
        { error: 'Security check failed', code: 'SECURITY_ERROR' },
        { status: 500 }
      );
    }

    try {
      const result = await handler(request, context);

      // Add security headers to response
      const responseObj = result instanceof NextResponse
        ? result
        : NextResponse.json(result);

      // Add rate limit headers
      for (const [key, value] of Object.entries(context.rateLimitHeaders)) {
        responseObj.headers.set(key, value);
      }
      responseObj.headers.set('x-request-id', context.requestId);

      return responseObj;
    } catch (error) {
      logger.error('API handler error', {
        error,
        requestId: context.requestId,
        path: request.nextUrl.pathname,
      });

      if (error instanceof RateLimitError) {
        return NextResponse.json(
          {
            error: error.message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: error.retryAfter,
          },
          {
            status: 429,
            headers: { 'x-request-id': context.requestId },
          }
        );
      }

      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { error: error.message, code: 'AUTHENTICATION_ERROR' },
          {
            status: 401,
            headers: { 'x-request-id': context.requestId },
          }
        );
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        {
          status: 500,
          headers: { 'x-request-id': context.requestId },
        }
      );
    }
  };
}

/**
 * Create a secure API route with built-in protections
 */
export function createSecureRoute(options: ApiSecurityOptions = {}) {
  return {
    /**
     * Secure GET handler
     */
    GET: <T>(handler: (request: NextRequest, context: SecurityContext) => Promise<T>) =>
      secureApiHandler(handler, { ...options, requireCSRF: false }),

    /**
     * Secure POST handler (with CSRF protection by default)
     */
    POST: <T>(handler: (request: NextRequest, context: SecurityContext) => Promise<T>) =>
      secureApiHandler(handler, { ...options, requireCSRF: options.requireCSRF ?? true }),

    /**
     * Secure PUT handler (with CSRF protection by default)
     */
    PUT: <T>(handler: (request: NextRequest, context: SecurityContext) => Promise<T>) =>
      secureApiHandler(handler, { ...options, requireCSRF: options.requireCSRF ?? true }),

    /**
     * Secure PATCH handler (with CSRF protection by default)
     */
    PATCH: <T>(handler: (request: NextRequest, context: SecurityContext) => Promise<T>) =>
      secureApiHandler(handler, { ...options, requireCSRF: options.requireCSRF ?? true }),

    /**
     * Secure DELETE handler (with CSRF protection by default)
     */
    DELETE: <T>(handler: (request: NextRequest, context: SecurityContext) => Promise<T>) =>
      secureApiHandler(handler, { ...options, requireCSRF: options.requireCSRF ?? true }),
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(
  response: NextResponse,
  context: SecurityContext
): NextResponse {
  // Add rate limit headers
  for (const [key, value] of Object.entries(context.rateLimitHeaders)) {
    response.headers.set(key, value);
  }

  // Add request ID
  response.headers.set('x-request-id', context.requestId);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

// ============================================================
// Pre-configured Route Creators
// ============================================================

/**
 * Create a public API route (rate limited, no auth)
 */
export const publicRoute = createSecureRoute({
  rateLimiter: 'api',
  requireAuth: false,
  requireCSRF: false,
});

/**
 * Create an authenticated API route (rate limited, requires auth)
 */
export const authRoute = createSecureRoute({
  rateLimiter: 'api',
  requireAuth: true,
  requireCSRF: true,
});

/**
 * Create an AI API route (stricter rate limits)
 */
export const aiRoute = createSecureRoute({
  rateLimiter: 'ai',
  requireAuth: true,
  requireCSRF: true,
});

/**
 * Create an upload API route (file upload rate limits)
 */
export const uploadRoute = createSecureRoute({
  rateLimiter: 'upload',
  requireAuth: true,
  requireCSRF: true,
});
