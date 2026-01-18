/**
 * Resilience Module
 * Re-exports circuit breaker, retry, and error handling utilities
 */

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitOpenError,
  TimeoutError as CircuitTimeoutError,
  circuitBreakers,
  createCircuitBreaker,
  type CircuitState,
  type CircuitBreakerOptions,
  type CircuitBreakerStats,
} from './circuit-breaker';

// Retry
export {
  retry,
  withRetry,
  Retryable,
  retryPresets,
  type RetryOptions,
} from './retry';

// Errors
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  ConfigurationError,
  TimeoutError,
  isAppError,
  toAppError,
  formatErrorResponse,
  assertValid,
  assertExists,
} from './errors';
