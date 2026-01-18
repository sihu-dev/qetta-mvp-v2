/**
 * Readiness Probe
 * GET /api/health/ready - Is the service ready to accept traffic?
 *
 * For Kubernetes readiness probe:
 * - Returns 200 if ready to handle requests
 * - Returns 503 if not ready (should be removed from load balancer)
 */

import { NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';
import { circuitBreakers } from '@/lib/resilience';

interface ReadinessCheck {
  name: string;
  ready: boolean;
  message?: string;
}

export async function GET() {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const checks: ReadinessCheck[] = [];

    // Check circuit breakers
    for (const [name, breaker] of Object.entries(circuitBreakers)) {
      const stats = breaker.getStats();
      const isAvailable = breaker.isAvailable();

      checks.push({
        name: `circuit:${name}`,
        ready: isAvailable,
        message: isAvailable
          ? `${stats.state} (failures: ${stats.failures})`
          : `Circuit OPEN - ${stats.failures} failures`,
      });
    }

    // Check memory pressure
    const memoryUsage = process.memoryUsage();
    const heapPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    const memoryReady = heapPercent < 95;

    checks.push({
      name: 'memory',
      ready: memoryReady,
      message: memoryReady
        ? `Heap at ${heapPercent.toFixed(1)}%`
        : `Memory pressure: ${heapPercent.toFixed(1)}%`,
    });

    // Overall readiness
    const isReady = checks.every((c) => c.ready);
    statusCode = isReady ? 200 : 503;

    return NextResponse.json(
      {
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks,
      },
      { status: statusCode }
    );
  } catch (error) {
    statusCode = 503;
    return NextResponse.json(
      {
        ready: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  } finally {
    metrics.httpRequest(
      'GET',
      '/api/health/ready',
      statusCode,
      (Date.now() - startTime) / 1000
    );
  }
}
