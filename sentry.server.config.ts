/**
 * Sentry Server Configuration
 * This file configures the initialization of Sentry for the server.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== 'production',

  // Integrations for server-side monitoring
  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    Sentry.httpIntegration(),
    Sentry.nativeNodeFetchIntegration(),
  ],

  // Filter and process events before sending
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't send expected errors
    if (error instanceof Error) {
      // Ignore expected authentication errors
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return null;
      }

      // Ignore expected validation errors (400s)
      if (error.message.includes('Bad Request') || error.message.includes('400')) {
        return null;
      }

      // Ignore rate limit errors (handled by rate limiter)
      if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
        return null;
      }
    }

    return event;
  },

  // Server-specific options
  serverName: process.env.VERCEL_URL || 'qetta-mvp-local',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
});
