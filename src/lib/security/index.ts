/**
 * Security Module
 * Unified exports for all security-related functionality
 * - API Security (rate limiting, CSRF, auth)
 * - SBOM Generation
 * - Audit Logging
 * - PII Masking
 */

// Core Security (API Security, CSRF, Rate Limiting)
export {
  withSecurity,
  secureApiHandler,
  createSecureRoute,
  addSecurityHeaders,
  publicRoute,
  authRoute,
  aiRoute,
  uploadRoute,
  type ApiSecurityOptions,
  type SecurityContext,
  type SecureApiResult,
} from '../api-security';

export {
  generateCSRFToken,
  setCSRFCookie,
  getCSRFToken,
  validateCSRFToken,
  csrfMiddleware,
  CSRFInput,
  getCSRFHeaders,
  getCSRFTokenForClient,
} from '../csrf';

export {
  RateLimiter,
  rateLimiters,
  createRateLimiter,
  getClientIdentifier,
  type RateLimiterOptions,
} from '../rate-limiter';

// SBOM, Audit, PII
export * from './sbom-generator';
export * from './audit-logger';
export * from './pii-masker';
