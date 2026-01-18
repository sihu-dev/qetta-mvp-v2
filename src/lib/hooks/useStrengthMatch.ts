/**
 * useStrengthMatch Hook
 * Needs-Strength 매칭 결과 관리
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  RFPAnalysisResult,
  MatchResult,
  StrengthMatch,
  ClientType,
} from '@/lib/bizsupport/types';
import { QETTA_STRENGTHS } from '@/lib/bizsupport/data/qetta-strengths';

// =============================================================================
// 타입 정의
// =============================================================================

export interface MatchState {
  isMatching: boolean;
  result: MatchResult | null;
  selectedStrengths: string[];
  error: string | null;
}

export interface UseStrengthMatchReturn {
  state: MatchState;
  match: (
    analysis: RFPAnalysisResult,
    clientType?: ClientType
  ) => Promise<MatchResult | null>;
  toggleStrength: (strengthId: string) => void;
  setSelectedStrengths: (ids: string[]) => void;
  getStrengthById: (id: string) => typeof QETTA_STRENGTHS[0] | undefined;
  getMatchedStrengths: () => StrengthMatch[];
  getTopStrengths: (count?: number) => StrengthMatch[];
  reset: () => void;
}

// =============================================================================
// 초기 상태
// =============================================================================

const initialState: MatchState = {
  isMatching: false,
  result: null,
  selectedStrengths: [],
  error: null,
};

// =============================================================================
// Hook
// =============================================================================

export function useStrengthMatch(): UseStrengthMatchReturn {
  const [state, setState] = useState<MatchState>(initialState);

  /**
   * 매칭 실행
   */
  const match = useCallback(async (
    analysis: RFPAnalysisResult,
    clientType?: ClientType
  ): Promise<MatchResult | null> => {
    setState((prev) => ({
      ...prev,
      isMatching: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/gov/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult: analysis,
          clientType: clientType || 'SME_MANUFACTURER',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Matching failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Matching failed');
      }

      const result = data.data.matchResult as MatchResult;

      // 상위 4개 강점 자동 선택
      const topStrengthIds = result.matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((m) => m.strengthId);

      setState({
        isMatching: false,
        result,
        selectedStrengths: topStrengthIds,
        error: null,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isMatching: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  /**
   * 강점 선택 토글 (최대 4개)
   */
  const toggleStrength = useCallback((strengthId: string): void => {
    setState((prev) => {
      const isSelected = prev.selectedStrengths.includes(strengthId);

      if (isSelected) {
        // 선택 해제
        return {
          ...prev,
          selectedStrengths: prev.selectedStrengths.filter((id) => id !== strengthId),
        };
      } else {
        // 선택 추가 (최대 4개)
        if (prev.selectedStrengths.length >= 4) {
          return prev; // 이미 4개 선택됨
        }
        return {
          ...prev,
          selectedStrengths: [...prev.selectedStrengths, strengthId],
        };
      }
    });
  }, []);

  /**
   * 선택된 강점 직접 설정
   */
  const setSelectedStrengths = useCallback((ids: string[]): void => {
    setState((prev) => ({
      ...prev,
      selectedStrengths: ids.slice(0, 4), // 최대 4개
    }));
  }, []);

  /**
   * ID로 강점 정보 조회
   */
  const getStrengthById = useCallback((id: string) => {
    return QETTA_STRENGTHS.find((s) => s.id === id);
  }, []);

  /**
   * 매칭된 강점 목록 반환
   */
  const getMatchedStrengths = useCallback((): StrengthMatch[] => {
    if (!state.result) return [];
    return state.result.matches;
  }, [state.result]);

  /**
   * 상위 N개 강점 반환
   */
  const getTopStrengths = useCallback((count: number = 4): StrengthMatch[] => {
    if (!state.result) return [];
    return state.result.matches
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }, [state.result]);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    match,
    toggleStrength,
    setSelectedStrengths,
    getStrengthById,
    getMatchedStrengths,
    getTopStrengths,
    reset,
  };
}

export default useStrengthMatch;
