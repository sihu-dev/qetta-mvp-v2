/**
 * ProposalAIEditor Component
 * 7섹션 제안서 에디터 메인
 */

'use client';

import { useState } from 'react';
import { useProposalSections } from '@/lib/hooks';
import { SectionCard } from './SectionCard';
import { DocumentDownload } from './DocumentDownload';
import type {
  RFPAnalysisResult,
  MatchResult,
  CompanyProfile,
} from '@/lib/bizsupport/types';
import type { ProposalSectionType } from '@/lib/bizsupport/types/proposal-sections';

// =============================================================================
// 타입 정의
// =============================================================================

interface ProposalAIEditorProps {
  analysisResult: RFPAnalysisResult;
  matchResult: MatchResult;
  companyProfile?: CompanyProfile;
  onGenerate?: () => void;
}

// =============================================================================
// 상수
// =============================================================================

const SECTION_ORDER: { type: ProposalSectionType; number: number }[] = [
  { type: 'UNDERSTANDING', number: 1 },
  { type: 'SOLUTION', number: 2 },
  { type: 'TECHNICAL', number: 3 },
  { type: 'EXECUTION_PLAN', number: 4 },
  { type: 'TEAM', number: 5 },
  { type: 'EXPERIENCE', number: 6 },
  { type: 'COST_ROI', number: 7 },
];

// =============================================================================
// 컴포넌트
// =============================================================================

export function ProposalAIEditor({
  analysisResult,
  matchResult,
  companyProfile,
  onGenerate,
}: ProposalAIEditorProps) {
  const { state, generateAll, regenerateSection, getSectionStatus } = useProposalSections();
  const [expandedSections, setExpandedSections] = useState<Set<ProposalSectionType>>(new Set(['UNDERSTANDING']));

  const handleGenerateAll = async () => {
    await generateAll(analysisResult, matchResult, companyProfile);
    onGenerate?.();
  };

  const handleToggleSection = (type: ProposalSectionType) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleRegenerate = async (type: ProposalSectionType, feedback?: string) => {
    await regenerateSection(type, feedback);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">7섹션 제안서</h2>
          <p className="text-sm text-slate-500">AI가 생성한 제안서를 검토하고 수정하세요</p>
        </div>

        {!state.isComplete && !state.isGenerating && (
          <button
            onClick={handleGenerateAll}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium
              hover:bg-purple-700 transition-colors"
          >
            제안서 생성
          </button>
        )}
      </div>

      {/* 생성 중 */}
      {state.isGenerating && (
        <div className="p-6 bg-purple-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-purple-700 font-medium">제안서 생성 중...</span>
          </div>
          <p className="text-sm text-purple-600 mt-2">
            7개 섹션을 AI가 작성하고 있습니다. 잠시만 기다려주세요.
          </p>
        </div>
      )}

      {/* 섹션 목록 */}
      {(state.isComplete || state.sections.some((s) => s.content)) && (
        <div className="space-y-4">
          {SECTION_ORDER.map(({ type, number }) => {
            const sectionState = state.sections.find((s) => s.type === type);
            const isExpanded = expandedSections.has(type);
            const status = getSectionStatus(type);

            return (
              <SectionCard
                key={type}
                sectionNumber={number}
                sectionType={type}
                content={sectionState?.content || null}
                status={status}
                isExpanded={isExpanded}
                onToggle={() => handleToggleSection(type)}
                onRegenerate={(feedback) => handleRegenerate(type, feedback)}
              />
            );
          })}
        </div>
      )}

      {/* 다운로드 섹션 */}
      {state.isComplete && state.proposal && (
        <DocumentDownload proposal={state.proposal} />
      )}

      {/* 에러 표시 */}
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{state.error}</p>
        </div>
      )}

      {/* 푸터 */}
      {state.isComplete && (
        <div className="text-center py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            © 2026 Qetta Factory by uniLAB
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Data Flows. Evidence Follows.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProposalAIEditor;
