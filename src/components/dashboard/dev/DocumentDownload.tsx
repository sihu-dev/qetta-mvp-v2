/**
 * DocumentDownload Component
 * 문서 다운로드 버튼 그룹
 */

'use client';

import { useState } from 'react';
import { useDocumentExport } from '@/lib/hooks';
import type { GeneratedProposal } from '@/lib/bizsupport/types/proposal-sections';
import type { ExportFormat } from '@/lib/hooks';
import { ProposalPreview } from './ProposalPreview';

// =============================================================================
// 타입 정의
// =============================================================================

interface DocumentDownloadProps {
  proposal: GeneratedProposal;
}

// =============================================================================
// 상수
// =============================================================================

const EXPORT_FORMATS: { format: ExportFormat; label: string; icon: string }[] = [
  { format: 'docx', label: 'DOCX', icon: 'M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { format: 'pdf', label: 'PDF', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { format: 'pptx', label: 'PPTX', icon: 'M8 13v-1m4 1v-3m4 3V8M12 21l9-9-9-9-9 9 9 9z' },
];

// =============================================================================
// 컴포넌트
// =============================================================================

export function DocumentDownload({ proposal }: DocumentDownloadProps) {
  const { state, exportProposal, downloadResult } = useDocumentExport();
  const [showPreview, setShowPreview] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    const result = await exportProposal(proposal, { format });
    if (result.success) {
      downloadResult(result);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-medium text-slate-900">문서 다운로드</h3>
        <p className="text-sm text-slate-500 mt-1">생성된 제안서를 원하는 형식으로 다운로드하세요.</p>
      </div>

      <div className="p-6">
        {/* 다운로드 버튼 그룹 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {EXPORT_FORMATS.map(({ format, label, icon }) => {
            const isExporting = state.isExporting && state.currentFormat === format;
            const result = state.results.find((r) => r.format === format);

            return (
              <button
                key={format}
                onClick={() => handleExport(format)}
                disabled={state.isExporting}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  isExporting
                    ? 'border-purple-500 bg-purple-50'
                    : result?.success
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* 아이콘 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isExporting
                    ? 'bg-purple-100 text-purple-600'
                    : result?.success
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isExporting ? (
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  ) : result?.success ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                  )}
                </div>

                {/* 라벨 */}
                <span className={`font-medium ${
                  result?.success ? 'text-green-700' : 'text-slate-700'
                }`}>
                  {label}
                </span>

                {/* 상태 텍스트 */}
                <span className="text-xs text-slate-500">
                  {isExporting
                    ? '생성 중...'
                    : result?.success
                    ? '다운로드 완료'
                    : '클릭하여 다운로드'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 미리보기 버튼 */}
        <button
          onClick={() => setShowPreview(true)}
          className="w-full py-3 border-2 border-slate-200 rounded-lg text-slate-600 font-medium
            hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          전체 미리보기
        </button>

        {/* 진행 상태 */}
        {state.isExporting && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-slate-600">생성 진행률</span>
              <span className="text-purple-600 font-medium">{state.progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 에러 표시 */}
        {state.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}
      </div>

      {/* 미리보기 모달 */}
      <ProposalPreview
        proposal={proposal}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}

export default DocumentDownload;
