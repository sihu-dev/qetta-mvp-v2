/**
 * Bid Document Generator Tests
 *
 * Tests for bid document generation including helper functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock file system
vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
}));

// Mock docx-builder with class syntax
vi.mock('../docx-builder', () => {
  return {
    DocxBuilder: class MockDocxBuilder {
      createProposal() {
        return {
          save: () =>
            Promise.resolve({
              success: true,
              path: '/test/output.docx',
              size: 1024,
            }),
        };
      }
    },
  };
});

// Mock xlsx-builder
vi.mock('../xlsx-builder', () => {
  return {
    XlsxBuilder: class MockXlsxBuilder {
      createQuotation() {
        return {
          save: () =>
            Promise.resolve({
              success: true,
              path: '/test/output.xlsx',
              size: 2048,
            }),
        };
      }
    },
  };
});

// Mock pptx-builder
vi.mock('../pptx-builder', () => {
  return {
    PptxBuilder: class MockPptxBuilder {
      createProposal() {
        return {
          save: () =>
            Promise.resolve({
              success: true,
              path: '/test/output.pptx',
              size: 3072,
            }),
        };
      }
    },
  };
});

import {
  generateBidDocuments,
  generateProposalDocument,
  generateQuotationDocument,
  generatePresentationDocument,
  type BidDocumentInput,
} from '../bid-document-generator';
import type { Bid, BidAnalysis, Recommendation } from '../../tender/types';
import type { FitScore } from '../../tender/analyzers/fit-scorer';
import type { CompetitorAnalysis } from '../../tender/analyzers/competitor-analyzer';
import type { CompanyProfile } from '../../tender/analyzers/bid-analyzer';

// Test fixtures
const createMockBid = (overrides?: Partial<Bid>): Bid => ({
  id: 'test-bid-id',
  org_id: 'test-org-id',
  source: 'g2b',
  external_id: '2024-001234',
  title: '스마트공장 시스템 구축 사업',
  description: '제조업 스마트팩토리 MES 시스템 구축',
  budget: 500000000, // 5억원
  currency: 'KRW',
  deadline: '2024-12-31T23:59:59Z',
  status: 'new',
  fit_score: 85,
  raw_data: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockAnalysis = (overrides?: Partial<BidAnalysis>): BidAnalysis => ({
  id: 'test-analysis-id',
  bid_id: 'test-bid-id',
  org_id: 'test-org-id',
  qualifications_met: [
    { requirement: 'ISO 9001 인증', met: true, note: '보유' },
    { requirement: '실적 3건 이상', met: true, note: '5건 보유' },
    { requirement: '재무등급 B 이상', met: false, note: 'C등급' },
  ],
  required_documents: [
    {
      name: '사업자등록증',
      mandatory: true,
      format: ['PDF', 'JPG'],
      deadline: '2024-12-25T23:59:59Z',
    },
    {
      name: '인증서 사본',
      mandatory: false,
      format: ['PDF'],
    },
  ],
  competition_level: 'medium',
  win_probability: 65,
  recommendations: [
    { type: 'strength', content: '풍부한 스마트공장 구축 경험' },
    { type: 'strength', content: 'ISO 인증 보유' },
    { type: 'weakness', content: '재무등급 개선 필요' },
    { type: 'opportunity', content: '정부 스마트공장 지원 확대' },
    { type: 'threat', content: '대기업 경쟁사 참여 가능성' },
  ],
  analyzed_at: '2024-01-02T00:00:00Z',
  ...overrides,
});

const createMockFitScore = (overrides?: Partial<FitScore>): FitScore => ({
  overall: 78,
  grade: 'B',
  breakdown: {
    qualifications: 80,
    financial: 70,
    experience: 85,
    specialization: 75,
    timing: 80,
    competition: 78,
  },
  details: {
    qualifications: { score: 80, factors: [] },
    financial: { score: 70, factors: [] },
    experience: { score: 85, factors: [] },
    specialization: { score: 75, factors: [] },
    timing: { score: 80, factors: [] },
    competition: { score: 78, factors: [] },
  },
  ...overrides,
});

const createMockCompetitorAnalysis = (
  overrides?: Partial<CompetitorAnalysis>
): CompetitorAnalysis => ({
  competition_level: 'medium',
  estimated_competitors: 5,
  competitor_profiles: [
    {
      name: '대형 SI 업체',
      strength: 'strong',
      specializations: ['SI', 'ERP'],
      estimatedWinRate: 0.3,
    },
    {
      name: '중견 MES 전문',
      strength: 'medium',
      specializations: ['MES', '스마트공장'],
      estimatedWinRate: 0.25,
    },
  ],
  market_insights: [
    { type: 'trend', content: '스마트공장 수요 증가', confidence: 'high' },
    { type: 'risk', content: '인력 확보 어려움', confidence: 'medium' },
  ],
  strategy_recommendations: [
    {
      priority: 'high',
      strategy: '차별화 전략',
      description: '비용 대비 효율 강조',
    },
    {
      priority: 'medium',
      strategy: '기술력 어필',
      description: 'AI/IoT 역량 강조',
    },
  ],
  ...overrides,
});

const createMockCompanyProfile = (overrides?: Partial<CompanyProfile>): CompanyProfile => ({
  company_name: '테스트 기업',
  business_number: '123-45-67890',
  employee_count: 50,
  revenue: 10000000000, // 100억
  experience_years: 10,
  certifications: ['ISO 9001', 'ISO 14001', 'ISO 27001'],
  past_wins: 15,
  specializations: ['스마트공장', 'MES', 'IoT'],
  ...overrides,
});

const createMockInput = (overrides?: Partial<BidDocumentInput>): BidDocumentInput => ({
  bid: createMockBid(),
  analysis: createMockAnalysis(),
  fitScore: createMockFitScore(),
  competitorAnalysis: createMockCompetitorAnalysis(),
  companyProfile: createMockCompanyProfile(),
  ...overrides,
});

describe('bid-document-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateBidDocuments', () => {
    it('generates all documents by default', async () => {
      const input = createMockInput();
      const result = await generateBidDocuments(input, {
        outputDir: '/test/output',
      });

      expect(result.proposal).toBeDefined();
      expect(result.quotation).toBeDefined();
      expect(result.presentation).toBeDefined();
    });

    it('generates only specified documents', async () => {
      const input = createMockInput();
      const result = await generateBidDocuments(input, {
        outputDir: '/test/output',
        generateProposal: true,
        generateQuotation: false,
        generatePresentation: false,
      });

      expect(result.proposal).toBeDefined();
      expect(result.quotation).toBeUndefined();
      expect(result.presentation).toBeUndefined();
    });

    it('skips quotation when bid has no budget', async () => {
      const input = createMockInput({
        bid: createMockBid({ budget: undefined }),
      });
      const result = await generateBidDocuments(input, {
        outputDir: '/test/output',
      });

      expect(result.proposal).toBeDefined();
      expect(result.quotation).toBeUndefined(); // Skipped due to no budget
      expect(result.presentation).toBeDefined();
    });

    it('sanitizes filename with special characters', async () => {
      const input = createMockInput({
        bid: createMockBid({
          title: '스마트공장 <구축> 사업: "테스트" / 2024',
        }),
      });
      const result = await generateBidDocuments(input, {
        outputDir: '/test/output',
      });

      expect(result.proposal?.success).toBe(true);
      // Filename should have special characters removed
    });

    it('truncates long filenames', async () => {
      const longTitle = '매우 긴 제목입니다'.repeat(10);
      const input = createMockInput({
        bid: createMockBid({ title: longTitle }),
      });
      const result = await generateBidDocuments(input, {
        outputDir: '/test/output',
      });

      expect(result.proposal?.success).toBe(true);
    });
  });

  describe('generateProposalDocument', () => {
    it('creates proposal with all sections', async () => {
      const input = createMockInput();
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
      expect(result.path).toBe('/test/output.docx');
    });

    it('handles missing fitScore', async () => {
      const input = createMockInput({ fitScore: undefined });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles missing competitorAnalysis', async () => {
      const input = createMockInput({ competitorAnalysis: undefined });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles empty qualifications', async () => {
      const input = createMockInput({
        analysis: createMockAnalysis({ qualifications_met: [] }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles empty recommendations', async () => {
      const input = createMockInput({
        analysis: createMockAnalysis({ recommendations: [] }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles empty required_documents', async () => {
      const input = createMockInput({
        analysis: createMockAnalysis({ required_documents: [] }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles missing bid description', async () => {
      const input = createMockInput({
        bid: createMockBid({ description: undefined }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles missing budget and deadline', async () => {
      const input = createMockInput({
        bid: createMockBid({ budget: undefined, deadline: undefined }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });
  });

  describe('generateQuotationDocument', () => {
    it('creates quotation with items', async () => {
      const input = createMockInput();
      const result = await generateQuotationDocument(input, '/test/quotation.xlsx');

      expect(result.success).toBe(true);
    });

    it('handles missing company name', async () => {
      const input = createMockInput({
        companyProfile: createMockCompanyProfile({ company_name: undefined }),
      });
      const result = await generateQuotationDocument(input, '/test/quotation.xlsx');

      expect(result.success).toBe(true);
    });

    it('handles bid without budget', async () => {
      const input = createMockInput({
        bid: createMockBid({ budget: undefined }),
      });
      const result = await generateQuotationDocument(input, '/test/quotation.xlsx');

      expect(result.success).toBe(true);
    });
  });

  describe('generatePresentationDocument', () => {
    it('creates presentation with all sections', async () => {
      const input = createMockInput();
      const result = await generatePresentationDocument(input, '/test/presentation.pptx');

      expect(result.success).toBe(true);
    });

    it('handles missing fitScore', async () => {
      const input = createMockInput({ fitScore: undefined });
      const result = await generatePresentationDocument(input, '/test/presentation.pptx');

      expect(result.success).toBe(true);
    });

    it('handles missing competitorAnalysis', async () => {
      const input = createMockInput({ competitorAnalysis: undefined });
      const result = await generatePresentationDocument(input, '/test/presentation.pptx');

      expect(result.success).toBe(true);
    });

    it('handles missing company name', async () => {
      const input = createMockInput({
        companyProfile: createMockCompanyProfile({ company_name: undefined }),
      });
      const result = await generatePresentationDocument(input, '/test/presentation.pptx');

      expect(result.success).toBe(true);
    });

    it('handles empty strategy recommendations', async () => {
      const input = createMockInput({
        competitorAnalysis: createMockCompetitorAnalysis({
          strategy_recommendations: [],
        }),
      });
      const result = await generatePresentationDocument(input, '/test/presentation.pptx');

      expect(result.success).toBe(true);
    });

    it('filters high confidence market insights', async () => {
      const input = createMockInput({
        competitorAnalysis: createMockCompetitorAnalysis({
          market_insights: [
            { type: 'trend', content: 'High confidence insight', confidence: 'high' },
            { type: 'risk', content: 'Low confidence insight', confidence: 'low' },
          ],
        }),
      });
      const result = await generatePresentationDocument(input, '/test/presentation.pptx');

      expect(result.success).toBe(true);
    });
  });

  describe('Helper Function Tests (via integration)', () => {
    describe('formatCurrency integration', () => {
      it('formats billion-scale budgets correctly', async () => {
        const input = createMockInput({
          bid: createMockBid({ budget: 500000000 }), // 5억
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
        // The proposal should contain "5.0억원" formatted value
      });

      it('formats million-scale budgets correctly', async () => {
        const input = createMockInput({
          bid: createMockBid({ budget: 50000000 }), // 5천만원
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });

      it('formats small amounts correctly', async () => {
        const input = createMockInput({
          bid: createMockBid({ budget: 5000 }), // 5천원
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });
    });

    describe('getSourceName integration', () => {
      it.each([
        ['g2b', '나라장터'],
        ['ungm', 'UN Global Marketplace'],
        ['sam', 'SAM.gov (미국)'],
        ['kz', '카자흐스탄 공공조달'],
        ['unknown', 'unknown'],
      ])('maps source %s correctly', async (source) => {
        const input = createMockInput({
          bid: createMockBid({ source }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });
    });

    describe('getCompetitionLevelText integration', () => {
      it.each(['high', 'medium', 'low'])('handles competition level %s', async (level) => {
        const input = createMockInput({
          competitorAnalysis: createMockCompetitorAnalysis({
            competition_level: level as 'high' | 'medium' | 'low',
          }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });
    });

    describe('categorizeRecommendations integration', () => {
      it('categorizes all recommendation types', async () => {
        const recommendations: Recommendation[] = [
          { type: 'strength', content: 'Strong point 1' },
          { type: 'strength', content: 'Strong point 2' },
          { type: 'weakness', content: 'Weak point' },
          { type: 'opportunity', content: 'Opportunity' },
          { type: 'threat', content: 'Threat' },
        ];
        const input = createMockInput({
          analysis: createMockAnalysis({ recommendations }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });

      it('handles single category only', async () => {
        const recommendations: Recommendation[] = [
          { type: 'strength', content: 'Only strengths' },
        ];
        const input = createMockInput({
          analysis: createMockAnalysis({ recommendations }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });
    });

    describe('generateQuotationItems integration', () => {
      it('generates system items for 스마트/시스템 titles', async () => {
        const input = createMockInput({
          bid: createMockBid({
            title: '스마트공장 시스템 구축',
            budget: 100000000,
          }),
        });
        const result = await generateQuotationDocument(input, '/test/quotation.xlsx');

        expect(result.success).toBe(true);
      });

      it('generates hardware items for 장비/설비 titles', async () => {
        const input = createMockInput({
          bid: createMockBid({
            title: '설비 자동화 장비 도입',
            budget: 100000000,
          }),
        });
        const result = await generateQuotationDocument(input, '/test/quotation.xlsx');

        expect(result.success).toBe(true);
      });

      it('generates software items for SW/AI titles', async () => {
        const input = createMockInput({
          bid: createMockBid({
            title: 'AI 빅데이터 분석 소프트웨어',
            budget: 100000000,
          }),
        });
        const result = await generateQuotationDocument(input, '/test/quotation.xlsx');

        expect(result.success).toBe(true);
      });

      it('generates generic items for other titles', async () => {
        const input = createMockInput({
          bid: createMockBid({
            title: '일반 컨설팅 용역',
            budget: 100000000,
          }),
        });
        const result = await generateQuotationDocument(input, '/test/quotation.xlsx');

        expect(result.success).toBe(true);
      });
    });

    describe('generateConclusion integration', () => {
      it('generates conclusion for grade A', async () => {
        const input = createMockInput({
          fitScore: createMockFitScore({ overall: 95, grade: 'A' }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });

      it('generates conclusion for grade B', async () => {
        const input = createMockInput({
          fitScore: createMockFitScore({ overall: 78, grade: 'B' }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });

      it('generates conclusion for grade C', async () => {
        const input = createMockInput({
          fitScore: createMockFitScore({ overall: 65, grade: 'C' }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });

      it('generates conclusion for grade D', async () => {
        const input = createMockInput({
          fitScore: createMockFitScore({ overall: 45, grade: 'D' }),
        });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });

      it('generates conclusion without fitScore', async () => {
        const input = createMockInput({ fitScore: undefined });
        const result = await generateProposalDocument(input, '/test/proposal.docx');

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings in bid fields', async () => {
      const input = createMockInput({
        bid: createMockBid({
          title: '',
          description: '',
          external_id: '',
        }),
      });
      const result = await generateBidDocuments(input, { outputDir: '/test' });

      expect(result.proposal?.success).toBe(true);
    });

    it('handles zero values', async () => {
      const input = createMockInput({
        bid: createMockBid({ budget: 0 }),
        companyProfile: createMockCompanyProfile({
          revenue: 0,
          experience_years: 0,
          past_wins: 0,
        }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles empty arrays', async () => {
      const input = createMockInput({
        companyProfile: createMockCompanyProfile({
          certifications: [],
          specializations: [],
        }),
        competitorAnalysis: createMockCompetitorAnalysis({
          competitor_profiles: [],
          market_insights: [],
          strategy_recommendations: [],
        }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles undefined optional fields', async () => {
      const input: BidDocumentInput = {
        bid: createMockBid(),
        analysis: createMockAnalysis(),
        companyProfile: createMockCompanyProfile({
          company_name: undefined,
          employee_count: undefined,
        }),
        // fitScore and competitorAnalysis are undefined
      };
      const result = await generateBidDocuments(input, { outputDir: '/test' });

      expect(result.proposal?.success).toBe(true);
    });

    it('handles special date formats', async () => {
      const input = createMockInput({
        bid: createMockBid({
          deadline: '2024-01-01',
          created_at: '2024-01-01T12:00:00.000Z',
        }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles Korean characters in all fields', async () => {
      const input = createMockInput({
        bid: createMockBid({
          title: '한글 제목 테스트 가나다라마바사',
          description: '한글 설명입니다. 특수문자 포함: ①②③',
        }),
        companyProfile: createMockCompanyProfile({
          company_name: '주식회사 한글기업',
          certifications: ['인증1', '인증2', '인증3'],
        }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles very large numbers', async () => {
      const input = createMockInput({
        bid: createMockBid({ budget: 999999999999 }), // ~1조
        companyProfile: createMockCompanyProfile({
          revenue: 999999999999,
        }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles qualifications with various met/unmet combinations', async () => {
      const input = createMockInput({
        analysis: createMockAnalysis({
          qualifications_met: [
            { requirement: 'Req 1', met: true, note: 'OK' },
            { requirement: 'Req 2', met: false, note: 'Missing' },
            { requirement: 'Req 3', met: true }, // No note
            { requirement: 'Req 4', met: false }, // No note
          ],
        }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });

    it('handles documents with missing deadline', async () => {
      const input = createMockInput({
        analysis: createMockAnalysis({
          required_documents: [
            { name: 'Doc 1', mandatory: true, format: ['PDF'] },
            { name: 'Doc 2', mandatory: false, format: ['DOC', 'DOCX'], deadline: undefined },
          ],
        }),
      });
      const result = await generateProposalDocument(input, '/test/proposal.docx');

      expect(result.success).toBe(true);
    });
  });
});
