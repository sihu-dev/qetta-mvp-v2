/**
 * Bizsupport Types
 * 정부지원사업 분석 및 제안서 자동화 타입 정의
 */

// =============================================================================
// RFP Analysis Types (4-Layer)
// =============================================================================

/** Layer 1: 메타데이터 */
export interface RFPMetadata {
  title: string;
  announcementNumber: string;
  organizationType: OrganizationType;
  organizationName: string;
  budget: number;
  budgetUnit: 'KRW' | 'USD';
  deadline: string;
  submissionMethod: string;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  eligibility: string[];
  requiredDocuments: string[];
  evaluationCriteria?: EvaluationCriterion[];
  rawText?: string;
}

export type OrganizationType =
  | 'LOCAL_GOVERNMENT'      // 지자체
  | 'CENTRAL_GOVERNMENT'    // 중앙정부
  | 'PUBLIC_INSTITUTION'    // 공공기관
  | 'SME_SUPPORT'           // 중기부
  | 'STARTUP_AGENCY'        // 창업진흥원
  | 'OTHER';

export interface EvaluationCriterion {
  category: string;
  weight: number;
  description?: string;
}

/** Layer 2a: 키워드 */
export interface ExtractedKeywords {
  primary: KeywordItem[];      // 핵심 키워드
  secondary: KeywordItem[];    // 보조 키워드
  technical: KeywordItem[];    // 기술 키워드
  domain: KeywordItem[];       // 도메인 키워드
}

export interface KeywordItem {
  term: string;
  score: number;           // TF-IDF score
  frequency: number;
  category?: string;
}

/** Layer 2b: 유사 문서 */
export interface SimilarDocument {
  id: string;
  title: string;
  similarity: number;      // 0-1 cosine similarity
  source: string;
  matchedKeywords: string[];
}

/** Layer 3: 은닉 니즈 */
export interface HiddenNeed {
  need: string;
  confidence: number;      // 0-1
  reasoning: string;
  category: HiddenNeedCategory;
  suggestedResponse?: string;
  relatedKeywords?: string[];  // 관련 키워드
}

export type HiddenNeedCategory =
  | 'KPI_PRESSURE'         // KPI 달성 압박
  | 'POLITICAL'            // 정치적 맥락
  | 'RISK_AVERSION'        // 리스크 회피
  | 'BUDGET_JUSTIFICATION' // 예산 정당화
  | 'PUBLICITY'            // 홍보/가시성
  | 'COMPLIANCE'           // 규정 준수
  | 'OTHER';

/** Layer 4: 전략 */
export interface ProposalStrategy {
  overallApproach: string;
  coreMessage: string;           // 핵심 메시지
  keyMessages: string[];
  differentiators: string[];
  emphasisSections: string[];    // 강조할 섹션
  riskMitigation: string[];
  riskFactors?: string[];        // 위험 요소
  emphasizeStrengths: string[];  // 강조할 강점 ID
  deemphasize: string[];         // 약화할 영역
  recommendedTone?: 'formal' | 'technical' | 'persuasive';  // 권장 톤
}

/** 전체 분석 결과 */
export interface RFPAnalysisResult {
  id: string;
  rfpId: string;
  metadata: RFPMetadata;
  keywords: ExtractedKeywords;
  similarDocuments: SimilarDocument[];
  hiddenNeeds: HiddenNeed[];
  strategy: ProposalStrategy;
  analyzedAt: string;
  processingTime: {
    layer1: number;
    layer2a: number;
    layer2b: number;
    layer3: number;
    layer4: number;
    total: number;
  };
}

// =============================================================================
// Strength Matching Types
// =============================================================================

export type StrengthCategory = 'COST' | 'SPEED' | 'TECH' | 'TRUST' | 'SUPPORT';

export interface QettaStrength {
  id: string;
  category: StrengthCategory;
  title: string;
  titleEn?: string;
  description: string;
  metric: string;
  priority: number;        // 1-10
  applicableClients: ClientType[];
  keywords: string[];      // 매칭용 키워드
}

export type ClientType =
  | 'SME_MANUFACTURER'     // 중소 제조업체
  | 'LOCAL_GOVERNMENT'     // 지자체
  | 'PUBLIC_INSTITUTION'   // 공공기관
  | 'STARTUP'              // 스타트업
  | 'SYSTEM_INTEGRATOR'    // SI업체
  | 'LARGE_ENTERPRISE';    // 대기업

export interface ClientPriority {
  clientType: ClientType;
  priorities: {
    category: StrengthCategory;
    weight: number;        // 0-1
  }[];
  bonusPoints: number;     // 가산점
}

