/**
 * Request Context Management
 * AsyncLocalStorage-based request context for distributed tracing
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Request context data structure
 */
export interface RequestContextData {
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  userId?: string;
  orgId?: string;
  path?: string;
  method?: string;
  startTime: number;
  metadata: Record<string, unknown>;
}

/**
 * AsyncLocalStorage instance for request context
 */
const requestContextStorage = new AsyncLocalStorage<RequestContextData>();

/**
 * Generate a new request ID (UUID v4 format)
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Generate a shorter span ID (16 hex characters)
 */
export function generateSpanId(): string {
  return randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Run a function with request context
 */
export function runWithContext<T>(
  context: Partial<RequestContextData>,
  fn: () => T
): T {
  const fullContext: RequestContextData = {
    requestId: context.requestId || generateRequestId(),
    traceId: context.traceId || generateRequestId(),
    spanId: context.spanId || generateSpanId(),
    parentSpanId: context.parentSpanId,
    userId: context.userId,
    orgId: context.orgId,
    path: context.path,
    method: context.method,
    startTime: context.startTime || Date.now(),
    metadata: context.metadata || {},
  };

  return requestContextStorage.run(fullContext, fn);
}

/**
 * Run an async function with request context
 */
export async function runWithContextAsync<T>(
  context: Partial<RequestContextData>,
  fn: () => Promise<T>
): Promise<T> {
  const fullContext: RequestContextData = {
    requestId: context.requestId || generateRequestId(),
    traceId: context.traceId || generateRequestId(),
    spanId: context.spanId || generateSpanId(),
    parentSpanId: context.parentSpanId,
    userId: context.userId,
    orgId: context.orgId,
    path: context.path,
    method: context.method,
    startTime: context.startTime || Date.now(),
    metadata: context.metadata || {},
  };

  return requestContextStorage.run(fullContext, fn);
}

/**
 * Get the current request context
 */
export function getRequestContext(): RequestContextData | undefined {
  return requestContextStorage.getStore();
}

/**
 * Get the current request ID (or generate a new one if not in context)
 */
export function getRequestId(): string {
  const context = getRequestContext();
  return context?.requestId || generateRequestId();
}

/**
 * Get the current trace ID
 */
export function getTraceId(): string | undefined {
  return getRequestContext()?.traceId;
}

/**
 * Get the current span ID
 */
export function getSpanId(): string | undefined {
  return getRequestContext()?.spanId;
}

/**
 * Get the current user ID from context
 */
export function getUserId(): string | undefined {
  return getRequestContext()?.userId;
}

/**
 * Get the current org ID from context
 */
export function getOrgId(): string | undefined {
  return getRequestContext()?.orgId;
}

/**
 * Get elapsed time since request start
 */
export function getElapsedTime(): number {
  const context = getRequestContext();
  if (!context) return 0;
  return Date.now() - context.startTime;
}

/**
 * Add metadata to current context
 */
export function addContextMetadata(key: string, value: unknown): void {
  const context = getRequestContext();
  if (context) {
    context.metadata[key] = value;
  }
}

/**
 * Create a child span context
 */
export function createChildSpan(): {
  spanId: string;
  parentSpanId: string | undefined;
  traceId: string | undefined;
} {
  const context = getRequestContext();
  return {
    spanId: generateSpanId(),
    parentSpanId: context?.spanId,
    traceId: context?.traceId,
  };
}

/**
 * Extract trace context from headers
 */
export function extractTraceContext(headers: Headers): Partial<RequestContextData> {
  const requestId = headers.get('x-request-id') || headers.get('x-correlation-id');
  const traceId = headers.get('x-trace-id') || headers.get('traceparent')?.split('-')[1];
  const spanId = headers.get('x-span-id') || headers.get('traceparent')?.split('-')[2];
  const parentSpanId = headers.get('x-parent-span-id');

  return {
    requestId: requestId || undefined,
    traceId: traceId || undefined,
    spanId: spanId || undefined,
    parentSpanId: parentSpanId || undefined,
  };
}

/**
 * Create trace headers for propagation to external services
 */
export function createTraceHeaders(): Record<string, string> {
  const context = getRequestContext();
  if (!context) {
    const requestId = generateRequestId();
    return {
      'x-request-id': requestId,
      'x-trace-id': requestId,
      'x-span-id': generateSpanId(),
    };
  }

  return {
    'x-request-id': context.requestId,
    'x-trace-id': context.traceId,
    'x-span-id': context.spanId,
    ...(context.parentSpanId && { 'x-parent-span-id': context.parentSpanId }),
    // W3C Trace Context format
    traceparent: `00-${context.traceId}-${context.spanId}-01`,
  };
}
