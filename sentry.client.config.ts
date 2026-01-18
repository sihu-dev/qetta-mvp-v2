/**
 * Sentry Client Configuration
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (optional, for debugging UX issues)
  // Disabled by default for privacy
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== 'production',

  // Capture unhandled promise rejections
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: true,
      // Block all media for privacy
      blockAllMedia: true,
    }),
  ],

  // Filter out specific errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore cancelled fetch requests
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return null;
      }

      // Ignore network errors that are expected
      if (error.message.includes('Failed to fetch')) {
        // Only send if it's not a simple network timeout
        if (!error.message.includes('timeout')) {
          return null;
        }
      }
    }

    return event;
  },

  // Set up user context automatically from localStorage if available
  initialScope: (scope) => {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      const orgId = localStorage.getItem('orgId');

      if (userId) {
        scope.setUser({ id: userId });
      }
      if (orgId) {
        scope.setTag('orgId', orgId);
      }
    }
    return scope;
  },

  // Ignore specific URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Firefox extensions
    /^resource:\/\//i,
    // Safari extensions
    /^safari-extension:\/\//i,
  ],
});