export interface StrengthMatch {
  strengthId: string;
  strength: QettaStrength;
  score: number;           // 0-100 (alias for compatibility)
  matchScore: number;      // 0-100
  matchedKeywords: string[];
  matchedNeeds: string[];
  reasoning: string;
}

export interface MatchResult {
  rfpId: string;
  clientType: ClientType;
  matches: StrengthMatch[];
  topStrengths: string[];  // 상위 4개 강점 ID
  overallScore: number;
  recommendation: 'STRONG_FIT' | 'GOOD_FIT' | 'MODERATE_FIT' | 'WEAK_FIT';
}

// =============================================================================
// Government Program Types
// =============================================================================

export type ProgramSource = 'kstartup' | 'bizinfo' | 'g2b' | 'manual';

export interface GovProgram {
  id: string;
  title: string;           // 프로그램 제목
  name: string;
  nameEn?: string;
  agency: string;          // 주관기관
  organization: string;    // 주관 기관 (alias)
  maxAmount: number;
  amount: number;          // 지원금액 (alias)
  amountUnit: 'KRW' | 'USD';
  eligibility: string[];
  deadline?: string;
  applicationPeriod?: {
    start: string;
    end: string;
  };
  description: string;
  category?: string;       // 프로그램 카테고리
  benefits: string[];
  requirements: string[];
  link: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  source: ProgramSource;   // 데이터 출처
  tags: string[];
}

export interface GovProgramFilter {
  status?: GovProgram['status'];
  priority?: GovProgram['priority'];
  agency?: string;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
}

// =============================================================================
// API Types
// =============================================================================

export interface AnalyzeRequest {
  rfpText: string;
  rfpUrl?: string;
  clientType?: ClientType;
  options?: {
    skipLayer2b?: boolean;  // pgvector 건너뛰기
    skipLayer3?: boolean;   // Claude API 건너뛰기
    maxSimilarDocs?: number;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  data?: RFPAnalysisResult;
  error?: string;
  processingTime: number;
}

export interface MatchRequest {
  rfpId: string;
  analysisResult?: RFPAnalysisResult;
  clientType: ClientType;
  customStrengths?: string[];  // 사용자 지정 강점 ID
}

export interface MatchResponse {
  success: boolean;
  data?: MatchResult;
  error?: string;
}

export interface GenerateProposalRequest {
  rfpId: string;
  analysisResult: RFPAnalysisResult;
  matchResult: MatchResult;
  companyProfile: CompanyProfile;
  sections?: ProposalSectionType[];  // 생성할 섹션 (기본: 전체)
  format?: 'docx' | 'pdf' | 'both';
}

export interface CompanyProfile {
  name: string;
  representative: string;
  foundedYear?: number;
  employees?: number;
  revenue?: number;
  certifications?: string[];
  specializations?: string[];
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface GenerateProposalResponse {
  success: boolean;
  data?: {
    proposalId: string;
    sections: GeneratedSection[];
    documentUrl?: string;
    generatedAt: string;
  };
  error?: string;
}

export interface GeneratedSection {
  type: ProposalSectionType;
  title: string;
  content: string;
  status: 'generated' | 'pending' | 'error';
  wordCount: number;
}

export type ProposalSectionType =
  | 'UNDERSTANDING'        // 섹션 1: 이해도
  | 'SOLUTION'             // 섹션 2: 솔루션 개요
  | 'TECHNICAL'            // 섹션 3: 기술 상세
  | 'EXECUTION_PLAN'       // 섹션 4: 수행 계획
  | 'TEAM'                 // 섹션 5: 수행 조직
  | 'EXPERIENCE'           // 섹션 6: 유사 실적
  | 'COST_ROI';            // 섹션 7: 비용/ROI

export interface RegenerateSectionRequest {
  proposalId: string;
  sectionType: ProposalSectionType;
  feedback?: string;       // 재생성 피드백
  style?: 'formal' | 'technical' | 'persuasive';
}

// =============================================================================
// Progress & Status Types
// =============================================================================

export interface AnalysisProgress {
  rfpId: string;
  status: 'pending' | 'layer1' | 'layer2a' | 'layer2b' | 'layer3' | 'layer4' | 'completed' | 'error';
  progress: number;        // 0-100
  currentLayer?: string;
  message?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface ProposalProgress {
  proposalId: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  sectionsCompleted: number;
  totalSections: number;
  currentSection?: ProposalSectionType;
  message?: string;
}

// =============================================================================
// RFP Document Types
// =============================================================================

export interface RFPDocument {
  id: string;
  title: string;
  content: string;
  source: ProgramSource | 'manual';
  sourceUrl?: string;
  createdAt: string;
  metadata?: Partial<RFPMetadata>;
}
