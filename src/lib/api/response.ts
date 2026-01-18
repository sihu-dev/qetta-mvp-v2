/**
 * API Response Standardization
 * Unified response format for all API endpoints
 */

import { NextResponse } from 'next/server';

// =============================================================================
// Types
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

/**
 * Standard error format
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  field?: string;
}

/**
 * Response metadata
 */
export interface ApiMetadata {
  /** Request execution time in milliseconds */
  executionTime?: number;
  /** Request ID for tracing */
  requestId?: string;
  /** API version */
  version?: string;
  /** Pagination info */
  pagination?: PaginationMeta;
  /** Additional context-specific metadata */
  [key: string]: unknown;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// =============================================================================
// Error Codes
// =============================================================================

export const ErrorCodes = {
  // Client Errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CSRF_ERROR: 'CSRF_ERROR',

  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',

  // Business Logic Errors
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// Response Builders
// =============================================================================

/**
 * Create a successful response
 */
export function successResponse<T>(
  data: T,
  metadata?: Partial<ApiMetadata>,
  status = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (metadata && Object.keys(metadata).length > 0) {
    response.metadata = metadata as ApiMetadata;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response
 */
export function validationError(
  field: string,
  message: string,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message,
        field,
        ...(details !== undefined && { details }),
      },
    } as ApiResponse<never>,
    { status: 400 }
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  },
  metadata?: Partial<Omit<ApiMetadata, 'pagination'>>
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return NextResponse.json({
    success: true,
    data,
    metadata: {
      ...metadata,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages,
        hasMore: pagination.page < totalPages,
      },
    },
  } as ApiResponse<T[]>);
}

// =============================================================================
// Error Response Shortcuts
// =============================================================================

export function badRequest(message: string, details?: unknown) {
  return errorResponse(ErrorCodes.BAD_REQUEST, message, 400, details);
}

export function unauthorized(message = 'Authentication required') {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbidden(message = 'Access denied') {
  return errorResponse(ErrorCodes.FORBIDDEN, message, 403);
}

export function notFound(resource = 'Resource') {
  return errorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
}

export function conflict(message: string) {
  return errorResponse(ErrorCodes.CONFLICT, message, 409);
}

export function rateLimited(retryAfter?: number) {
  const response = errorResponse(
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    'Too many requests',
    429,
    retryAfter ? { retryAfter } : undefined
  );

  if (retryAfter) {
    response.headers.set('Retry-After', String(retryAfter));
  }

  return response;
}

export function internalError(message = 'Internal server error') {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message, 500);
}

export function serviceUnavailable(message = 'Service temporarily unavailable') {
  return errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, message, 503);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Add execution time to response metadata
 */
export function withExecutionTime<T extends ApiResponse>(
  response: NextResponse<T>,
  startTime: number
): NextResponse<T> {
  const executionTime = Date.now() - startTime;
  response.headers.set('X-Execution-Time', String(executionTime));
  return response;
}

/**
 * Add request ID to response
 */
export function withRequestId<T extends ApiResponse>(
  response: NextResponse<T>,
  requestId: string
): NextResponse<T> {
  response.headers.set('X-Request-Id', requestId);
  return response;
}

/**
 * Wrap an async handler with error handling
 */
export async function handleApiRequest<T>(
  handler: () => Promise<T>,
  options: {
    startTime?: number;
    requestId?: string;
  } = {}
): Promise<NextResponse<ApiResponse<T>>> {
  const startTime = options.startTime ?? Date.now();

  try {
    const data = await handler();
    let response = successResponse(data, {
      executionTime: Date.now() - startTime,
      requestId: options.requestId,
    });

    if (options.requestId) {
      response = withRequestId(response, options.requestId);
    }

    return withExecutionTime(response, startTime);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return internalError(message);
  }
}
