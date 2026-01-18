/**
 * useDocumentExport Hook
 * DOCX/PDF/XLSX/PPTX 내보내기
 */

'use client';

import { useState, useCallback } from 'react';
import type { GeneratedProposal } from '@/lib/bizsupport/types/proposal-sections';

// =============================================================================
// 타입 정의
// =============================================================================

export type ExportFormat = 'docx' | 'pdf' | 'xlsx' | 'pptx';

export interface ExportOptions {
  format: ExportFormat;
  orgId?: string;
  includeAppendix?: boolean;
  watermark?: boolean;
  password?: string;
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  url?: string;
  buffer?: ArrayBuffer;
  error?: string;
}

export interface ExportState {
  isExporting: boolean;
  currentFormat: ExportFormat | null;
  progress: number;
  results: ExportResult[];
  error: string | null;
}

export interface UseDocumentExportReturn {
  state: ExportState;
  exportProposal: (
    proposal: GeneratedProposal,
    options: ExportOptions
  ) => Promise<ExportResult>;
  exportMultiple: (
    proposal: GeneratedProposal,
    formats: ExportFormat[]
  ) => Promise<ExportResult[]>;
  downloadResult: (result: ExportResult) => void;
  reset: () => void;
}

// =============================================================================
// 초기 상태
// =============================================================================

const initialState: ExportState = {
  isExporting: false,
  currentFormat: null,
  progress: 0,
  results: [],
  error: null,
};

// =============================================================================
// 헬퍼 함수
// =============================================================================

function generateFilename(proposal: GeneratedProposal, format: ExportFormat): string {
  const date = new Date().toISOString().split('T')[0];
  const title = proposal.rfpTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_').slice(0, 30);
  return `${title}_제안서_${date}.${format}`;
}

// =============================================================================
// Hook
// =============================================================================

export function useDocumentExport(): UseDocumentExportReturn {
  const [state, setState] = useState<ExportState>(initialState);

  /**
   * 단일 형식 내보내기
   */
  const exportProposal = useCallback(async (
    proposal: GeneratedProposal,
    options: ExportOptions
  ): Promise<ExportResult> => {
    setState((prev) => ({
      ...prev,
      isExporting: true,
      currentFormat: options.format,
      progress: 0,
      error: null,
    }));

    try {
      // 진행 상황 시뮬레이션
      setState((prev) => ({ ...prev, progress: 30 }));

      const response = await fetch('/api/tender/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoGenerate: false,
          docType: 'proposal',
          format: options.format,
          orgId: options.orgId || 'demo-org',
          data: {
            title: proposal.rfpTitle,
            company: proposal.company,
            sections: proposal.sections.map((s) => ({
              title: s.title,
              content: s.content,
              bullets: s.keyPoints,
            })),
          },
          returnBuffer: true,
        }),
      });

      setState((prev) => ({ ...prev, progress: 70 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Export failed');
      }

      setState((prev) => ({ ...prev, progress: 100 }));

      const result: ExportResult = {
        success: true,
        format: options.format,
        filename: generateFilename(proposal, options.format),
        url: data.documents?.proposal?.filePath,
      };

      // Buffer가 있으면 Blob URL 생성
      if (data.buffers?.proposal) {
        const buffer = Uint8Array.from(atob(data.buffers.proposal), (c) => c.charCodeAt(0));
        const mimeTypes: Record<ExportFormat, string> = {
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          pdf: 'application/pdf',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };
        const blob = new Blob([buffer], { type: mimeTypes[options.format] });
        result.url = URL.createObjectURL(blob);
      }

      setState((prev) => ({
        ...prev,
        isExporting: false,
        currentFormat: null,
        results: [...prev.results, result],
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: ExportResult = {
        success: false,
        format: options.format,
        filename: generateFilename(proposal, options.format),
        error: errorMessage,
      };

      setState((prev) => ({
        ...prev,
        isExporting: false,
        currentFormat: null,
        error: errorMessage,
        results: [...prev.results, result],
      }));

      return result;
    }
  }, []);

  /**
   * 여러 형식 동시 내보내기
   */
  const exportMultiple = useCallback(async (
    proposal: GeneratedProposal,
    formats: ExportFormat[]
  ): Promise<ExportResult[]> => {
    const results: ExportResult[] = [];

    for (const format of formats) {
      const result = await exportProposal(proposal, { format });
      results.push(result);
    }

    return results;
  }, [exportProposal]);

  /**
   * 결과 다운로드
   */
  const downloadResult = useCallback((result: ExportResult): void => {
    if (!result.url) return;

    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    // Blob URL 해제
    state.results.forEach((result) => {
      if (result.url?.startsWith('blob:')) {
        URL.revokeObjectURL(result.url);
      }
    });

    setState(initialState);
  }, [state.results]);

  return {
    state,
    exportProposal,
    exportMultiple,
    downloadResult,
    reset,
  };
}

export default useDocumentExport;
