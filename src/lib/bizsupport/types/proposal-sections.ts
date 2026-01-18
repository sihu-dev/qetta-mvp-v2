/**
 * 7섹션 제안서 타입 정의
 * 정부 RFP 표준 + Qetta 브랜드 통합
 */

import type { HiddenNeed, QettaStrength, CompanyProfile } from '../types';

// =============================================================================
// 7섹션 구조
// =============================================================================

/**
 * 섹션 1: 이해도 (Understanding)
 * 타겟: 심사위원단
 * 핵심: 은닉 니즈 3가지 + 태그라인
 */
export interface Section1Understanding {
  type: 'UNDERSTANDING';
  title: string;
  openingStatement: string;      // 공감 문구
  hiddenNeeds: {
    need: HiddenNeed;
    response: string;            // Qetta의 대응
  }[];
  conclusion: string;
  taglineIntegration?: string;   // "데이터가 흐르면, 증빙이 따라옵니다"
}

/**
 * 섹션 2: 솔루션 개요 (Solution Overview)
 * 타겟: 기술심사관
 * 핵심: OTT칩 + AI 예지보전
 */
export interface Section2Solution {
  type: 'SOLUTION';
  title: string;
  coreTechnology: {
    name: string;
    description: string;
    differentiator: string;
  }[];
  valueProposition: string;      // "MES 5,000만원의 기능을 50만원에"
  architecture?: {
    diagram?: string;            // Base64 또는 URL
    description: string;
  };
  keyFeatures: {
    feature: string;
    benefit: string;
  }[];
}

/**
 * 섹션 3: 기술 상세 (Technical Details)
 * 타겟: 기술심사관
 * 핵심: 상세 기술 스펙
 */
export interface Section3Technical {
  type: 'TECHNICAL';
  title: string;
  specifications: {
    category: string;
    items: {
      name: string;
      spec: string;
      note?: string;
    }[];
  }[];
  integrationPoints: string[];
  securityFeatures: {
    feature: string;
    description: string;
    standard?: string;           // ISO, 전자정부법 등
  }[];
  scalability: string;
}

/**
 * 섹션 4: 수행 계획 (Execution Plan)
 * 타겟: 사업담당관
 * 핵심: 10분 설치 + 4주 마일스톤
 */
export interface Section4ExecutionPlan {
  type: 'EXECUTION_PLAN';
  title: string;
  timeline: {
    phase: string;
    duration: string;
    deliverables: string[];
    milestones: string[];
  }[];
  quickWin: string;              // "설치 당일부터 데이터가 흐릅니다"
  riskManagement: {
    risk: string;
    mitigation: string;
    contingency: string;
  }[];
  qualityAssurance: string[];
}

/**
 * 섹션 5: 수행 조직 (Team Composition)
 * 타겟: 계약담당관 + 스마트공장/AI바우처 책임자
 * 핵심: 팀 구성 + Gov ZIP + SBOM + 감사 로그
 */
export interface Section5Team {
  type: 'TEAM';
  title: string;
  organization: {
    role: string;
    name: string;
    responsibilities: string[];
    qualifications?: string[];
  }[];
  trustElements: {
    category: 'GOV_ZIP' | 'RLS' | 'SBOM' | 'ENCRYPTION' | 'AUDIT';
    title: string;
    description: string;
    compliance?: string[];       // 전자정부법 27조 등
  }[];
  supportCommitment: string;
}

/**
 * 섹션 6: 유사 실적 (Experience)
 * 타겟: 결재권자
 * 핵심: pgvector로 유사 프로젝트 매칭
 */
export interface Section6Experience {
  type: 'EXPERIENCE';
  title: string;
  projects: {
    name: string;
    client: string;
    period: string;
    budget?: number;
    description: string;
    outcomes: string[];
    relevance: string;           // 본 사업과의 연관성
    similarity?: number;         // pgvector 유사도
  }[];
  certifications: string[];
  awards?: string[];
}

/**
 * 섹션 7: 비용/ROI (Cost & ROI)
 * 타겟: 예산심의관
 * 핵심: 투자 50만원 → ROI 0.7개월 + 브랜드 클로징
 */
export interface Section7CostROI {
  type: 'COST_ROI';
  title: string;
  costBreakdown: {
    category: string;
    amount: number;
    description: string;
  }[];
  totalCost: number;
  roi: {
    metric: string;
    value: string;
    comparison?: string;         // "MES 대비 99% 절감"
  }[];
  paybackPeriod: string;         // "0.7개월"
  longTermValue: string[];
  closing: {
    summary: string;
    tagline: string;             // "데이터가 흐르면, 증빙이 따라옵니다"
    brandSignature: string;      // "Qetta. inevitable."
  };
}

// =============================================================================
// 통합 제안서 타입
// =============================================================================

export interface ProposalDocument {
  id: string;
  rfpId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'final';

  // 메타 정보
  meta: {
    rfpTitle: string;
    clientName: string;
    deadline: string;
    fitScore?: number;
    fitGrade?: string;
  };

