/**
 * Structured Error Classes
 * Consistent error types for better error handling and reporting
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      isOperational?: boolean;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'INTERNAL_ERROR';
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    this.cause = options.cause;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV !== 'production' && {
          stack: this.stack,
          context: this.context,
        }),
      },
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      isOperational: true,
      context,
    });
    this.fields = fields;
  }

  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        fields: this.fields,
      },
    };
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, {
      code: 'AUTHENTICATION_ERROR',
      statusCode: 401,
      isOperational: true,
      context,
    });
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, unknown>) {
    super(message, {
      code: 'AUTHORIZATION_ERROR',
      statusCode: 403,
      isOperational: true,
      context,
    });
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(resource?: string, context?: Record<string, unknown>) {
    super(resource ? `${resource} not found` : 'Resource not found', {
      code: 'NOT_FOUND',
      statusCode: 404,
      isOperational: true,
      context,
    });
    this.resource = resource;
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'CONFLICT',
      statusCode: 409,
      isOperational: true,
      context,
    });
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, {
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      isOperational: true,
      context: { retryAfter },
    });
    this.retryAfter = retryAfter;
  }

  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        retryAfter: this.retryAfter,
      },
    };
  }
}

/**
 * External service error (502/503)
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message?: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message || `External service error: ${service}`, {
      code: 'EXTERNAL_SERVICE_ERROR',
      statusCode: 502,
      isOperational: true,
      context: { service, ...context },
      cause,
    });
    this.service = service;
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, {
      code: 'DATABASE_ERROR',
      statusCode: 500,
      isOperational: true,
      context,
      cause,
    });
  }
}

/**
 * Configuration error (500)
 */
export class ConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'CONFIGURATION_ERROR',
      statusCode: 500,
      isOperational: false,
      context,
    });
  }
}

/**
 * Timeout error (504)
 */
export class TimeoutError extends AppError {
  public readonly operation?: string;
  public readonly timeoutMs?: number;

  constructor(operation?: string, timeoutMs?: number) {
    super(
      operation
        ? `Operation timed out: ${operation}${timeoutMs ? ` (${timeoutMs}ms)` : ''}`
        : 'Operation timed out',
      {
        code: 'TIMEOUT',
        statusCode: 504,
        isOperational: true,
        context: { operation, timeoutMs },
      }
    );
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to an AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, {
      cause: error,
      isOperational: false,
    });
  }

  return new AppError(String(error), {
    isOperational: false,
  });
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  body: Record<string, unknown>;
  statusCode: number;
} {
  const appError = toAppError(error);
  return {
    body: appError.toJSON(),
    statusCode: appError.statusCode,
  };
}

/**
 * Assert condition and throw validation error if false
 */
export function assertValid(
  condition: boolean,
  message: string,
  field?: string
): asserts condition {
  if (!condition) {
    throw new ValidationError(
      message,
      field ? { [field]: [message] } : undefined
    );
  }
}

/**
 * Assert value exists and throw not found error if not
 */
export function assertExists<T>(
  value: T | null | undefined,
  resource: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource);
  }
}
