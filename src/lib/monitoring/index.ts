/**
 * Monitoring Module
 * Re-exports Sentry utilities for error tracking and performance monitoring
 */

export {
  setUserContext,
  setRequestContext,
  captureException,
  captureMessage,
  withSpan,
  addBreadcrumb,
  withErrorCapture,
  withScope,
  flush,
  throwTestError,
  type UserContext,
  type RequestContext,
} from './sentry';
