/**
 * Bid Document Generator - 입찰 분석 결과 → 문서 변환
 * Integrates analyzers with document builders
 */

import { DocxBuilder, type DocxContent, type DocxSection } from './docx-builder';
import { XlsxBuilder, type QuotationData, type QuotationItem } from './xlsx-builder';
import { PptxBuilder, type ProposalPptData, type PptSection } from './pptx-builder';
import type { BuildResult } from './index';
import type { Bid, BidAnalysis, Recommendation } from '../tender/types';
import type { FitScore, FitScoreBreakdown } from '../tender/analyzers/fit-scorer';
import type {
  CompetitorAnalysis,
  MarketInsight,
  StrategyRecommendation,
} from '../tender/analyzers/competitor-analyzer';
import type { CompanyProfile } from '../tender/analyzers/bid-analyzer';

export interface BidDocumentInput {
  bid: Bid;
  analysis: BidAnalysis;
  fitScore?: FitScore;
  competitorAnalysis?: CompetitorAnalysis;
  companyProfile: CompanyProfile;
}

export interface GeneratedDocuments {
  proposal?: BuildResult;
  quotation?: BuildResult;
  presentation?: BuildResult;
}

/**
 * Generate all bid documents from analysis results
 */
export async function generateBidDocuments(
  input: BidDocumentInput,
  options: {
    outputDir: string;
    generateProposal?: boolean;
    generateQuotation?: boolean;
    generatePresentation?: boolean;
  }
): Promise<GeneratedDocuments> {
  const results: GeneratedDocuments = {};
  const { outputDir, generateProposal = true, generateQuotation = true, generatePresentation = true } = options;

  const baseName = sanitizeFileName(input.bid.title);

  if (generateProposal) {
    results.proposal = await generateProposalDocument(input, `${outputDir}/${baseName}_제안서.docx`);
  }

  if (generateQuotation && input.bid.budget) {
    results.quotation = await generateQuotationDocument(input, `${outputDir}/${baseName}_견적서.xlsx`);
  }

  if (generatePresentation) {
    results.presentation = await generatePresentationDocument(input, `${outputDir}/${baseName}_발표자료.pptx`);
  }

  return results;
}

/**
 * Generate proposal DOCX document
 */
