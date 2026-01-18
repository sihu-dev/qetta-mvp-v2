/**
 * Bizsupport Module
 * 정부지원사업 분석 및 제안서 자동화
 */

// Types
export * from './types';
// Re-export proposal section types (excluding duplicates from ./types)
export type {
  Section1Understanding,
  Section2Solution,
  Section3Technical,
  Section4ExecutionPlan,
  Section5Team,
  Section6Experience,
  Section7CostROI,
  ProposalDocument,
  SectionGenerationConfig,
  ProposalSection,
  GeneratedProposal,
} from './types/proposal-sections';
export {
  DEFAULT_SECTION_CONFIGS,
  SECTION_COPY_TEMPLATES,
  DOCUMENT_FOOTER,
} from './types/proposal-sections';

// Data
export {
  QETTA_STRENGTHS,
  STRENGTHS_BY_CATEGORY,
  CATEGORY_META,
  getStrengthById,
  getStrengthsByCategory,
  getStrengthsForClient,
  getTopStrengths,
  searchStrengthsByKeyword,
} from './data/qetta-strengths';

export {
  CLIENT_PRIORITIES,
  CLIENT_TYPE_META,
  MATCHING_THRESHOLDS,
  DEFAULT_MATCH_CONFIG,
  getClientPriority,
  getCategoryWeight,
  getBonusPoints,
  getMatchConfigForClient,
} from './data/client-priorities';

export {
  GOV_PROGRAMS_2026,
  QETTA_COMPANY_PROFILE,
  PROGRAM_FIT_SCORES,
  getGovProgramById,
  filterGovPrograms,
  getOpenPrograms,
  getUpcomingPrograms,
  getPriorityPrograms,
  searchProgramsByTag,
} from './data/gov-programs-2026';

// Engines
export {
  analyzeRFP,
  extractMetadata,
  extractKeywords,
  semanticMatch,
  inferHiddenNeeds,
  formulateStrategy,
} from './engines/deep-rfp-analyzer';

export {
  matchStrengths,
  getRecommendationLabel,
  getRecommendationColor,
  selectTopStrengths,
} from './engines/needs-strength-matcher';

export {
  generateSection,
  generateAllSections,
  regenerateSection,
} from './engines/section-writer';

export {
  matchExperiences,
  getProjectById,
  getAllProjects,
  searchProjects,
  formatExperienceForProposal,
} from './engines/experience-matcher';
