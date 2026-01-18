/**
 * useAnalysisProgress Hook
 * Layer별 진행 상태 관리 (Polling 방식)
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// =============================================================================
// 타입 정의
// =============================================================================

export type LayerName = 'layer1' | 'layer2a' | 'layer2b' | 'layer3' | 'layer4';

export interface LayerStatus {
  name: LayerName;
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
}

export interface AnalysisProgressState {
  analysisId: string | null;
  layers: LayerStatus[];
  overallProgress: number;
  isActive: boolean;
  isComplete: boolean;
  error: string | null;
}

export interface UseAnalysisProgressReturn {
  state: AnalysisProgressState;
  startTracking: (analysisId: string) => void;
  stopTracking: () => void;
  updateLayer: (name: LayerName, status: Partial<LayerStatus>) => void;
  reset: () => void;
}

// =============================================================================
// 상수
// =============================================================================

const LAYER_LABELS: Record<LayerName, string> = {
  layer1: '메타데이터 추출',
  layer2a: '키워드 분석',
  layer2b: '유사 공고 검색',
  layer3: '은닉 니즈 추론',
  layer4: '전략 수립',
};

const LAYER_ORDER: LayerName[] = ['layer1', 'layer2a', 'layer2b', 'layer3', 'layer4'];

// =============================================================================
// 초기 상태
// =============================================================================

const createInitialLayers = (): LayerStatus[] =>
  LAYER_ORDER.map((name) => ({
    name,
    label: LAYER_LABELS[name],
    status: 'pending',
    progress: 0,
  }));

const initialState: AnalysisProgressState = {
  analysisId: null,
  layers: createInitialLayers(),
  overallProgress: 0,
  isActive: false,
  isComplete: false,
  error: null,
};

// =============================================================================
// Hook
// =============================================================================

export function useAnalysisProgress(pollingInterval: number = 1000): UseAnalysisProgressReturn {
  const [state, setState] = useState<AnalysisProgressState>(initialState);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 전체 진행률 계산
   */
  const calculateOverallProgress = useCallback((layers: LayerStatus[]): number => {
    const weights = { layer1: 0.15, layer2a: 0.15, layer2b: 0.2, layer3: 0.35, layer4: 0.15 };
    return layers.reduce((total, layer) => {
      return total + (layer.progress * weights[layer.name]);
    }, 0);
  }, []);

  /**
   * 진행 상태 폴링
   */
  const pollProgress = useCallback(async (analysisId: string) => {
    try {
      // TODO: 실제 API 엔드포인트로 교체
      // const response = await fetch(`/api/gov/analyze/progress/${analysisId}`);
      // const data = await response.json();

      // 시뮬레이션: 실제 구현 시 API 응답 사용
      setState((prev) => {
        const updatedLayers = prev.layers.map((layer, index) => {
          // 이전 레이어가 완료되어야 다음 레이어 시작
          const prevLayerComplete = index === 0 || prev.layers[index - 1].status === 'complete';

          if (layer.status === 'complete') return layer;

          if (prevLayerComplete && layer.status === 'pending') {
            return {
              ...layer,
              status: 'running' as const,
              progress: 10,
              startedAt: new Date().toISOString(),
            };
          }

          if (layer.status === 'running') {
            const newProgress = Math.min(layer.progress + 20, 100);
            if (newProgress >= 100) {
              return {
                ...layer,
                status: 'complete' as const,
                progress: 100,
                completedAt: new Date().toISOString(),
                duration: Date.now() - new Date(layer.startedAt!).getTime(),
              };
            }
            return { ...layer, progress: newProgress };
          }

          return layer;
        });

        const overallProgress = calculateOverallProgress(updatedLayers);
        const isComplete = updatedLayers.every((l) => l.status === 'complete');

        return {
          ...prev,
          layers: updatedLayers,
          overallProgress,
          isComplete,
          isActive: !isComplete,
        };
      });
    } catch (error) {
      console.error('[Progress] Polling error:', error);
    }
  }, [calculateOverallProgress]);

  /**
   * 추적 시작
   */
  const startTracking = useCallback((analysisId: string) => {
    // 기존 폴링 중지
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setState({
      analysisId,
      layers: createInitialLayers(),
      overallProgress: 0,
      isActive: true,
      isComplete: false,
      error: null,
    });

    // 폴링 시작
    pollingRef.current = setInterval(() => {
      pollProgress(analysisId);
    }, pollingInterval);

    // 즉시 첫 번째 폴링 실행
    pollProgress(analysisId);
  }, [pollingInterval, pollProgress]);

  /**
   * 추적 중지
   */
  const stopTracking = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  /**
   * 특정 레이어 상태 수동 업데이트
   */
  const updateLayer = useCallback((name: LayerName, status: Partial<LayerStatus>) => {
    setState((prev) => {
      const updatedLayers = prev.layers.map((layer) =>
        layer.name === name ? { ...layer, ...status } : layer
      );

      return {
        ...prev,
        layers: updatedLayers,
        overallProgress: calculateOverallProgress(updatedLayers),
        isComplete: updatedLayers.every((l) => l.status === 'complete'),
      };
    });
  }, [calculateOverallProgress]);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    stopTracking();
    setState(initialState);
  }, [stopTracking]);

  // 완료 시 폴링 자동 중지
  useEffect(() => {
    if (state.isComplete && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [state.isComplete]);

  // 클린업
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    state,
    startTracking,
    stopTracking,
    updateLayer,
    reset,
  };
}

export default useAnalysisProgress;
