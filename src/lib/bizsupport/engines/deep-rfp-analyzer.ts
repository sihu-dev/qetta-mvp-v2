/**
 * 4-Layer Deep RFP Analyzer
 * 승률 결정 핵심: Layer 3 "은닉 니즈 추론"
 *
 * 실행 순서:
 * Phase A: 병렬 (Layer 1 + Layer 2a) ~500ms
 * Phase B: 순차 (Layer 2b - pgvector) ~1s
 * Phase C: Claude API (Layer 3) ~3-5s
 * Phase D: 전략 수립 (Layer 4) ~500ms
 * 총 예상 시간: 5-7초
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  RFPMetadata,
  ExtractedKeywords,
  KeywordItem,
  SimilarDocument,
  HiddenNeed,
  HiddenNeedCategory,
  ProposalStrategy,
  RFPAnalysisResult,
  OrganizationType,
  AnalyzeRequest,
} from '../types';

// =============================================================================
// Layer 1: 메타데이터 추출 (규칙 기반)
// =============================================================================

export async function extractMetadata(rfpText: string): Promise<RFPMetadata> {
  const startTime = Date.now();

  // 기관 유형 추론
  const organizationType = inferOrganizationType(rfpText);

  // 예산 추출
  const budget = extractBudget(rfpText);

  // 마감일 추출
  const deadline = extractDeadline(rfpText);

  // 자격 요건 추출
  const eligibility = extractEligibility(rfpText);

  // 제출 서류 추출
  const requiredDocuments = extractRequiredDocuments(rfpText);

  // 제목 추출 (첫 줄 또는 "사업명" 키워드 근처)
  const title = extractTitle(rfpText);

  // 공고번호 추출
  const announcementNumber = extractAnnouncementNumber(rfpText);

  // 기관명 추출
  const organizationName = extractOrganizationName(rfpText);

  console.log(`[Layer 1] Metadata extraction completed in ${Date.now() - startTime}ms`);

  return {
    title,
    announcementNumber,
    organizationType,
    organizationName,
    budget,
    budgetUnit: 'KRW',
    deadline,
    submissionMethod: extractSubmissionMethod(rfpText),
    eligibility,
    requiredDocuments,
    rawText: rfpText.substring(0, 5000), // 처음 5000자만 저장
  };
}

function inferOrganizationType(text: string): OrganizationType {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('지자체') || lowerText.includes('시청') || lowerText.includes('도청') || lowerText.includes('군청')) {
    return 'LOCAL_GOVERNMENT';
  }
  if (lowerText.includes('중소벤처기업부') || lowerText.includes('중기부')) {
    return 'SME_SUPPORT';
  }
  if (lowerText.includes('창업진흥원') || lowerText.includes('창진원')) {
    return 'STARTUP_AGENCY';
  }
  if (lowerText.includes('정부') || lowerText.includes('부처')) {
    return 'CENTRAL_GOVERNMENT';
  }
  if (lowerText.includes('공단') || lowerText.includes('진흥원') || lowerText.includes('연구원')) {
    return 'PUBLIC_INSTITUTION';
  }

  return 'OTHER';
}

function extractBudget(text: string): number {
  // 다양한 예산 패턴 매칭
  const patterns = [
    /예산[:\s]*([0-9,]+)\s*(백만원|천만원|억원|만원|원)/,
    /지원금[:\s]*([0-9,]+)\s*(백만원|천만원|억원|만원|원)/,
    /최대[:\s]*([0-9,]+)\s*(백만원|천만원|억원|만원|원)/,
    /([0-9,]+)\s*(백만원|천만원|억원|만원)\s*(지원|한도)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1].replace(/,/g, ''), 10);
      const unit = match[2];

      switch (unit) {
        case '억원':
          return value * 100000000;
        case '천만원':
          return value * 10000000;
        case '백만원':
          return value * 1000000;
        case '만원':
          return value * 10000;
        default:
          return value;
      }
    }
  }

  return 0;
}

function extractDeadline(text: string): string {
  // 날짜 패턴 매칭
  const patterns = [
    /마감[:\s]*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
    /접수[:\s]*~?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
    /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*까지/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }
  }

  return '';
}

function extractEligibility(text: string): string[] {
  const eligibility: string[] = [];
  const lines = text.split('\n');

  let inEligibilitySection = false;
  for (const line of lines) {
    if (line.includes('자격') || line.includes('대상') || line.includes('요건')) {
      inEligibilitySection = true;
      continue;
    }
    if (inEligibilitySection) {
      if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('○')) {
        eligibility.push(line.trim().replace(/^[-•○]\s*/, ''));
      }
      if (eligibility.length >= 5 || line.trim() === '') {
        break;
      }
    }
  }

  return eligibility;
}

