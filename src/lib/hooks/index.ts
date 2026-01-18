/**
 * Frontend Hooks
 * 정부지원사업 제안서 자동화 훅
 */

// =============================================================================
// 핵심 훅
// =============================================================================

// 인증
export { useAuth } from './useAuth';

// 대시보드
export { useDashboard } from './useDashboard';

// 입찰/공고 관리
export { useTender } from './useTender';

// 증빙 관리
export { useEvidence } from './useEvidence';

// AGI 연동
export { useAGI } from './useAGI';

// =============================================================================
// 정부지원사업 훅
// =============================================================================

// RFP 분석
export { useRFPAnalysis, type AnalysisPhase, type LayerProgress, type AnalysisState } from './useRFPAnalysis';

// 제안서 섹션
export { useProposalSections, type SectionStatus, type SectionState, type ProposalState } from './useProposalSections';

// 강점 매칭
export { useStrengthMatch, type MatchState } from './useStrengthMatch';

// 정부지원사업
export { useGovPrograms, type ProgramFilters, type ProgramsState } from './useGovPrograms';

// 문서 내보내기
export { useDocumentExport, type ExportFormat, type ExportOptions, type ExportResult, type ExportState } from './useDocumentExport';

// 분석 진행 상태
export { useAnalysisProgress, type LayerName, type LayerStatus, type AnalysisProgressState } from './useAnalysisProgress';
