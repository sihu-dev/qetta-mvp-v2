'use client';

/**
 * Dashboard Data Hook
 * Manages dashboard metrics and health status
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api/client';
import type { DashboardMetrics, HealthCheckResponse } from '@/lib/api/types';

interface UseDashboardOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseDashboardReturn {
  metrics: DashboardMetrics | null;
  health: HealthCheckResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchMetrics: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  refreshAll: () => Promise<void>;
  refresh: () => Promise<void>; // Alias for refreshAll
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { autoFetch = true, refreshInterval } = options;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<DashboardMetrics>('/api/metrics');

      if (response.success && response.data) {
        setMetrics(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error?.message || '메트릭을 불러오는데 실패했습니다.');
      }
    } catch {
      setError('메트릭을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await api.get<HealthCheckResponse>('/api/health');

      if (response.success && response.data) {
        setHealth(response.data);
      }
    } catch {
      // Silent fail for health check
      setHealth({
        status: 'unhealthy',
        version: 'unknown',
        timestamp: new Date().toISOString(),
        services: {
          database: 'down',
          storage: 'down',
          ai: 'down',
        },
        latency_ms: 0,
      });
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchMetrics(), fetchHealth()]);
  }, [fetchMetrics, fetchHealth]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      refreshAll();
    }
  }, [autoFetch, refreshAll]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshAll();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, refreshAll]);

  return {
    metrics,
    health,
    loading,
    error,
    lastUpdated,
    fetchMetrics,
    fetchHealth,
    refreshAll,
    refresh: refreshAll, // Alias for refreshAll
  };
}

export default useDashboard;
