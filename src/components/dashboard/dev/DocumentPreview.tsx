/**
 * DocumentPreview Component
 * 문서 미리보기 (iframe 또는 렌더링)
 */

'use client';

import { useState } from 'react';
import type { ExportFormat } from '@/lib/hooks';

// =============================================================================
// 타입 정의
// =============================================================================

interface DocumentPreviewProps {
  url?: string;
  format: ExportFormat;
  title: string;
}

// =============================================================================
// 컴포넌트
// =============================================================================

export function DocumentPreview({ url, format, title }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('문서를 미리보기할 수 없습니다.');
  };

  // PDF만 iframe으로 미리보기 가능
  const canPreview = format === 'pdf' && url;

  if (!canPreview) {
    return (
      <div className="rounded-xl bg-slate-50 p-8 text-center">
        <svg
          className="w-12 h-12 text-slate-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h4 className="font-medium text-slate-700 mb-1">{title}</h4>
        <p className="text-sm text-slate-500">
          {format.toUpperCase()} 형식은 미리보기를 지원하지 않습니다.
        </p>
        {url && (
          <a
            href={url}
            download
            className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            다운로드
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>
        <a
          href={url}
          download
          className="text-sm text-purple-600 hover:text-purple-800"
        >
          다운로드
        </a>
      </div>

      {/* 미리보기 영역 */}
      <div className="relative" style={{ height: '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">로딩 중...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-slate-500">{error}</p>
            </div>
          </div>
        )}

        <iframe
          src={url}
          className="w-full h-full"
          onLoad={handleLoad}
          onError={handleError}
          title={title}
        />
      </div>
    </div>
  );
}

export default DocumentPreview;
