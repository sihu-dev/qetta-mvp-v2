/**
 * useProposalSections Hook
 * 7섹션 제안서 상태 관리
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  ProposalSection,
  ProposalSectionType,
  GeneratedProposal,
} from '@/lib/bizsupport/types/proposal-sections';
import type {
  RFPAnalysisResult,
  MatchResult,
  CompanyProfile,
} from '@/lib/bizsupport/types';

// =============================================================================
// 타입 정의
// =============================================================================

export type SectionStatus = 'idle' | 'generating' | 'complete' | 'error';

export interface SectionState {
  type: ProposalSectionType;
  status: SectionStatus;
  content: ProposalSection | null;
  error: string | null;
}

export interface ProposalState {
  sections: SectionState[];
  isGenerating: boolean;
  isComplete: boolean;
  proposal: GeneratedProposal | null;
  error: string | null;
}

export interface UseProposalSectionsReturn {
  state: ProposalState;
  generateAll: (
    analysis: RFPAnalysisResult,
    match: MatchResult,
    company?: CompanyProfile
  ) => Promise<void>;
  regenerateSection: (
    sectionType: ProposalSectionType,
    feedback?: string
  ) => Promise<void>;
  updateSection: (
    sectionType: ProposalSectionType,
    content: Partial<ProposalSection>
  ) => void;
  reset: () => void;
  getSectionStatus: (type: ProposalSectionType) => SectionStatus;
}

// =============================================================================
// 상수
// =============================================================================

const SECTION_TYPES: ProposalSectionType[] = [
  'UNDERSTANDING',
  'SOLUTION',
  'TECHNICAL',
  'EXECUTION_PLAN',
  'TEAM',
  'EXPERIENCE',
  'COST_ROI',
];

// =============================================================================
// 초기 상태
// =============================================================================

const createInitialSectionStates = (): SectionState[] =>
  SECTION_TYPES.map((type) => ({
    type,
    status: 'idle',
    content: null,
    error: null,
  }));

const initialState: ProposalState = {
  sections: createInitialSectionStates(),
  isGenerating: false,
  isComplete: false,
  proposal: null,
  error: null,
};

// =============================================================================
// Hook
// =============================================================================

export function useProposalSections(): UseProposalSectionsReturn {
  const [state, setState] = useState<ProposalState>(initialState);
  const [context, setContext] = useState<{
    analysis: RFPAnalysisResult | null;
    match: MatchResult | null;
    company: CompanyProfile | null;
  }>({ analysis: null, match: null, company: null });

  /**
   * 전체 제안서 생성
   */
  const generateAll = useCallback(async (
    analysis: RFPAnalysisResult,
    match: MatchResult,
    company?: CompanyProfile
  ): Promise<void> => {
    setContext({ analysis, match, company: company || null });

    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => ({
        ...s,
        status: 'generating' as SectionStatus,
      })),
      isGenerating: true,
      isComplete: false,
      error: null,
    }));

    try {
      const response = await fetch('/api/gov/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult: analysis,
          matchResult: match,
          companyProfile: company,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      const proposal = data.data.proposal as GeneratedProposal;

      // 각 섹션 상태 업데이트
      const updatedSections = SECTION_TYPES.map((type) => {
        const sectionContent = proposal.sections.find((s) => s.sectionType === type);
        return {
          type,
          status: 'complete' as SectionStatus,
          content: sectionContent || null,
          error: null,
        };
      });

      setState({
        sections: updatedSections,
        isGenerating: false,
        isComplete: true,
        proposal,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({
          ...s,
          status: 'error' as SectionStatus,
          error: errorMessage,
        })),
        isGenerating: false,
        isComplete: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * 특정 섹션 재생성
   */
  const regenerateSection = useCallback(async (
    sectionType: ProposalSectionType,
    feedback?: string
  ): Promise<void> => {
    if (!context.analysis || !context.match) {
      throw new Error('No analysis context available');
    }

    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.type === sectionType
          ? { ...s, status: 'generating' as SectionStatus, error: null }
          : s
      ),
    }));

    try {
      const response = await fetch('/api/gov/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: state.proposal?.id,
          sectionType,
          analysisResult: context.analysis,
          matchResult: context.match,
          companyProfile: context.company,
          feedback,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Regeneration failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Regeneration failed');
      }

      const regeneratedSection = data.data.section as ProposalSection;

      setState((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === sectionType
            ? { ...s, status: 'complete' as SectionStatus, content: regeneratedSection }
            : s
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === sectionType
            ? { ...s, status: 'error' as SectionStatus, error: errorMessage }
            : s
        ),
      }));
    }
  }, [context, state.proposal?.id]);

  /**
   * 섹션 수동 수정
   */
  const updateSection = useCallback((
    sectionType: ProposalSectionType,
    content: Partial<ProposalSection>
  ): void => {
    setState((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.type === sectionType && s.content
          ? { ...s, content: { ...s.content, ...content } }
          : s
      ),
    }));
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setState(initialState);
    setContext({ analysis: null, match: null, company: null });
  }, []);

  /**
   * 섹션 상태 조회
   */
  const getSectionStatus = useCallback((type: ProposalSectionType): SectionStatus => {
    const section = state.sections.find((s) => s.type === type);
    return section?.status || 'idle';
  }, [state.sections]);

  return {
    state,
    generateAll,
    regenerateSection,
    updateSection,
    reset,
    getSectionStatus,
  };
}

export default useProposalSections;
