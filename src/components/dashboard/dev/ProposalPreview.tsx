/**
 * ProposalPreview Component
 * 전체 제안서 미리보기
 */

'use client';

import { useState } from 'react';
import type { GeneratedProposal, ProposalSection } from '@/lib/bizsupport/types/proposal-sections';

// =============================================================================
// 타입 정의
// =============================================================================

interface ProposalPreviewProps {
  proposal: GeneratedProposal;
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// 상수
// =============================================================================

const SECTION_LABELS: Record<string, string> = {
  UNDERSTANDING: '1. 이해도',
  SOLUTION: '2. 솔루션 개요',
  TECHNICAL: '3. 기술 상세',
  EXECUTION_PLAN: '4. 수행 계획',
  TEAM: '5. 수행 조직',
  EXPERIENCE: '6. 유사 실적',
  COST_ROI: '7. 비용/ROI',
};

// =============================================================================
// 컴포넌트
// =============================================================================

export function ProposalPreview({ proposal, isOpen, onClose }: ProposalPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const sortedSections = [...proposal.sections].sort((a, b) => {
    const order = ['UNDERSTANDING', 'SOLUTION', 'TECHNICAL', 'EXECUTION_PLAN', 'TEAM', 'EXPERIENCE', 'COST_ROI'];
    return order.indexOf(a.sectionType) - order.indexOf(b.sectionType);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">제안서 미리보기</h2>
            <p className="text-sm text-slate-500">{proposal.rfpTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 페이지 네비게이션 */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setCurrentPage(0)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${
                currentPage === 0
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              표지
            </button>
            {sortedSections.map((section, idx) => (
              <button
                key={section.sectionType}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${
                  currentPage === idx + 1
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {SECTION_LABELS[section.sectionType]}
              </button>
            ))}
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentPage === 0 ? (
            // 표지
            <div className="text-center py-12">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">제안서</h1>
                <p className="text-xl text-slate-600">{proposal.rfpTitle}</p>
              </div>

              <div className="py-12">
                <p className="text-lg text-purple-600 font-medium">{proposal.company.name}</p>
                <p className="text-slate-500 mt-1">대표: {proposal.company.representative}</p>
              </div>

              <div className="text-slate-400 text-sm">
                {new Date(proposal.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              <div className="mt-12 pt-12 border-t border-slate-200">
                <p className="text-sm text-slate-400">
                  Data Flows. Evidence Follows.
                </p>
                <p className="text-xs text-slate-300 mt-2">
                  Qetta. inevitable.
                </p>
              </div>
            </div>
          ) : (
            // 섹션 내용
            <div className="prose prose-slate max-w-none">
              {sortedSections[currentPage - 1] && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {sortedSections[currentPage - 1].title}
                  </h2>
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {sortedSections[currentPage - 1].content}
                  </div>

                  {/* 핵심 포인트 */}
                  {sortedSections[currentPage - 1].keyPoints && sortedSections[currentPage - 1].keyPoints.length > 0 && (
                    <div className="mt-8 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">핵심 포인트</h4>
                      <ul className="space-y-1">
                        {sortedSections[currentPage - 1].keyPoints.map((point, idx) => (
                          <li key={idx} className="text-purple-700 text-sm">• {point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            페이지 {currentPage + 1} / {sortedSections.length + 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(sortedSections.length, prev + 1))}
              disabled={currentPage === sortedSections.length}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProposalPreview;
