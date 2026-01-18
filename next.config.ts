import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Additional security headers (applied to all routes)
  // Note: CSP is handled dynamically in middleware for nonce support
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS - enforce HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },

  // Sentry build-time configuration
  // Source maps are uploaded during build
  productionBrowserSourceMaps: true,
};

// Sentry configuration for source map upload and error monitoring
const sentryWebpackPluginOptions = {
  // Organization and project from environment
  org: process.env.SENTRY_ORG || 'qetta',
  project: process.env.SENTRY_PROJECT || 'qetta-web',

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production builds
  silent: process.env.NODE_ENV !== 'production',

  // Don't fail the build if source map upload fails
  hideSourceMaps: true,

  // Disable source map upload if no auth token
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Additional options
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring-tunnel',
  automaticVercelMonitors: true,
};

// Export config with Sentry wrapper
// Only wrap with Sentry if DSN is configured
const config = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