  // 회사 정보
  company: CompanyProfile;

  // 7개 섹션
  sections: {
    understanding: Section1Understanding;
    solution: Section2Solution;
    technical: Section3Technical;
    executionPlan: Section4ExecutionPlan;
    team: Section5Team;
    experience: Section6Experience;
    costRoi: Section7CostROI;
  };

  // 선택된 강점
  selectedStrengths: QettaStrength[];

  // 출력 형식
  outputs?: {
    docx?: string;               // 파일 경로 또는 URL
    pdf?: string;
    pptx?: string;
  };
}

// =============================================================================
// 섹션 생성 설정
// =============================================================================

export interface SectionGenerationConfig {
  sectionType: keyof ProposalDocument['sections'];
  targetAudience: string;
  tone: 'formal' | 'technical' | 'persuasive' | 'balanced';
  maxWords?: number;
  includeMetrics: boolean;
  includeBrand: boolean;
  customPrompt?: string;
}

export const DEFAULT_SECTION_CONFIGS: Record<string, SectionGenerationConfig> = {
  understanding: {
    sectionType: 'understanding',
    targetAudience: '심사위원단',
    tone: 'persuasive',
    maxWords: 500,
    includeMetrics: false,
    includeBrand: true,
  },
  solution: {
    sectionType: 'solution',
    targetAudience: '기술심사관',
    tone: 'technical',
    maxWords: 800,
    includeMetrics: true,
    includeBrand: false,
  },
  technical: {
    sectionType: 'technical',
    targetAudience: '기술심사관',
    tone: 'technical',
    maxWords: 1000,
    includeMetrics: true,
    includeBrand: false,
  },
  executionPlan: {
    sectionType: 'executionPlan',
    targetAudience: '사업담당관',
    tone: 'formal',
    maxWords: 600,
    includeMetrics: true,
    includeBrand: false,
  },
  team: {
    sectionType: 'team',
    targetAudience: '계약담당관, 정부사업 책임자',
    tone: 'formal',
    maxWords: 700,
    includeMetrics: false,
    includeBrand: false,
  },
  experience: {
    sectionType: 'experience',
    targetAudience: '결재권자',
    tone: 'formal',
    maxWords: 600,
    includeMetrics: true,
    includeBrand: false,
  },
  costRoi: {
    sectionType: 'costRoi',
    targetAudience: '예산심의관',
    tone: 'persuasive',
    maxWords: 500,
    includeMetrics: true,
    includeBrand: true,
  },
};

// =============================================================================
// 카피라이팅 템플릿
// =============================================================================

export const SECTION_COPY_TEMPLATES = {
  understanding: {
    header: '귀 기관이 직면한 현실을 이해합니다',
    template: '스마트공장 지원금을 집행하실 때 가장 큰 고민은 수혜기업의 실제 효과 증명이 아닐까 생각합니다.',
  },
  solution: {
    header: 'OTT칩 + AI 예지보전: 검증된 기술',
    template: 'MES 5,000만원의 기능을 50만원에.',
  },
  executionPlan: {
    header: '10분 설치, 4주 완료',
    template: '설치 당일부터 데이터가 흐릅니다.',
  },
  team: {
    header: '검증된 팀, 명확한 역할',
    template: '책임지고 완료합니다.',
  },
  trust: {
    header: '감사에 당당한 증빙',
    template: '의심받지 않는 증빙, 반박할 수 없는 기록.',
  },
  experience: {
    header: '이미 검증된 성과',
    template: '숫자로 증명합니다.',
  },
  costRoi: {
    header: '투자 대비 효과',
    closing: '데이터가 흐르면, 증빙이 따라옵니다.\nQetta. inevitable.',
  },
} as const;

// =============================================================================
// 문서 푸터
// =============================================================================

export const DOCUMENT_FOOTER = {
  copyright: '© 2026 Qetta Factory by uniLAB',
  tagline: 'Data Flows. Evidence Follows.',
} as const;

// =============================================================================
// 호환성 타입 (Hook/Component에서 사용)
// =============================================================================

/** 섹션 타입 (간소화) */
export type ProposalSectionType =
  | 'UNDERSTANDING'
  | 'SOLUTION'
  | 'TECHNICAL'
  | 'EXECUTION_PLAN'
  | 'TEAM'
  | 'EXPERIENCE'
  | 'COST_ROI';

/** 제안서 섹션 (간소화) */
export interface ProposalSection {
  sectionType: ProposalSectionType;
  title: string;
  content: string;
  keyPoints: string[];
  targetAudience?: string;
  wordCount?: number;
  generatedAt?: string;
}

/** 생성된 제안서 */
export interface GeneratedProposal {
  id: string;
  rfpId: string;
  rfpTitle: string;
  company: CompanyProfile;
  sections: ProposalSection[];
  createdAt: string;
  updatedAt?: string;
  status: 'draft' | 'review' | 'final';
  version: number;
}
