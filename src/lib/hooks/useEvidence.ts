'use client';

/**
 * Evidence Data Hook
 * Manages evidence records and verification
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api/client';
import type {
  EvidenceRecord,
  EvidenceListResponse,
  EvidenceVerifyResponse,
  ListParams,
} from '@/lib/api/types';

interface UseEvidenceOptions {
  autoFetch?: boolean;
  initialParams?: ListParams;
}

interface UseEvidenceReturn {
  records: EvidenceRecord[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  fetchRecords: (params?: ListParams) => Promise<void>;
  verifyRecord: (recordId: string) => Promise<EvidenceVerifyResponse | null>;
  downloadPackage: (packageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEvidence(options: UseEvidenceOptions = {}): UseEvidenceReturn {
  const { autoFetch = true, initialParams = {} } = options;

  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || 10);

  const fetchRecords = useCallback(async (params: ListParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<EvidenceListResponse>('/api/evidence', {
        page: params.page || page,
        pageSize: params.pageSize || pageSize,
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      if (response.success && response.data) {
        setRecords(response.data.records);
        setTotal(response.data.total);
        setPage(response.data.page);
        setPageSize(response.data.pageSize);
      } else {
        setError(response.error?.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const verifyRecord = useCallback(async (recordId: string): Promise<EvidenceVerifyResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<EvidenceVerifyResponse>(`/api/evidence/verify`, {
        recordId,
      });

      if (response.success && response.data) {
        // Update the record status in the local state
        setRecords((prev) =>
          prev.map((r) =>
            r.id === recordId
              ? { ...r, status: response.data!.valid ? 'verified' : 'failed' }
              : r
          )
        );
        return response.data;
      } else {
        setError(response.error?.message || '검증에 실패했습니다.');
        return null;
      }
    } catch {
      setError('검증에 실패했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPackage = useCallback(async (packageId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get download URL from API
      const response = await api.get<{ downloadUrl: string }>(`/api/evidence/download/${packageId}`);

      if (response.success && response.data?.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `evidence-${packageId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError(response.error?.message || '다운로드 URL을 가져오는데 실패했습니다.');
      }
    } catch {
      setError('다운로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchRecords({ page, pageSize });
  }, [fetchRecords, page, pageSize]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchRecords(initialParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    records,
    total,
    loading,
    error,
    page,
    pageSize,
    fetchRecords,
    verifyRecord,
    downloadPackage,
    refresh,
  };
}

export default useEvidence;