export async function generateProposalDocument(
  input: BidDocumentInput,
  outputPath: string
): Promise<BuildResult> {
  const { bid, analysis, fitScore, competitorAnalysis, companyProfile } = input;

  const sections: DocxSection[] = [];

  // 1. 사업 개요
  sections.push({
    title: '사업 개요',
    level: 1,
    pageBreak: true,
    content: bid.description || '본 사업은 ' + bid.title + '에 관한 것입니다.',
    table: {
      headers: ['항목', '내용'],
      rows: [
        ['사업명', bid.title],
        ['공고번호', bid.external_id],
        ['예산', bid.budget ? formatCurrency(bid.budget) : '미정'],
        ['마감일', bid.deadline ? formatDate(bid.deadline) : '미정'],
        ['발주처', getSourceName(bid.source)],
      ],
    },
  });

  // 2. 회사 소개
  sections.push({
    title: '회사 소개',
    level: 1,
    content: `${companyProfile.company_name || '당사'}는 ${companyProfile.experience_years}년의 경력과 ${companyProfile.past_wins}건의 성공적인 프로젝트 수행 실적을 보유하고 있습니다.`,
    bullets: [
      `경력: ${companyProfile.experience_years}년`,
      `수주 실적: ${companyProfile.past_wins}건`,
      `매출: ${formatCurrency(companyProfile.revenue)}`,
      `직원 수: ${companyProfile.employee_count || '미공개'}명`,
      `보유 인증: ${companyProfile.certifications.join(', ') || '없음'}`,
    ],
  });

  // 3. 적합도 분석
  if (fitScore) {
    sections.push({
      title: '적합도 분석',
      level: 1,
      content: `본 사업에 대한 당사의 적합도 점수는 ${fitScore.overall}점(${fitScore.grade}등급)입니다.`,
      table: {
        headers: ['평가 항목', '점수', '비고'],
        rows: [
          ['자격 요건', `${fitScore.breakdown.qualifications}점`, '충족 여부'],
          ['재정 적합도', `${fitScore.breakdown.financial}점`, '사업 규모 대비'],
          ['경험/실적', `${fitScore.breakdown.experience}점`, '관련 경력'],
          ['전문분야', `${fitScore.breakdown.specialization}점`, '기술 매칭'],
          ['일정', `${fitScore.breakdown.timing}점`, '마감 여유'],
          ['경쟁 우위', `${fitScore.breakdown.competition}점`, '시장 포지션'],
        ],
      },
    });
  }

  // 4. 자격 요건 검토
  if (analysis.qualifications_met.length > 0) {
    sections.push({
      title: '자격 요건 검토',
      level: 1,
      table: {
        headers: ['요건', '충족 여부', '비고'],
        rows: analysis.qualifications_met.map((q) => [
          q.requirement,
          q.met ? '✓ 충족' : '✗ 미충족',
          q.note || '',
        ]),
      },
    });
  }

  // 5. 경쟁 분석
  if (competitorAnalysis) {
    sections.push({
      title: '시장 및 경쟁 분석',
      level: 1,
      content: `경쟁 강도: ${getCompetitionLevelText(competitorAnalysis.competition_level)}\n예상 경쟁업체 수: ${competitorAnalysis.estimated_competitors}개사`,
      bullets: competitorAnalysis.market_insights.map(
        (insight) => `[${insight.type.toUpperCase()}] ${insight.content}`
      ),
    });

    if (competitorAnalysis.competitor_profiles.length > 0) {
      sections.push({
        title: '주요 경쟁사 프로필',
        level: 2,
        table: {
          headers: ['유형', '강점', '전문분야', '예상 승률'],
          rows: competitorAnalysis.competitor_profiles.map((c) => [
            c.name,
            c.strength === 'strong' ? '강함' : c.strength === 'medium' ? '보통' : '약함',
            c.specializations.join(', '),
            `${Math.round(c.estimatedWinRate * 100)}%`,
          ]),
        },
      });
    }
  }

  // 6. 전략 제안
  if (competitorAnalysis?.strategy_recommendations.length) {
    sections.push({
      title: '전략 제안',
      level: 1,
      bullets: competitorAnalysis.strategy_recommendations.map(
        (s) => `[${s.priority.toUpperCase()}] ${s.strategy}: ${s.description}`
      ),
    });
  }

  // 7. SWOT 분석 (recommendations)
  if (analysis.recommendations.length > 0) {
    const swot = categorizeRecommendations(analysis.recommendations);
    sections.push({
      title: 'SWOT 분석',
      level: 1,
      content: '당사의 강점, 약점, 기회, 위협 요소를 분석하였습니다.',
    });

    if (swot.strengths.length > 0) {
      sections.push({
        title: '강점 (Strengths)',
        level: 2,
        bullets: swot.strengths,
      });
    }

    if (swot.weaknesses.length > 0) {
      sections.push({
        title: '약점 (Weaknesses)',
        level: 2,
        bullets: swot.weaknesses,
      });
    }

    if (swot.opportunities.length > 0) {
      sections.push({
        title: '기회 (Opportunities)',
        level: 2,
        bullets: swot.opportunities,
      });
    }

    if (swot.threats.length > 0) {
      sections.push({
        title: '위협 (Threats)',
        level: 2,
        bullets: swot.threats,
      });
    }
  }

  // 8. 필요 서류
  if (analysis.required_documents.length > 0) {
    sections.push({
      title: '제출 서류 체크리스트',
      level: 1,
      table: {
        headers: ['서류명', '필수 여부', '포맷', '마감일'],
        rows: analysis.required_documents.map((d) => [
          d.name,
          d.mandatory ? '필수' : '선택',
          d.format.join(', '),
          d.deadline ? formatDate(d.deadline) : '-',
        ]),
      },
    });
  }

  // 9. 결론
  sections.push({
    title: '결론',
    level: 1,
    pageBreak: true,
    content: generateConclusion(input),
  });

  const docContent: DocxContent = {
    title: bid.title,
    subtitle: '입찰 제안서',
    company: {
      name: companyProfile.company_name || 'Company',
      representative: companyProfile.business_number,
    },
    sections,
  };

  const builder = new DocxBuilder({ company: companyProfile.company_name });
  return builder.createProposal(docContent).save(outputPath);
}

/**
 * Generate quotation XLSX document
 */
