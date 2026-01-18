/**
 * useGovPrograms Hook
 * 정부지원사업 목록 관리
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { GovProgram, ProgramSource } from '@/lib/bizsupport/types';

// =============================================================================
// 타입 정의
// =============================================================================

export interface ProgramFilters {
  source?: ProgramSource;
  status?: 'open' | 'closed' | 'upcoming';
  minAmount?: number;
  maxAmount?: number;
  keyword?: string;
}

export interface ProgramsState {
  programs: GovProgram[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UseGovProgramsReturn {
  state: ProgramsState;
  refresh: (source?: ProgramSource) => Promise<void>;
  refreshAll: () => Promise<void>;
  filter: (filters: ProgramFilters) => GovProgram[];
  getBySource: (source: ProgramSource) => GovProgram[];
  getOpenPrograms: () => GovProgram[];
  searchByKeyword: (keyword: string) => GovProgram[];
}

// =============================================================================
// 초기 상태
// =============================================================================

const initialState: ProgramsState = {
  programs: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// =============================================================================
// Hook
// =============================================================================

export function useGovPrograms(autoFetch: boolean = false): UseGovProgramsReturn {
  const [state, setState] = useState<ProgramsState>(initialState);

  /**
   * 특정 소스에서 프로그램 가져오기
   */
  const refresh = useCallback(async (source?: ProgramSource): Promise<void> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const endpoints: { source: ProgramSource; url: string }[] = source
        ? [{ source, url: `/api/gov/${source}` }]
        : [
            { source: 'kstartup', url: '/api/gov/kstartup' },
            { source: 'bizinfo', url: '/api/gov/bizinfo' },
          ];

      const results = await Promise.allSettled(
        endpoints.map(async ({ source: src, url }) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${src}`);
          }
          const data = await response.json();
          return {
            source: src,
            programs: data.data?.programs || [],
          };
        })
      );

      const allPrograms: GovProgram[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allPrograms.push(...result.value.programs);
        } else {
          errors.push(endpoints[index].source);
        }
      });

      setState((prev) => {
        // 기존 프로그램과 병합 (중복 제거)
        const existingIds = new Set(allPrograms.map((p) => p.id));
        const filteredExisting = source
          ? prev.programs.filter((p) => p.source !== source && !existingIds.has(p.id))
          : [];

        return {
          programs: [...filteredExisting, ...allPrograms],
          isLoading: false,
          error: errors.length > 0 ? `Failed to fetch: ${errors.join(', ')}` : null,
          lastUpdated: new Date().toISOString(),
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * 모든 소스에서 프로그램 새로고침
   */
  const refreshAll = useCallback(async (): Promise<void> => {
    await refresh();
  }, [refresh]);

  /**
   * 필터 적용
   */
  const filter = useCallback((filters: ProgramFilters): GovProgram[] => {
    return state.programs.filter((program) => {
      // 소스 필터
      if (filters.source && program.source !== filters.source) {
        return false;
      }

      // 상태 필터
      if (filters.status) {
        const now = new Date();
        const deadline = program.deadline ? new Date(program.deadline) : null;

        switch (filters.status) {
          case 'open':
            if (deadline && deadline < now) return false;
            break;
          case 'closed':
            if (!deadline || deadline >= now) return false;
            break;
          case 'upcoming':
            // upcoming 로직은 startDate 필요 (현재 타입에 없으므로 생략)
            break;
        }
      }

      // 금액 필터
      if (filters.minAmount && program.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount && program.amount > filters.maxAmount) {
        return false;
      }

      // 키워드 필터
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const searchText = `${program.title} ${program.description || ''} ${program.organization || ''}`.toLowerCase();
        if (!searchText.includes(keyword)) {
          return false;
        }
      }

      return true;
    });
  }, [state.programs]);

  /**
   * 소스별 프로그램 조회
   */
  const getBySource = useCallback((source: ProgramSource): GovProgram[] => {
    return state.programs.filter((p) => p.source === source);
  }, [state.programs]);

  /**
   * 진행 중인 프로그램 조회
   */
  const getOpenPrograms = useCallback((): GovProgram[] => {
    const now = new Date();
    return state.programs.filter((program) => {
      if (!program.deadline) return true;
      return new Date(program.deadline) >= now;
    });
  }, [state.programs]);

  /**
   * 키워드 검색
   */
  const searchByKeyword = useCallback((keyword: string): GovProgram[] => {
    if (!keyword.trim()) return state.programs;

    const lowerKeyword = keyword.toLowerCase();
    return state.programs.filter((program) => {
      const searchText = `${program.title} ${program.description || ''} ${program.organization || ''} ${program.category || ''}`.toLowerCase();
      return searchText.includes(lowerKeyword);
    });
  }, [state.programs]);

  // 자동 fetch (옵션)
  useEffect(() => {
    if (autoFetch) {
      refreshAll();
    }
  }, [autoFetch, refreshAll]);

  return {
    state,
    refresh,
    refreshAll,
    filter,
    getBySource,
    getOpenPrograms,
    searchByKeyword,
  };
}

export default useGovPrograms;
