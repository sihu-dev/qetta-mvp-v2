/**
 * Sentry Edge Configuration
 * This file configures the initialization of Sentry for the Edge Runtime.
 * Used for middleware and edge functions.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Lower sample rate for edge functions due to high volume
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== 'production',

  // Filter and process events before sending
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't send expected errors in edge context
    if (error instanceof Error) {
      // Ignore CORS preflight issues (expected)
      if (error.message.includes('CORS')) {
        return null;
      }

      // Ignore redirect errors (expected behavior)
      if (error.message.includes('Redirect')) {
        return null;
      }
    }

    return event;
  },

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
});