export async function generateQuotationDocument(
  input: BidDocumentInput,
  outputPath: string
): Promise<BuildResult> {
  const { bid, companyProfile } = input;

  // 예산 기반 견적 항목 생성
  const items = generateQuotationItems(bid);

  const quotationData: QuotationData = {
    bidTitle: bid.title,
    bidNumber: bid.external_id,
    submissionDate: formatDate(new Date().toISOString()),
    validDays: 30,
    company: {
      name: companyProfile.company_name || 'Company',
      businessNumber: companyProfile.business_number,
    },
    items,
    notes: [
      '본 견적서는 입찰 참고용으로 실제 계약 조건에 따라 변동될 수 있습니다.',
      '유효기간 내 발주 시 동일 조건 적용됩니다.',
      '부가세 별도입니다.',
    ],
  };

  const builder = new XlsxBuilder({ company: companyProfile.company_name });
  return builder.createQuotation(quotationData).save(outputPath);
}

/**
 * Generate presentation PPTX document
 */
export async function generatePresentationDocument(
  input: BidDocumentInput,
  outputPath: string
): Promise<BuildResult> {
  const { bid, analysis, fitScore, competitorAnalysis, companyProfile } = input;

  const sections: PptSection[] = [];

  // 1. 회사 소개
  sections.push({
    title: '회사 소개',
    content: `${companyProfile.company_name || '당사'}는 ${companyProfile.experience_years}년의 업력을 보유한 전문 기업입니다.`,
    bullets: [
      `경력 ${companyProfile.experience_years}년`,
      `성공 프로젝트 ${companyProfile.past_wins}건`,
      `연매출 ${formatCurrency(companyProfile.revenue)}`,
      `보유 인증: ${companyProfile.certifications.slice(0, 3).join(', ')}`,
    ],
  });

  // 2. 사업 이해
  sections.push({
    title: '사업 이해',
    content: bid.description || bid.title,
    table: {
      headers: ['항목', '내용'],
      rows: [
        ['예산', bid.budget ? formatCurrency(bid.budget) : '미정'],
        ['마감', bid.deadline ? formatDate(bid.deadline) : '미정'],
        ['발주처', getSourceName(bid.source)],
      ],
    },
  });

  // 3. 적합도 분석
  if (fitScore) {
    sections.push({
      title: '적합도 분석',
      content: `종합 점수: ${fitScore.overall}점 (${fitScore.grade}등급)`,
      chart: {
        type: 'bar',
        title: '항목별 점수',
        labels: ['자격', '재정', '경험', '전문성', '일정', '경쟁'],
        data: [
          fitScore.breakdown.qualifications,
          fitScore.breakdown.financial,
          fitScore.breakdown.experience,
          fitScore.breakdown.specialization,
          fitScore.breakdown.timing,
          fitScore.breakdown.competition,
        ],
      },
    });
  }

  // 4. 경쟁 분석
  if (competitorAnalysis) {
    sections.push({
      title: '시장 분석',
      content: `경쟁 강도: ${getCompetitionLevelText(competitorAnalysis.competition_level)}`,
      bullets: [
        `예상 경쟁업체: ${competitorAnalysis.estimated_competitors}개사`,
        ...competitorAnalysis.market_insights
          .filter((i) => i.confidence === 'high')
          .slice(0, 3)
          .map((i) => i.content),
      ],
    });
  }

  // 5. 핵심 강점
  const strengths = analysis.recommendations.filter((r) => r.type === 'strength');
  if (strengths.length > 0) {
    sections.push({
      title: '핵심 강점',
      bullets: strengths.slice(0, 5).map((s) => s.content),
    });
  }

  // 6. 수행 전략
  if (competitorAnalysis?.strategy_recommendations.length) {
    const highPriority = competitorAnalysis.strategy_recommendations.filter(
      (s) => s.priority === 'high'
    );
    sections.push({
      title: '수행 전략',
      bullets: highPriority.slice(0, 5).map((s) => `${s.strategy}: ${s.description}`),
    });
  }

  // 7. 기대 효과
  sections.push({
    title: '기대 효과',
    bullets: [
      `예상 수주 확률: ${analysis.win_probability}%`,
      fitScore ? `적합도 등급: ${fitScore.grade}` : null,
      '검증된 기술력과 실적으로 성공적 수행 보장',
      '신속한 대응 체계 및 사후 지원',
    ].filter((b): b is string => b !== null),
  });

  const pptData: ProposalPptData = {
    title: bid.title,
    subtitle: '입찰 제안 발표',
    date: formatDate(new Date().toISOString()),
    sections,
    contact: {
      company: companyProfile.company_name || 'Company',
      name: '담당자',
      email: 'contact@company.com',
    },
  };

  const builder = new PptxBuilder({ company: companyProfile.company_name });
  return builder.createProposal(pptData).save(outputPath);
}

