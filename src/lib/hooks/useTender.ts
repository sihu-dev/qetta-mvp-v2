'use client';

/**
 * Tender Data Hook
 * Manages tender records, collection, and analysis
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api/client';
import type {
  TenderRecord,
  TenderAnalysis,
  TenderListResponse,
  TenderSource,
  TenderCollectResponse,
  ListParams,
} from '@/lib/api/types';

interface UseTenderOptions {
  autoFetch?: boolean;
  initialParams?: ListParams & {
    source?: TenderSource;
  };
}

interface UseTenderReturn {
  tenders: TenderRecord[];
  total: number;
  loading: boolean;
  collecting: boolean;
  analyzing: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  fetchTenders: (params?: ListParams & { source?: TenderSource }) => Promise<void>;
  collectTenders: (sources: TenderSource[], keywords?: string[]) => Promise<TenderCollectResponse | null>;
  analyzeTender: (tenderId: string) => Promise<TenderAnalysis | null>;
  getTenderById: (tenderId: string) => Promise<TenderRecord | null>;
  refresh: () => Promise<void>;
}

export function useTender(options: UseTenderOptions = {}): UseTenderReturn {
  const { autoFetch = true, initialParams = {} } = options;

  const [tenders, setTenders] = useState<TenderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || 10);

  const fetchTenders = useCallback(async (params: ListParams & { source?: TenderSource } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<TenderListResponse>('/api/tender', {
        page: params.page || page,
        pageSize: params.pageSize || pageSize,
        search: params.search,
        status: params.status,
        source: params.source,
        sortBy: params.sortBy || 'deadline',
        sortOrder: params.sortOrder || 'asc',
      });

      if (response.success && response.data) {
        setTenders(response.data.tenders);
        setTotal(response.data.total);
        setPage(response.data.page);
        setPageSize(response.data.pageSize);
      } else {
        setError(response.error?.message || '입찰 목록을 불러오는데 실패했습니다.');
      }
    } catch {
      setError('입찰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const collectTenders = useCallback(async (
    sources: TenderSource[],
    keywords?: string[]
  ): Promise<TenderCollectResponse | null> => {
    setCollecting(true);
    setError(null);

    try {
      const response = await api.post<TenderCollectResponse>('/api/tender/collect', {
        sources,
        keywords,
      });

      if (response.success && response.data) {
        // Refresh the list after collection
        await fetchTenders();
        return response.data;
      } else {
        setError(response.error?.message || '입찰 수집에 실패했습니다.');
        return null;
      }
    } catch {
      setError('입찰 수집에 실패했습니다.');
      return null;
    } finally {
      setCollecting(false);
    }
  }, [fetchTenders]);

  const analyzeTender = useCallback(async (tenderId: string): Promise<TenderAnalysis | null> => {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await api.post<TenderAnalysis>('/api/tender/analyze', {
        tenderId,
      });

      if (response.success && response.data) {
        // Update the tender in the local state with the analysis results
        setTenders((prev) =>
          prev.map((t) =>
            t.id === tenderId
              ? {
                  ...t,
                  fit_score: response.data!.fit_score,
                  fit_grade: response.data!.fit_grade,
                }
              : t
          )
        );
        return response.data;
      } else {
        setError(response.error?.message || '입찰 분석에 실패했습니다.');
        return null;
      }
    } catch {
      setError('입찰 분석에 실패했습니다.');
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const getTenderById = useCallback(async (tenderId: string): Promise<TenderRecord | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<TenderRecord>(`/api/tender/${tenderId}`);

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || '입찰 정보를 불러오는데 실패했습니다.');
        return null;
      }
    } catch {
      setError('입찰 정보를 불러오는데 실패했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchTenders({ page, pageSize });
  }, [fetchTenders, page, pageSize]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchTenders(initialParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    tenders,
    total,
    loading,
    collecting,
    analyzing,
    error,
    page,
    pageSize,
    fetchTenders,
    collectTenders,
    analyzeTender,
    getTenderById,
    refresh,
  };
}

export default useTender;
