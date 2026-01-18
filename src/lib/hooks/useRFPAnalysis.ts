/**
 * useRFPAnalysis Hook
 * 4-Layer RFP 분석 상태 관리
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  RFPAnalysisResult,
  RFPDocument,
  ClientType,
} from '@/lib/bizsupport/types';

// =============================================================================
// 타입 정의
// =============================================================================

export type AnalysisPhase = 'idle' | 'layer1' | 'layer2a' | 'layer2b' | 'layer3' | 'layer4' | 'complete' | 'error';

export interface LayerProgress {
  layer1: number;
  layer2a: number;
  layer2b: number;
  layer3: number;
  layer4: number;
}

export interface AnalysisState {
  phase: AnalysisPhase;
  progress: LayerProgress;
  result: RFPAnalysisResult | null;
  error: string | null;
  isAnalyzing: boolean;
}

export interface UseRFPAnalysisReturn {
  state: AnalysisState;
  analyze: (rfp: RFPDocument, clientType?: ClientType) => Promise<RFPAnalysisResult | null>;
  reset: () => void;
  getPhaseLabel: (phase: AnalysisPhase) => string;
}

// =============================================================================
// 초기 상태
// =============================================================================

const initialProgress: LayerProgress = {
  layer1: 0,
  layer2a: 0,
  layer2b: 0,
  layer3: 0,
  layer4: 0,
};

const initialState: AnalysisState = {
  phase: 'idle',
  progress: initialProgress,
  result: null,
  error: null,
  isAnalyzing: false,
};

// =============================================================================
// Phase 라벨
// =============================================================================

const PHASE_LABELS: Record<AnalysisPhase, string> = {
  idle: '대기 중',
  layer1: '메타데이터 추출 중...',
  layer2a: '키워드 분석 중...',
  layer2b: '유사 공고 검색 중...',
  layer3: '은닉 니즈 추론 중...',
  layer4: '전략 수립 중...',
  complete: '분석 완료',
  error: '분석 실패',
};

// =============================================================================
// Hook
// =============================================================================

export function useRFPAnalysis(): UseRFPAnalysisReturn {
  const [state, setState] = useState<AnalysisState>(initialState);

  /**
   * 분석 실행
   */
  const analyze = useCallback(async (
    rfp: RFPDocument,
    clientType?: ClientType
  ): Promise<RFPAnalysisResult | null> => {
    setState({
      ...initialState,
      phase: 'layer1',
      isAnalyzing: true,
    });

    try {
      // Phase A: Layer 1 + 2a (병렬)
      setState((prev) => ({
        ...prev,
        phase: 'layer1',
        progress: { ...prev.progress, layer1: 50 },
      }));

      const response = await fetch('/api/gov/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfpDocument: rfp,
          clientType: clientType || 'SME_MANUFACTURER',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      // 진행 상황 시뮬레이션 (실제로는 SSE/WebSocket으로 구현)
      setState((prev) => ({
        ...prev,
        phase: 'layer2a',
        progress: { ...prev.progress, layer1: 100, layer2a: 50 },
      }));

      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        phase: 'layer2b',
        progress: { ...prev.progress, layer2a: 100, layer2b: 50 },
      }));

      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        phase: 'layer3',
        progress: { ...prev.progress, layer2b: 100, layer3: 50 },
      }));

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setState((prev) => ({
        ...prev,
        phase: 'layer4',
        progress: { ...prev.progress, layer3: 100, layer4: 50 },
      }));

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      const result = data.data.analysis as RFPAnalysisResult;

      setState({
        phase: 'complete',
        progress: {
          layer1: 100,
          layer2a: 100,
          layer2b: 100,
          layer3: 100,
          layer4: 100,
        },
        result,
        error: null,
        isAnalyzing: false,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        phase: 'error',
        progress: initialProgress,
        result: null,
        error: errorMessage,
        isAnalyzing: false,
      });
      return null;
    }
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  /**
   * Phase 라벨 반환
   */
  const getPhaseLabel = useCallback((phase: AnalysisPhase): string => {
    return PHASE_LABELS[phase];
  }, []);

  return {
    state,
    analyze,
    reset,
    getPhaseLabel,
  };
}

export default useRFPAnalysis;
