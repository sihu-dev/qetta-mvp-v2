/**
 * SectionRegenerate Component
 * 섹션별 재생성 버튼
 */

'use client';

import { useState } from 'react';
import type { ProposalSectionType } from '@/lib/bizsupport/types/proposal-sections';

// =============================================================================
// 타입 정의
// =============================================================================

interface SectionRegenerateProps {
  sectionType: ProposalSectionType;
  onRegenerate: (feedback?: string) => Promise<void>;
  isRegenerating?: boolean;
}

// =============================================================================
// 컴포넌트
// =============================================================================

export function SectionRegenerate({
  onRegenerate,
  isRegenerating = false,
}: SectionRegenerateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleRegenerate = async () => {
    await onRegenerate(feedback || undefined);
    setIsOpen(false);
    setFeedback('');
  };

  const handleQuickRegenerate = async () => {
    await onRegenerate();
  };

  return (
    <div className="relative">
      {/* 버튼 그룹 */}
      <div className="flex items-center gap-2">
        {/* 빠른 재생성 */}
        <button
          onClick={handleQuickRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-800
            hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          재생성
        </button>

        {/* 피드백 포함 재생성 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isRegenerating}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="피드백과 함께 재생성"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>

      {/* 피드백 입력 팝오버 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 p-4 z-10">
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              개선 요청사항
            </label>
            <p className="text-xs text-slate-500 mb-2">
              AI에게 전달할 피드백을 입력하세요.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="예: 더 구체적인 수치를 포함해주세요..."
              className="w-full h-24 text-sm rounded-lg border-slate-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* 빠른 선택 버튼 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {['더 간결하게', '더 구체적으로', '수치 추가', '톤 조절'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setFeedback((prev) => prev ? `${prev}, ${suggestion}` : suggestion)}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
            >
              취소
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? '재생성 중...' : '피드백 적용하여 재생성'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionRegenerate;