// Helper functions

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${Math.round(amount / 10000)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function getSourceName(source: string): string {
  const names: Record<string, string> = {
    g2b: '나라장터',
    ungm: 'UN Global Marketplace',
    sam: 'SAM.gov (미국)',
    kz: '카자흐스탄 공공조달',
  };
  return names[source] || source;
}

function getCompetitionLevelText(level: string): string {
  const levels: Record<string, string> = {
    high: '높음 - 치열한 경쟁 예상',
    medium: '보통 - 적정 경쟁 수준',
    low: '낮음 - 유리한 경쟁 환경',
  };
  return levels[level] || level;
}

function categorizeRecommendations(recommendations: Recommendation[]): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
} {
  return {
    strengths: recommendations.filter((r) => r.type === 'strength').map((r) => r.content),
    weaknesses: recommendations.filter((r) => r.type === 'weakness').map((r) => r.content),
    opportunities: recommendations.filter((r) => r.type === 'opportunity').map((r) => r.content),
    threats: recommendations.filter((r) => r.type === 'threat').map((r) => r.content),
  };
}

function generateQuotationItems(bid: Bid): QuotationItem[] {
  if (!bid.budget) return [];

  const title = bid.title.toLowerCase();

  // 기본 항목 구성
  const items: QuotationItem[] = [];

  // 스마트팩토리/시스템 관련
  if (/스마트|시스템|플랫폼|솔루션/.test(title)) {
    const systemCost = Math.round(bid.budget * 0.4);
    items.push({
      name: '시스템 구축',
      spec: '맞춤형 솔루션',
      quantity: 1,
      unit: '식',
      unitPrice: systemCost,
    });
  }

  // 하드웨어/장비
  if (/장비|설비|하드웨어|센서|iot/.test(title)) {
    const hwCost = Math.round(bid.budget * 0.3);
    items.push({
      name: '하드웨어/장비',
      spec: '관련 장비 일체',
      quantity: 1,
      unit: '식',
      unitPrice: hwCost,
    });
  }

  // 소프트웨어
  if (/소프트웨어|sw|ai|빅데이터|클라우드/.test(title)) {
    const swCost = Math.round(bid.budget * 0.25);
    items.push({
      name: '소프트웨어 라이선스',
      spec: '1년 사용권',
      quantity: 1,
      unit: '식',
      unitPrice: swCost,
    });
  }

  // 기본 항목이 없으면 일반 항목 추가
  if (items.length === 0) {
    items.push({
      name: '용역 수행',
      spec: bid.title,
      quantity: 1,
      unit: '식',
      unitPrice: Math.round(bid.budget * 0.7),
    });
  }

  // 교육/컨설팅
  items.push({
    name: '교육 및 기술이전',
    spec: '사용자 교육',
    quantity: 1,
    unit: '식',
    unitPrice: Math.round(bid.budget * 0.1),
  });

  // 유지보수
  items.push({
    name: '유지보수',
    spec: '1년 무상 A/S',
    quantity: 1,
    unit: '식',
    unitPrice: Math.round(bid.budget * 0.1),
  });

  // 프로젝트 관리
  items.push({
    name: '프로젝트 관리',
    spec: 'PM 인건비',
    quantity: 1,
    unit: '식',
    unitPrice: Math.round(bid.budget * 0.1),
  });

  return items;
}

function generateConclusion(input: BidDocumentInput): string {
  const { bid, fitScore, analysis, companyProfile } = input;

  const lines = [
    `${companyProfile.company_name || '당사'}는 본 사업 "${bid.title}"에 최적화된 역량을 보유하고 있습니다.`,
    '',
  ];

  if (fitScore) {
    lines.push(`적합도 분석 결과, ${fitScore.overall}점(${fitScore.grade}등급)으로 평가되었으며,`);

    if (fitScore.grade === 'A' || fitScore.grade === 'B') {
      lines.push('높은 수준의 적합성을 보여 성공적인 사업 수행이 기대됩니다.');
    } else if (fitScore.grade === 'C') {
      lines.push('일부 보완이 필요하나 충분한 수행 역량을 갖추고 있습니다.');
    } else {
      lines.push('전략적 보완을 통해 사업 수행 역량을 강화하겠습니다.');
    }
  }

  lines.push('');
  lines.push(
    `${companyProfile.experience_years}년의 경험과 ${companyProfile.past_wins}건의 성공 실적을 바탕으로,`
  );
  lines.push('발주처의 기대에 부응하는 최상의 결과물을 제공하겠습니다.');
  lines.push('');
  lines.push('감사합니다.');

  return lines.join('\n');
}
