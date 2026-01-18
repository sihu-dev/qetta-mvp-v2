/**
 * SectionCard Component
 * 접기/펼치기 Accordion 섹션 카드
 */

'use client';

import { useState } from 'react';
import type { ProposalSection, ProposalSectionType } from '@/lib/bizsupport/types/proposal-sections';
import type { SectionStatus } from '@/lib/hooks';
import { SectionRegenerate } from './SectionRegenerate';

// =============================================================================
// 타입 정의
// =============================================================================

interface SectionCardProps {
  sectionNumber: number;
  sectionType: ProposalSectionType;
  content: ProposalSection | null;
  status: SectionStatus;
  isExpanded: boolean;
  onToggle: () => void;
  onRegenerate: (feedback?: string) => Promise<void>;
}

// =============================================================================
// 상수
// =============================================================================

const SECTION_TITLES: Record<ProposalSectionType, string> = {
  UNDERSTANDING: '이해도',
  SOLUTION: '솔루션 개요',
  TECHNICAL: '기술 상세',
  EXECUTION_PLAN: '수행 계획',
  TEAM: '수행 조직',
  EXPERIENCE: '유사 실적',
  COST_ROI: '비용/ROI',
};

const SECTION_TARGETS: Record<ProposalSectionType, string> = {
  UNDERSTANDING: '심사위원단',
  SOLUTION: '기술심사관',
  TECHNICAL: '기술심사관',
  EXECUTION_PLAN: '사업담당관',
  TEAM: '계약담당관',
  EXPERIENCE: '결재권자',
  COST_ROI: '예산심의관',
};

// =============================================================================
// 컴포넌트
// =============================================================================

export function SectionCard({
  sectionNumber,
  sectionType,
  content,
  status,
  isExpanded,
  onToggle,
  onRegenerate,
}: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const handleEdit = () => {
    if (content) {
      setEditedContent(content.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    // TODO: 로컬 수정 저장 로직
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* 헤더 (클릭하여 펼치기/접기) */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* 섹션 번호 */}
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            status === 'complete'
              ? 'bg-green-100 text-green-700'
              : status === 'generating'
              ? 'bg-purple-100 text-purple-700'
              : status === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {sectionNumber}
          </span>

          {/* 섹션 제목 */}
          <div className="text-left">
            <div className="font-medium text-slate-900">
              {SECTION_TITLES[sectionType]}
              {sectionType === 'UNDERSTANDING' && (
                <span className="ml-2 text-xs text-purple-600 font-normal">★ 차별화</span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              타겟: {SECTION_TARGETS[sectionType]}
            </div>
          </div>
        </div>

        {/* 상태 및 펼치기 아이콘 */}
        <div className="flex items-center gap-3">
          {status === 'generating' && (
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'complete' && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 펼쳐진 내용 */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-slate-100">
          {/* 로딩 상태 */}
          {status === 'generating' && (
            <div className="py-8 text-center">
              <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500">섹션 생성 중...</p>
            </div>
          )}

          {/* 내용 표시 */}
          {content && status !== 'generating' && (
            <div className="pt-4 space-y-4">
              {/* 제목 */}
              <h4 className="text-lg font-medium text-slate-900">{content.title}</h4>

              {/* 본문 */}
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-64 rounded-lg border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                />
              ) : (
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap">{content.content}</p>
                </div>
              )}

              {/* 핵심 포인트 */}
              {content.keyPoints && content.keyPoints.length > 0 && !isEditing && (
                <div className="pt-4 border-t border-slate-100">
                  <h5 className="text-sm font-medium text-slate-700 mb-2">핵심 포인트</h5>
                  <ul className="space-y-1">
                    {content.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-purple-500">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-slate-600 text-sm hover:text-slate-800"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="px-3 py-1.5 text-slate-600 text-sm hover:text-slate-800"
                    >
                      수동 편집
                    </button>
                  )}
                </div>

                {!isEditing && (
                  <SectionRegenerate
                    sectionType={sectionType}
                    onRegenerate={onRegenerate}
                    isRegenerating={(status as string) === 'generating'}
                  />
                )}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!content && status !== 'generating' && (
            <div className="py-8 text-center">
              <p className="text-slate-400">아직 생성되지 않은 섹션입니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SectionCard;
