/**
 * Experience Matcher
 * pgvector 기반 유사 실적 매칭
 */

import type { RFPAnalysisResult, SimilarDocument } from '../types';

// =============================================================================
// 유사 프로젝트 데이터베이스 (Mock)
// =============================================================================

interface ProjectExperience {
  id: string;
  title: string;
  client: string;
  period: string;
  budget: number;
  description: string;
  outcomes: string[];
  keywords: string[];
  embedding?: number[];  // pgvector 임베딩
}

const PROJECT_DATABASE: ProjectExperience[] = [
  {
    id: 'exp-1',
    title: '스마트공장 기초 수준 구축',
    client: 'A제조(주)',
    period: '2025.03 - 2025.06',
    budget: 50000000,
    description: '중소 제조기업 대상 설비 데이터 수집 및 모니터링 시스템 구축',
    outcomes: [
      '불량률 28% 감소',
      'ROI 0.8개월 달성',
      '실시간 모니터링 체계 구축',
    ],
    keywords: ['스마트공장', '데이터수집', '모니터링', '제조', 'MES'],
  },
  {
    id: 'exp-2',
    title: 'AI바우처 예지보전 시스템',
    client: 'B공장(주)',
    period: '2025.05 - 2025.08',
    budget: 80000000,
    description: 'AI 기반 설비 고장 예측 및 예지보전 시스템 도입',
    outcomes: [
      '비계획 정지 75% 감소',
      '유지보수 비용 40% 절감',
      '72시간 전 고장 예측 달성',
    ],
    keywords: ['AI', '예지보전', '고장예측', 'CBM', 'PdM'],
  },
  {
    id: 'exp-3',
    title: '품질 예측 AI 시스템',
    client: 'C기업(주)',
    period: '2025.07 - 2025.10',
    budget: 100000000,
    description: 'AI 기반 실시간 품질 예측 및 불량 사전 방지 시스템',
    outcomes: [
      '불량률 30%→5% 개선',
      '품질 검사 시간 50% 단축',
      'SPC 자동화 달성',
    ],
    keywords: ['AI', '품질', '불량', '예측', 'SPC'],
  },
  {
    id: 'exp-4',
    title: '디지털트윈 파일럿',
    client: 'D산업(주)',
    period: '2025.09 - 2025.12',
    budget: 150000000,
    description: '제조 현장 디지털트윈 구축 및 시뮬레이션 환경 개발',
    outcomes: [
      '공정 최적화 15% 달성',
      '에너지 효율 20% 개선',
      '가상 시운전 환경 구축',
    ],
    keywords: ['디지털트윈', '시뮬레이션', '3D', '공정최적화'],
  },
  {
    id: 'exp-5',
    title: '설비 이상 감지 시스템',
    client: 'E제조(주)',
    period: '2024.11 - 2025.02',
    budget: 60000000,
    description: 'IoT 센서 기반 설비 이상 실시간 감지 및 알림 시스템',
    outcomes: [
      '이상 감지 정확도 95%',
      '긴급 대응 시간 80% 단축',
      '24/7 모니터링 체계 구축',
    ],
    keywords: ['IoT', '센서', '이상감지', '알림', '모니터링'],
  },
];

// =============================================================================
// 매칭 로직
// =============================================================================

/**
 * 키워드 기반 유사도 계산
 */
function calculateKeywordSimilarity(
  projectKeywords: string[],
  rfpKeywords: string[]
): number {
  const projectSet = new Set(projectKeywords.map((k) => k.toLowerCase()));
  const rfpSet = new Set(rfpKeywords.map((k) => k.toLowerCase()));

  const intersection = [...projectSet].filter((k) => rfpSet.has(k));
  const union = new Set([...projectSet, ...rfpSet]);

  // Jaccard 유사도
  return intersection.length / union.size;
}

/**
 * 예산 범위 유사도 계산
 */
function calculateBudgetSimilarity(
  projectBudget: number,
  rfpBudget: number
): number {
  if (rfpBudget === 0) return 0.5;  // 예산 정보 없으면 중립

  const ratio = Math.min(projectBudget, rfpBudget) / Math.max(projectBudget, rfpBudget);
  return ratio;
}

/**
 * 통합 유사도 계산
 */
function calculateSimilarity(
  project: ProjectExperience,
  analysis: RFPAnalysisResult
): number {
  // RFP 키워드 추출
  const rfpKeywords = [
    ...analysis.keywords.primary.map((k) => k.term),
    ...analysis.keywords.technical.map((k) => k.term),
    ...analysis.keywords.domain.map((k) => k.term),
  ];

  // 키워드 유사도 (70% 가중치)
  const keywordSim = calculateKeywordSimilarity(project.keywords, rfpKeywords);

  // 예산 유사도 (30% 가중치)
  const budgetSim = calculateBudgetSimilarity(project.budget, analysis.metadata.budget);

  return keywordSim * 0.7 + budgetSim * 0.3;
}

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 유사 프로젝트 매칭
 */
export async function matchExperiences(
  analysis: RFPAnalysisResult,
  maxResults: number = 5
): Promise<SimilarDocument[]> {
  // 각 프로젝트의 유사도 계산
  const scored = PROJECT_DATABASE.map((project) => ({
    project,
    similarity: calculateSimilarity(project, analysis),
  }));

  // 유사도 순으로 정렬
  scored.sort((a, b) => b.similarity - a.similarity);

  // 상위 N개 반환
  return scored.slice(0, maxResults).map(({ project, similarity }) => ({
    id: project.id,
    title: project.title,
    similarity,
    source: 'internal',
    matchedKeywords: project.keywords.filter((k) =>
      analysis.keywords.technical.some((t) =>
        t.term.toLowerCase().includes(k.toLowerCase())
      ) ||
      analysis.keywords.domain.some((d) =>
        d.term.toLowerCase().includes(k.toLowerCase())
      )
    ),
  }));
}

/**
 * 프로젝트 상세 정보 조회
 */
export function getProjectById(id: string): ProjectExperience | undefined {
  return PROJECT_DATABASE.find((p) => p.id === id);
}

/**
 * 모든 프로젝트 조회
 */
export function getAllProjects(): ProjectExperience[] {
  return PROJECT_DATABASE;
}

/**
 * 프로젝트 검색
 */
export function searchProjects(query: string): ProjectExperience[] {
  const lowerQuery = query.toLowerCase();

  return PROJECT_DATABASE.filter((project) =>
    project.title.toLowerCase().includes(lowerQuery) ||
    project.description.toLowerCase().includes(lowerQuery) ||
    project.keywords.some((k) => k.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 제안서용 실적 포맷팅
 */
export function formatExperienceForProposal(
  experience: SimilarDocument,
  rfpTitle: string
): string {
  const project = getProjectById(experience.id);
  if (!project) return '';

  return `### ${project.title}

**고객**: ${project.client}
**기간**: ${project.period}
**규모**: ${project.budget.toLocaleString()}원

**개요**:
${project.description}

**주요 성과**:
${project.outcomes.map((o) => `- ${o}`).join('\n')}

**본 사업(${rfpTitle})과의 연관성**:
${experience.matchedKeywords.length > 0
  ? `공통 기술 요소: ${experience.matchedKeywords.join(', ')}`
  : '유사한 사업 범위 및 목표'
}
(유사도: ${(experience.similarity * 100).toFixed(0)}%)
`;
}
