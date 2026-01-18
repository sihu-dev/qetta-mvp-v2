/**
 * Health Check API
 * GET /api/health - Overall health status
 */

import { NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    duration?: number;
  }[];
}

const startTime = Date.now();

export async function GET() {
  const requestStart = Date.now();
  let statusCode = 200;

  try {
    const checks: HealthStatus['checks'] = [];

    // Memory check
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const heapPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    checks.push({
      name: 'memory',
      status: heapPercent > 90 ? 'fail' : heapPercent > 75 ? 'warn' : 'pass',
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercent.toFixed(1)}%)`,
    });

    // Environment check
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

    checks.push({
      name: 'environment',
      status: missingEnvVars.length > 0 ? 'fail' : 'pass',
      message:
        missingEnvVars.length > 0
          ? `Missing: ${missingEnvVars.join(', ')}`
          : 'All required env vars present',
    });

    // Determine overall status
    const hasFailure = checks.some((c) => c.status === 'fail');
    const hasWarning = checks.some((c) => c.status === 'warn');

    const overallStatus: HealthStatus['status'] = hasFailure
      ? 'unhealthy'
      : hasWarning
        ? 'degraded'
        : 'healthy';

    statusCode = hasFailure ? 503 : 200;

    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.0',
      uptime: Math.round((Date.now() - startTime) / 1000),
      checks,
    };

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    statusCode = 500;
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest(
      'GET',
      '/api/health',
      statusCode,
      (Date.now() - requestStart) / 1000
    );
  }
}
