import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  validationError,
  paginatedResponse,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  internalError,
  serviceUnavailable,
  ErrorCodes,
} from '../response';

describe('successResponse', () => {
  it('returns success response with data', async () => {
    const data = { id: 1, name: 'test' };
    const response = successResponse(data);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(data);
  });

  it('includes metadata when provided', async () => {
    const data = { id: 1 };
    const metadata = { executionTime: 100 };
    const response = successResponse(data, metadata);
    const body = await response.json();

    expect(body.metadata).toEqual(metadata);
  });

  it('uses custom status code', async () => {
    const response = successResponse({ id: 1 }, undefined, 201);
    expect(response.status).toBe(201);
  });

  it('does not include metadata if empty', async () => {
    const response = successResponse({ id: 1 }, {});
    const body = await response.json();

    expect(body.metadata).toBeUndefined();
  });
});

describe('errorResponse', () => {
  it('returns error response with code and message', async () => {
    const response = errorResponse(ErrorCodes.BAD_REQUEST, 'Invalid input');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ErrorCodes.BAD_REQUEST);
    expect(body.error.message).toBe('Invalid input');
  });

  it('includes details when provided', async () => {
    const details = { field: 'email', reason: 'invalid format' };
    const response = errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, details);
    const body = await response.json();

    expect(body.error.details).toEqual(details);
  });

  it('uses custom status code', async () => {
    const response = errorResponse(ErrorCodes.INTERNAL_ERROR, 'Server error', 500);
    expect(response.status).toBe(500);
  });
});

describe('validationError', () => {
  it('returns validation error with field', async () => {
    const response = validationError('email', 'Email is required');
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(body.error.field).toBe('email');
    expect(body.error.message).toBe('Email is required');
  });

  it('includes details when provided', async () => {
    const response = validationError('password', 'Too short', { minLength: 8 });
    const body = await response.json();

    expect(body.error.details).toEqual({ minLength: 8 });
  });
});

describe('paginatedResponse', () => {
  it('returns paginated response with correct metadata', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const response = paginatedResponse(data, { page: 1, pageSize: 10, total: 25 });
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual(data);
    expect(body.metadata.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasMore: true,
    });
  });

  it('calculates hasMore correctly for last page', async () => {
    const response = paginatedResponse([], { page: 3, pageSize: 10, total: 25 });
    const body = await response.json();

    expect(body.metadata.pagination.hasMore).toBe(false);
  });

  it('handles zero total', async () => {
    const response = paginatedResponse([], { page: 1, pageSize: 10, total: 0 });
    const body = await response.json();

    expect(body.metadata.pagination.totalPages).toBe(0);
    expect(body.metadata.pagination.hasMore).toBe(false);
  });
});

describe('error response shortcuts', () => {
  it('badRequest returns 400', async () => {
    const response = badRequest('Bad request');
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.BAD_REQUEST);
  });

  it('unauthorized returns 401', async () => {
    const response = unauthorized();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('unauthorized uses custom message', async () => {
    const response = unauthorized('Please log in');
    const body = await response.json();
    expect(body.error.message).toBe('Please log in');
  });

  it('forbidden returns 403', async () => {
    const response = forbidden();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.FORBIDDEN);
  });

  it('notFound returns 404', async () => {
    const response = notFound('User');
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.message).toBe('User not found');
  });

  it('conflict returns 409', async () => {
    const response = conflict('Resource already exists');
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.CONFLICT);
  });

  it('internalError returns 500', async () => {
    const response = internalError();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
  });

  it('serviceUnavailable returns 503', async () => {
    const response = serviceUnavailable();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
  });
});

describe('ErrorCodes', () => {
  it('contains expected error codes', () => {
    expect(ErrorCodes.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCodes.CONFLICT).toBe('CONFLICT');
    expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
    expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR');
    expect(ErrorCodes.EXTERNAL_API_ERROR).toBe('EXTERNAL_API_ERROR');
  });
});
