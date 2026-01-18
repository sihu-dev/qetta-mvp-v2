/**
 * Sentry Utilities
 * Helper functions for Sentry error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

export interface UserContext {
  id: string;
  email?: string;
  orgId?: string;
  role?: string;
}

export interface RequestContext {
  requestId: string;
  path: string;
  method: string;
  userAgent?: string;
}

/**
 * Set user context for Sentry tracking
 */
export function setUserContext(user: UserContext | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
    if (user.orgId) {
      Sentry.setTag('orgId', user.orgId);
    }
    if (user.role) {
      Sentry.setTag('userRole', user.role);
    }
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Set request context for better error grouping
 */
export function setRequestContext(context: RequestContext): void {
  Sentry.setTag('requestId', context.requestId);
  Sentry.setContext('request', {
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    userAgent: context.userAgent,
  });
}

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  });
}

/**
 * Capture a message for non-error events
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string {
  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Create a span for performance tracking
 */
export async function withSpan<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: operation,
      attributes,
    },
    fn
  );
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Wrap an async function with error capturing
 */
export function withErrorCapture<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  context?: {
    name?: string;
    tags?: Record<string, string>;
  }
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, {
        tags: {
          function: context?.name || fn.name || 'anonymous',
          ...context?.tags,
        },
        extra: {
          args: args.map((arg) =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ),
        },
      });
      throw error;
    }
  };
}

/**
 * Create a scoped context for a specific operation
 */
export function withScope<T>(
  configure: (scope: Sentry.Scope) => void,
  fn: () => T
): T {
  return Sentry.withScope((scope) => {
    configure(scope);
    return fn();
  });
}

/**
 * Flush Sentry events (useful before serverless function terminates)
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

/**
 * Debug endpoint for testing Sentry integration
 * Only available in development
 */
export function throwTestError(): never {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test errors disabled in production');
  }
  throw new Error('Sentry test error - this is intentional');
}
