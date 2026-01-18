import { describe, it, expect } from 'vitest';
import {
  calculateFitScore,
  getRecommendationText,
  calculateBatchFitScores,
  rankBidsByFit,
} from '../fit-scorer';
import type { Bid, BidAnalysis } from '../../types';
import type { CompanyProfile } from '../bid-analyzer';

// Test fixtures
const createMockBid = (overrides: Partial<Bid> = {}): Bid => ({
  id: 'test-bid-1',
  org_id: 'org-1',
  source: 'g2b',
  external_id: 'ext-1',
  title: '스마트팩토리 MES 시스템 구축',
  description: 'AI 기반 제조실행시스템 도입',
  budget: 100000000, // 1억원
  currency: 'KRW',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  status: 'new',
  fit_score: null,
  raw_data: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createMockProfile = (overrides: Partial<CompanyProfile> = {}): CompanyProfile => ({
  certifications: ['ISO9001', 'ISO27001'],
  experience_years: 10,
  past_wins: 15,
  revenue: 500000000, // 5억원
  employee_count: 50,
  specializations: ['스마트팩토리', 'MES', 'AI'],
  ...overrides,
});

const createMockAnalysis = (overrides: Partial<BidAnalysis> = {}): BidAnalysis => ({
  id: 'analysis-1',
  bid_id: 'test-bid-1',
  org_id: 'org-1',
  qualifications_met: [
    { requirement: '사업자등록증', met: true },
    { requirement: 'ISO인증', met: true },
    { requirement: '5년 경력', met: true },
  ],
  required_documents: [],
  competition_level: 'medium',
  win_probability: 60,
  recommendations: [],
  analyzed_at: new Date().toISOString(),
  ...overrides,
});

describe('fit-scorer', () => {
  describe('calculateFitScore', () => {
    it('calculates fit score with default values', () => {
      const bid = createMockBid();
      const profile = createMockProfile();

      const result = calculateFitScore(bid, profile);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('recommendation');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('returns higher score for well-matched company', () => {
      const bid = createMockBid({
        title: '스마트팩토리 AI 시스템 구축',
        description: 'MES와 AI 기반 제조실행시스템',
        budget: 100000000,
      });
      const profile = createMockProfile({
        experience_years: 15,
        past_wins: 25,
        revenue: 1000000000,
        specializations: ['스마트팩토리', 'AI', 'MES', 'IoT'],
      });
      const analysis = createMockAnalysis({
        competition_level: 'low',
        win_probability: 80,
        qualifications_met: [
          { requirement: '자격1', met: true },
          { requirement: '자격2', met: true },
          { requirement: '자격3', met: true },
        ],
      });

      const result = calculateFitScore(bid, profile, analysis);

      expect(result.overall).toBeGreaterThan(70);
      expect(['A', 'B']).toContain(result.grade);
    });

    it('returns lower score for poorly matched company', () => {
      const bid = createMockBid({
        budget: 10000000000, // 100억 (very large)
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      });
      const profile = createMockProfile({
        experience_years: 1,
        past_wins: 0,
        revenue: 100000000,
        specializations: [],
      });
      const analysis = createMockAnalysis({
        competition_level: 'high',
        win_probability: 20,
        qualifications_met: [
          { requirement: '자격1', met: false },
          { requirement: '자격2', met: false },
        ],
      });

      const result = calculateFitScore(bid, profile, analysis);

      expect(result.overall).toBeLessThan(50);
      expect(['D', 'F']).toContain(result.grade);
    });

    it('calculates breakdown scores correctly', () => {
      const bid = createMockBid();
      const profile = createMockProfile();
      const analysis = createMockAnalysis();

      const result = calculateFitScore(bid, profile, analysis);

      expect(result.breakdown).toHaveProperty('qualifications');
      expect(result.breakdown).toHaveProperty('financial');
      expect(result.breakdown).toHaveProperty('experience');
      expect(result.breakdown).toHaveProperty('specialization');
      expect(result.breakdown).toHaveProperty('timing');
      expect(result.breakdown).toHaveProperty('competition');

      // All scores should be in valid range
      Object.values(result.breakdown).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('handles missing budget data', () => {
      const bid = createMockBid({ budget: null });
      const profile = createMockProfile();

      const result = calculateFitScore(bid, profile);

      expect(result.breakdown.financial).toBe(50); // Default value
    });

    it('handles missing deadline', () => {
      const bid = createMockBid({ deadline: null });
      const profile = createMockProfile();

      const result = calculateFitScore(bid, profile);

      expect(result.breakdown.timing).toBe(50); // Default value
    });
  });

  describe('grade assignment', () => {
    it('assigns grade A for scores >= 85', () => {
      const bid = createMockBid({
        budget: 100000000,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      });
      const profile = createMockProfile({
        experience_years: 15,
        past_wins: 30,
        revenue: 500000000,
        specializations: ['스마트팩토리', 'AI', 'MES'],
      });
      const analysis = createMockAnalysis({
        competition_level: 'low',
        win_probability: 90,
        qualifications_met: [
          { requirement: '자격1', met: true },
          { requirement: '자격2', met: true },
          { requirement: '자격3', met: true },
          { requirement: '자격4', met: true },
        ],
      });

      const result = calculateFitScore(bid, profile, analysis);

      if (result.overall >= 85) {
        expect(result.grade).toBe('A');
        expect(result.recommendation).toBe('strongly_recommend');
      }
    });

    it('assigns appropriate recommendation based on grade', () => {
      const gradeRecommendationMap: Record<string, string> = {
        A: 'strongly_recommend',
        B: 'recommend',
        C: 'consider',
        D: 'caution',
        F: 'not_recommend',
      };

      const bid = createMockBid();
      const profile = createMockProfile();
      const result = calculateFitScore(bid, profile);

      expect(gradeRecommendationMap[result.grade]).toBe(result.recommendation);
    });
  });

  describe('getRecommendationText', () => {
    it('returns correct text for strongly_recommend', () => {
      const text = getRecommendationText('strongly_recommend');
      expect(text).toContain('적극 권장');
    });

    it('returns correct text for recommend', () => {
      const text = getRecommendationText('recommend');
      expect(text).toContain('권장');
    });

    it('returns correct text for consider', () => {
      const text = getRecommendationText('consider');
      expect(text).toContain('검토 필요');
    });

    it('returns correct text for caution', () => {
      const text = getRecommendationText('caution');
      expect(text).toContain('주의 필요');
    });

    it('returns correct text for not_recommend', () => {
      const text = getRecommendationText('not_recommend');
      expect(text).toContain('비권장');
    });
  });

  describe('calculateBatchFitScores', () => {
    it('calculates scores for multiple bids', () => {
      const bids = [
        createMockBid({ id: 'bid-1' }),
        createMockBid({ id: 'bid-2', title: 'IoT 센서 모니터링 시스템' }),
        createMockBid({ id: 'bid-3', title: 'ERP 시스템 구축' }),
      ];
      const profile = createMockProfile();

      const results = calculateBatchFitScores(bids, profile);

      expect(results.size).toBe(3);
      expect(results.has('bid-1')).toBe(true);
      expect(results.has('bid-2')).toBe(true);
      expect(results.has('bid-3')).toBe(true);
    });

    it('uses analyses when provided', () => {
      const bids = [
        createMockBid({ id: 'bid-1' }),
        createMockBid({ id: 'bid-2' }),
      ];
      const profile = createMockProfile();
      const analyses = new Map<string, BidAnalysis>([
        ['bid-1', createMockAnalysis({ bid_id: 'bid-1', competition_level: 'low' })],
        ['bid-2', createMockAnalysis({ bid_id: 'bid-2', competition_level: 'high' })],
      ]);

      const results = calculateBatchFitScores(bids, profile, analyses);

      const score1 = results.get('bid-1')!;
      const score2 = results.get('bid-2')!;

      // Low competition should result in higher competition score
      expect(score1.breakdown.competition).toBeGreaterThan(score2.breakdown.competition);
    });
  });

  describe('rankBidsByFit', () => {
    it('ranks bids by overall score descending', () => {
      const bids = [
        createMockBid({ id: 'bid-low', budget: 10000000000, title: '일반 사업' }),
        createMockBid({ id: 'bid-high', budget: 100000000, title: '스마트팩토리 AI MES' }),
        createMockBid({ id: 'bid-mid', budget: 200000000, title: '클라우드 시스템' }),
      ];
      const profile = createMockProfile({
        specializations: ['스마트팩토리', 'AI', 'MES'],
      });

      const ranked = rankBidsByFit(bids, profile);

      expect(ranked.length).toBe(3);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].rank).toBe(3);

      // Verify scores are in descending order
      expect(ranked[0].score.overall).toBeGreaterThanOrEqual(ranked[1].score.overall);
      expect(ranked[1].score.overall).toBeGreaterThanOrEqual(ranked[2].score.overall);
    });

    it('returns empty array for empty bids', () => {
      const profile = createMockProfile();
      const ranked = rankBidsByFit([], profile);

      expect(ranked).toEqual([]);
    });
  });

  describe('financial score calculation', () => {
    it('gives high score for optimal budget ratio (10-30%)', () => {
      const bid = createMockBid({ budget: 100000000 }); // 1억
      const profile = createMockProfile({ revenue: 500000000 }); // 5억 (20% ratio)

      const result = calculateFitScore(bid, profile);

      expect(result.breakdown.financial).toBe(100);
    });

    it('gives lower score for too small budget (<5%)', () => {
      const bid = createMockBid({ budget: 10000000 }); // 1천만
      const profile = createMockProfile({ revenue: 1000000000 }); // 10억 (1% ratio)

      const result = calculateFitScore(bid, profile);

      expect(result.breakdown.financial).toBe(60);
    });

    it('gives lower score for too large budget (>70%)', () => {
      const bid = createMockBid({ budget: 900000000 }); // 9억
      const profile = createMockProfile({ revenue: 500000000 }); // 5억 (180% ratio)

      const result = calculateFitScore(bid, profile);

      // Formula: max(20, 100 - (ratio - 0.7) * 100) = max(20, 100 - 110) = 20
      expect(result.breakdown.financial).toBeLessThanOrEqual(30);
    });
  });

  describe('timing score calculation', () => {
    it('gives high score for optimal deadline (14-45 days)', () => {
      const bid = createMockBid({
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      const profile = createMockProfile();

      const result = calculateFitScore(bid, profile);

      expect(result.breakdown.timing).toBe(100);
    });

    it('gives low score for very short deadline (<3 days)', () => {
      const bid = createMockBid({
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      });
      const profile = createMockProfile();

      const result = calculateFitScore(bid, profile);

      expect(result.breakdown.timing).toBe(20);
    });
  });
});
