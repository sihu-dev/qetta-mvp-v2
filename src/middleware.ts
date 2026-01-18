/**
 * Next.js Middleware
 * Handles request tracing, security headers, and CSP nonce generation
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Generate a request ID (UUID-like format)
 */
function generateRequestId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Format as UUID-like string
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Build Content Security Policy header
 */
function buildCSP(nonce: string): string {
  const isProduction = process.env.NODE_ENV === 'production';

  // Base CSP directives
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    'style-src': ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      // Supabase
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      // Sentry
      'https://*.ingest.sentry.io',
      'https://*.sentry.io',
      // Allow localhost in development
      ...(!isProduction ? ['http://localhost:*', 'ws://localhost:*'] : []),
    ].filter(Boolean),
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  // In development, allow eval for hot reload
  if (!isProduction) {
    directives['script-src'].push("'unsafe-eval'");
  }

  // Build CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 */
function getSecurityHeaders(nonce: string): Record<string, string> {
  return {
    // Content Security Policy
    'Content-Security-Policy': buildCSP(nonce),

    // Strict Transport Security (HSTS)
    // 1 year = 31536000 seconds
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy (formerly Feature Policy)
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // XSS Protection (legacy, but still useful for older browsers)
    'X-XSS-Protection': '1; mode=block',

    // DNS Prefetch Control
    'X-DNS-Prefetch-Control': 'on',
  };
}

export function middleware(request: NextRequest) {
  // Generate request ID and nonce
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const nonce = generateNonce();

  // Get the response
  const response = NextResponse.next();

  // Add request ID to response headers
  response.headers.set('x-request-id', requestId);

  // Add CSP nonce to headers (for use by scripts)
  response.headers.set('x-csp-nonce', nonce);

  // Add security headers
  const securityHeaders = getSecurityHeaders(nonce);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Request-ID, X-CSRF-Token'
      );
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  return response;
}

/**
 * Matcher configuration
 * Apply middleware to all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
