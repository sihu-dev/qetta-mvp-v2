'use client';

/**
 * AGI Data Hook
 * Manages 3-Tier Intelligence predictions and reasoning
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import type {
  AGIPrediction,
  AGIReasoningResponse,
  AGIStatsResponse,
  AGITier,
} from '@/lib/api/types';

interface UseAGIOptions {
  defaultTier?: AGITier;
}

interface UseAGIReturn {
  predictions: AGIPrediction[];
  stats: AGIStatsResponse | null;
  loading: boolean;
  predicting: boolean;
  reasoning: boolean;
  error: string | null;
  predict: (
    equipmentId: string,
    type: 'quality' | 'maintenance' | 'anomaly',
    horizonHours?: number
  ) => Promise<AGIPrediction | null>;
  reason: (query: string, context?: string, tier?: AGITier) => Promise<AGIReasoningResponse | null>;
  fetchStats: () => Promise<void>;
  clearPredictions: () => void;
}

export function useAGI(options: UseAGIOptions = {}): UseAGIReturn {
  const { defaultTier = 1 } = options;

  const [predictions, setPredictions] = useState<AGIPrediction[]>([]);
  const [stats, setStats] = useState<AGIStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (
    equipmentId: string,
    type: 'quality' | 'maintenance' | 'anomaly',
    horizonHours?: number
  ): Promise<AGIPrediction | null> => {
    setPredicting(true);
    setError(null);

    try {
      const response = await api.post<AGIPrediction>('/api/agi/prediction', {
        equipment_id: equipmentId,
        prediction_type: type,
        horizon_hours: horizonHours,
        include_factors: true,
      });

      if (response.success && response.data) {
        // Add to predictions list
        setPredictions((prev) => [response.data!, ...prev].slice(0, 50)); // Keep last 50
        return response.data;
      } else {
        setError(response.error?.message || '예측에 실패했습니다.');
        return null;
      }
    } catch {
      setError('예측에 실패했습니다.');
      return null;
    } finally {
      setPredicting(false);
    }
  }, []);

  const reason = useCallback(async (
    query: string,
    context?: string,
    tier?: AGITier
  ): Promise<AGIReasoningResponse | null> => {
    setReasoning(true);
    setError(null);

    try {
      const response = await api.post<AGIReasoningResponse>('/api/agi/reasoning', {
        query,
        context: context || '',
        tier: tier || defaultTier,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'AI 추론에 실패했습니다.');
        return null;
      }
    } catch {
      setError('AI 추론에 실패했습니다.');
      return null;
    } finally {
      setReasoning(false);
    }
  }, [defaultTier]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<AGIStatsResponse>('/api/agi/stats');

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error?.message || '통계를 불러오는데 실패했습니다.');
      }
    } catch {
      setError('통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  return {
    predictions,
    stats,
    loading,
    predicting,
    reasoning,
    error,
    predict,
    reason,
    fetchStats,
    clearPredictions,
  };
}

export default useAGI;
