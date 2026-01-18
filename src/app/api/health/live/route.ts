/**
 * Liveness Probe
 * GET /api/health/live - Is the process alive?
 *
 * For Kubernetes liveness probe:
 * - Returns 200 if process is running
 * - Returns 503 if process should be restarted
 */

import { NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export async function GET() {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    // Basic check - if we can execute, we're alive
    return NextResponse.json(
      {
        status: 'alive',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    statusCode = 503;
    return NextResponse.json(
      {
        status: 'dead',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } finally {
    metrics.httpRequest(
      'GET',
      '/api/health/live',
      statusCode,
      (Date.now() - startTime) / 1000
    );
  }
}