function extractRequiredDocuments(text: string): string[] {
  const documents: string[] = [];
  const patterns = [
    '사업계획서',
    '제안서',
    '견적서',
    '법인등기부등본',
    '사업자등록증',
    '재무제표',
    '기술설명서',
    '이력서',
  ];

  for (const pattern of patterns) {
    if (text.includes(pattern)) {
      documents.push(pattern);
    }
  }

  return documents;
}

function extractTitle(text: string): string {
  const lines = text.split('\n').filter((l) => l.trim());

  // "사업명" 키워드 근처 찾기
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('사업명') && i + 1 < lines.length) {
      return lines[i + 1].trim();
    }
  }

  // 첫 줄이 제목일 가능성
  if (lines.length > 0 && lines[0].length < 100) {
    return lines[0].trim();
  }

  return '제목 미상';
}

function extractAnnouncementNumber(text: string): string {
  const patterns = [
    /공고[번호]*[:\s]*([A-Z0-9\-]+)/i,
    /사업[번호]*[:\s]*([A-Z0-9\-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return '';
}

function extractOrganizationName(text: string): string {
  const patterns = [
    /발주[기관처]*[:\s]*([가-힣]+)/,
    /주관[기관]*[:\s]*([가-힣]+)/,
    /시행[기관]*[:\s]*([가-힣]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return '';
}

function extractSubmissionMethod(text: string): string {
  if (text.includes('온라인') || text.includes('전자입찰') || text.includes('나라장터')) {
    return '온라인 제출';
  }
  if (text.includes('방문') || text.includes('우편')) {
    return '오프라인 제출';
  }
  return '확인 필요';
}

// =============================================================================
// Layer 2a: TF-IDF 키워드 추출
// =============================================================================

export async function extractKeywords(rfpText: string): Promise<ExtractedKeywords> {
  const startTime = Date.now();

  // 간단한 TF-IDF 구현
  const words = rfpText
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  // 단어 빈도 계산
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  // 불용어 제거
  const stopwords = new Set([
    '있는', '하는', '대한', '위한', '통한', '있다', '한다', '이다',
    '것이', '수행', '지원', '사업', '기업', '추진', '진행', '관련',
  ]);

  const filteredWords = Object.entries(wordFreq)
    .filter(([word]) => !stopwords.has(word))
    .sort((a, b) => b[1] - a[1]);

  // 카테고리 분류
  const techKeywords = ['AI', '인공지능', '빅데이터', '클라우드', 'IoT', '스마트', '자동화', '로봇', '디지털', 'MES', 'ERP'];
  const domainKeywords = ['제조', '공장', '설비', '품질', '생산', '공정', '유지보수', '모니터링'];

  const primary: KeywordItem[] = [];
  const secondary: KeywordItem[] = [];
  const technical: KeywordItem[] = [];
  const domain: KeywordItem[] = [];

  for (const [word, freq] of filteredWords.slice(0, 50)) {
    const score = freq / words.length;
    const item: KeywordItem = { term: word, score, frequency: freq };

    if (techKeywords.some((k) => word.includes(k))) {
      technical.push(item);
    } else if (domainKeywords.some((k) => word.includes(k))) {
      domain.push(item);
    } else if (freq >= 3) {
      primary.push(item);
    } else {
      secondary.push(item);
    }
  }

  console.log(`[Layer 2a] Keyword extraction completed in ${Date.now() - startTime}ms`);

  return {
    primary: primary.slice(0, 10),
    secondary: secondary.slice(0, 10),
    technical: technical.slice(0, 10),
    domain: domain.slice(0, 10),
  };
}

// =============================================================================
// Layer 2b: pgvector 유사도 검색 (Placeholder)
// =============================================================================

export async function semanticMatch(
  keywords: ExtractedKeywords,
  _maxResults: number = 5
): Promise<SimilarDocument[]> {
  const startTime = Date.now();

  // TODO: Supabase pgvector 연동
  // 현재는 Mock 데이터 반환

  const mockDocs: SimilarDocument[] = [
    {
      id: 'doc-1',
      title: '2025 스마트공장 기초 구축 사업',
      similarity: 0.85,
      source: 'internal',
      matchedKeywords: keywords.technical.slice(0, 3).map((k) => k.term),
    },
    {
      id: 'doc-2',
      title: 'AI바우처 수요기업 지원 사업',
      similarity: 0.78,
      source: 'internal',
      matchedKeywords: keywords.domain.slice(0, 3).map((k) => k.term),
    },
  ];

  console.log(`[Layer 2b] Semantic match completed in ${Date.now() - startTime}ms`);

  return mockDocs;
}

// =============================================================================
// Layer 3: 은닉 니즈 추론 (Claude API)
// =============================================================================

const HIDDEN_NEEDS_PROMPT = `당신은 20년 경력의 정부 RFP 평가위원입니다.

## 분석 관점
1. 공무원 관점: 이 사업을 통해 무엇을 달성하려는가?
2. 기관 특성: 각 기관 유형의 전형적인 고민과 제약사항
3. 예산 규모: 해당 예산에서 기대하는 현실적인 성과물
4. 정치적 맥락: 명시되지 않았지만 당연히 기대하는 것
5. 리스크 회피: 공무원이 가장 우려하는 실패 시나리오

## Few-shot 예시
예시 1: "지자체 스마트공장 지원사업"
→ 은닉 니즈: "연말 KPI 달성을 위한 수치화된 성과 필요", confidence: 0.85

예시 2: "중기부 AI바우처 사업"
→ 은닉 니즈: "AI 도입의 가시적 효과 증명 필요 (언론 홍보용)", confidence: 0.75

## Chain-of-Thought 지시
1. 먼저 발주기관 유형을 분석하세요
2. 그 다음 예산 규모에서 기대하는 성과를 추론하세요
3. 마지막으로 명시되지 않은 우려사항을 도출하세요

## 출력 JSON Schema
{
  "hiddenNeeds": [
    {
      "need": "string - 은닉 니즈 설명",
      "confidence": "number 0.0-1.0 - 확신도",
      "reasoning": "string - 추론 근거",
      "category": "KPI_PRESSURE|POLITICAL|RISK_AVERSION|BUDGET_JUSTIFICATION|PUBLICITY|COMPLIANCE|OTHER"
    }
  ]
}

confidence >= 0.5인 니즈만 포함하세요. 최대 5개까지 도출하세요.`;

export async function inferHiddenNeeds(
  metadata: RFPMetadata,
  keywords: ExtractedKeywords,
  similarDocs: SimilarDocument[]
): Promise<HiddenNeed[]> {
  const startTime = Date.now();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[Layer 3] ANTHROPIC_API_KEY not set, returning mock data');
    return getMockHiddenNeeds(metadata);
  }

  const anthropic = new Anthropic({ apiKey });

  const context = `
## RFP 메타데이터
- 제목: ${metadata.title}
- 기관 유형: ${metadata.organizationType}
- 기관명: ${metadata.organizationName}
- 예산: ${metadata.budget.toLocaleString()}원
- 마감일: ${metadata.deadline}

## 핵심 키워드
- 기술: ${keywords.technical.map((k) => k.term).join(', ')}
- 도메인: ${keywords.domain.map((k) => k.term).join(', ')}
- 주요: ${keywords.primary.map((k) => k.term).join(', ')}

## 유사 문서
${similarDocs.map((d) => `- ${d.title} (유사도: ${(d.similarity * 100).toFixed(0)}%)`).join('\n')}

## 자격 요건
${metadata.eligibility.join('\n')}
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${HIDDEN_NEEDS_PROMPT}\n\n---\n\n${context}\n\nJSON 형식으로만 응답하세요.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`[Layer 3] Hidden needs inference completed in ${Date.now() - startTime}ms`);
        return parsed.hiddenNeeds || [];
      }
    }
  } catch (error) {
    console.error('[Layer 3] Claude API error:', error);
  }

  return getMockHiddenNeeds(metadata);
}

function getMockHiddenNeeds(metadata: RFPMetadata): HiddenNeed[] {
  const needs: HiddenNeed[] = [];

  if (metadata.organizationType === 'LOCAL_GOVERNMENT') {
    needs.push({
      need: '연말 KPI 달성을 위한 수치화된 성과 지표 필요',
      confidence: 0.85,
      reasoning: '지자체는 연간 성과 평가를 받으며, 스마트공장 보급 건수가 핵심 KPI임',
      category: 'KPI_PRESSURE',
    });
  }

  if (metadata.budget >= 100000000) {
    needs.push({
      need: '대규모 예산 집행에 대한 감사 대비 증빙 필요',
      confidence: 0.80,
      reasoning: '1억 이상 사업은 감사 대상이 되므로 명확한 성과 증빙이 필수',
      category: 'COMPLIANCE',
    });
  }

  needs.push({
    need: '사업 실패 시 책임 분산을 위한 검증된 업체 선호',
    confidence: 0.75,
    reasoning: '공무원은 사업 실패 책임을 지지 않기 위해 안전한 선택을 선호',
    category: 'RISK_AVERSION',
  });

  return needs;
}

// =============================================================================
// Layer 4: 전략 수립
// =============================================================================

export async function formulateStrategy(
  metadata: RFPMetadata,
  keywords: ExtractedKeywords,
  hiddenNeeds: HiddenNeed[]
): Promise<ProposalStrategy> {
  const startTime = Date.now();

  // 은닉 니즈 기반 전략 도출
  const keyMessages: string[] = [];
  const differentiators: string[] = [];
  const emphasizeStrengths: string[] = [];

  // 은닉 니즈별 대응 전략
  for (const need of hiddenNeeds) {
    switch (need.category) {
      case 'KPI_PRESSURE':
        keyMessages.push('수치화된 성과 지표 제공 (불량률, 정지시간 등)');
        emphasizeStrengths.push('ai-quality', 'predictive');
        break;
      case 'COMPLIANCE':
        keyMessages.push('Gov ZIP 기반 변조 탐지 가능 증빙 체계');
        emphasizeStrengths.push('data-security', 'gov-certified');
        break;
      case 'RISK_AVERSION':
        keyMessages.push('다수 유사 실적 및 정부 인증 보유');
        emphasizeStrengths.push('track-record', 'gov-certified');
        break;
      case 'BUDGET_JUSTIFICATION':
        keyMessages.push('MES 대비 99% 비용 절감, ROI 0.7개월');
        emphasizeStrengths.push('cost-reduction', 'roi-fast');
        break;
      case 'PUBLICITY':
        keyMessages.push('가시적 효과 (대시보드, 실시간 모니터링)');
        emphasizeStrengths.push('quick-results', 'ai-quality');
        break;
      default:
        break;
    }
  }

  // 기술 키워드 기반 차별화 포인트
  if (keywords.technical.some((k) => k.term.includes('AI') || k.term.includes('인공지능'))) {
    differentiators.push('AI 기반 품질 예측 및 예지보전');
  }
  if (keywords.technical.some((k) => k.term.includes('스마트') || k.term.includes('자동화'))) {
    differentiators.push('10분 플러그앤플레이 설치');
  }

  // 기본 차별화 포인트
  differentiators.push('MES 대비 1/100 비용');
  differentiators.push('설치 당일 데이터 수집 시작');

  console.log(`[Layer 4] Strategy formulation completed in ${Date.now() - startTime}ms`);

  // 핵심 메시지 생성
  const coreMessage = keyMessages.length > 0
    ? keyMessages[0]
    : 'Qetta의 OTT칩 + AI 예지보전으로 스마트공장 혁신';

  // 강조할 섹션 결정 (은닉 니즈 기반)
  const emphasisSections: string[] = ['UNDERSTANDING', 'SOLUTION'];
  if (hiddenNeeds.some(n => n.category === 'COMPLIANCE')) {
    emphasisSections.push('TEAM'); // 신뢰 섹션
  }
  if (hiddenNeeds.some(n => n.category === 'BUDGET_JUSTIFICATION')) {
    emphasisSections.push('COST_ROI');
  }

  return {
    overallApproach: `${metadata.organizationType} 대상 맞춤형 제안`,
    coreMessage,
    keyMessages: [...new Set(keyMessages)],
    differentiators: [...new Set(differentiators)],
    emphasisSections: [...new Set(emphasisSections)],
    riskMitigation: [
      '단계별 도입으로 리스크 최소화',
      '기술 지원 및 교육 포함',
      '성과 미달 시 환불 보장',
    ],
    emphasizeStrengths: [...new Set(emphasizeStrengths)].slice(0, 4),
    deemphasize: [],
  };
}

// =============================================================================
// 통합 분석 함수
// =============================================================================

export async function analyzeRFP(request: AnalyzeRequest): Promise<RFPAnalysisResult> {
  const rfpId = `rfp-${Date.now()}`;
  const startTime = Date.now();
  const timing: RFPAnalysisResult['processingTime'] = {
    layer1: 0,
    layer2a: 0,
    layer2b: 0,
    layer3: 0,
    layer4: 0,
    total: 0,
  };

  // Phase A: 병렬 실행 (Layer 1 + Layer 2a)
  const phaseAStart = Date.now();
  const [metadata, keywords] = await Promise.all([
    extractMetadata(request.rfpText),
    extractKeywords(request.rfpText),
  ]);
  timing.layer1 = Date.now() - phaseAStart;
  timing.layer2a = timing.layer1; // 병렬이므로 동일

  // Phase B: Layer 2b (pgvector)
  const phaseBStart = Date.now();
  const similarDocuments = request.options?.skipLayer2b
    ? []
    : await semanticMatch(keywords, request.options?.maxSimilarDocs);
  timing.layer2b = Date.now() - phaseBStart;

  // Phase C: Layer 3 (Claude API)
  const phaseCStart = Date.now();
  const hiddenNeeds = request.options?.skipLayer3
    ? getMockHiddenNeeds(metadata)
    : await inferHiddenNeeds(metadata, keywords, similarDocuments);
  timing.layer3 = Date.now() - phaseCStart;

  // Phase D: Layer 4 (전략 수립)
  const phaseDStart = Date.now();
  const strategy = await formulateStrategy(metadata, keywords, hiddenNeeds);
  timing.layer4 = Date.now() - phaseDStart;

  timing.total = Date.now() - startTime;

  console.log(`[RFP Analyzer] Total analysis completed in ${timing.total}ms`);

  return {
    id: `analysis-${Date.now()}`,
    rfpId,
    metadata,
    keywords,
    similarDocuments,
    hiddenNeeds,
    strategy,
    analyzedAt: new Date().toISOString(),
    processingTime: timing,
  };
}
