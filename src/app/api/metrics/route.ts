/**
 * GET /api/metrics
 * Prometheus-compatible metrics endpoint
 *
 * Returns metrics in Prometheus text exposition format.
 * Intended for scraping by Prometheus or compatible monitoring systems.
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsStore } from '@/lib/metrics';

// Simple authentication for metrics endpoint (optional, can be enabled in production)
const METRICS_AUTH_TOKEN = process.env.METRICS_AUTH_TOKEN;

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Optional authentication for metrics endpoint
  if (METRICS_AUTH_TOKEN) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== METRICS_AUTH_TOKEN) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  // Get format from query parameter (default: prometheus)
  const format = request.nextUrl.searchParams.get('format') || 'prometheus';

  if (format === 'json') {
    // JSON format for debugging
    return NextResponse.json(metricsStore.toJSON(), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Prometheus text format (default)
  const metricsText = metricsStore.toPrometheusFormat();

  return new NextResponse(metricsText, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
