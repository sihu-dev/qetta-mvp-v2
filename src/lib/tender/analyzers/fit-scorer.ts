/**
 * Fit Scorer - 입찰 적합도 점수 계산기
 * Calculates how well a company fits a specific bid opportunity
 */

import type { Bid, BidAnalysis } from '../types';
import type { CompanyProfile } from './bid-analyzer';

export interface FitScore {
  overall: number; // 0-100
  breakdown: FitScoreBreakdown;
  grade: FitGrade;
  recommendation: FitRecommendation;
}

export interface FitScoreBreakdown {
  qualifications: number; // 0-100: 자격 요건 충족도
  financial: number; // 0-100: 재정 적합도
  experience: number; // 0-100: 경험/실적 적합도
  specialization: number; // 0-100: 전문분야 적합도
  timing: number; // 0-100: 일정 적합도
  competition: number; // 0-100: 경쟁 우위도
}

export type FitGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type FitRecommendation =
  | 'strongly_recommend' // A grade: 적극 권장
  | 'recommend' // B grade: 권장
  | 'consider' // C grade: 검토 필요
  | 'caution' // D grade: 주의 필요
  | 'not_recommend'; // F grade: 비권장

const WEIGHTS: Record<keyof FitScoreBreakdown, number> = {
  qualifications: 0.30, // 30%
  financial: 0.20, // 20%
  experience: 0.15, // 15%
  specialization: 0.15, // 15%
  timing: 0.10, // 10%
  competition: 0.10, // 10%
};

/**
 * Calculate comprehensive fit score for a bid
 */
export function calculateFitScore(
  bid: Bid,
  profile: CompanyProfile,
  analysis?: BidAnalysis
): FitScore {
  const breakdown = calculateBreakdown(bid, profile, analysis);
  const overall = calculateOverallScore(breakdown);
  const grade = scoreToGrade(overall);
  const recommendation = gradeToRecommendation(grade);

  return {
    overall,
    breakdown,
    grade,
    recommendation,
  };
}

/**
 * Calculate individual score components
 */
function calculateBreakdown(
  bid: Bid,
  profile: CompanyProfile,
  analysis?: BidAnalysis
): FitScoreBreakdown {
  return {
    qualifications: calculateQualificationScore(analysis),
    financial: calculateFinancialScore(bid, profile),
    experience: calculateExperienceScore(bid, profile),
    specialization: calculateSpecializationScore(bid, profile),
    timing: calculateTimingScore(bid),
    competition: calculateCompetitionScore(analysis),
  };
}

/**
 * Calculate qualification score from analysis
 */
function calculateQualificationScore(analysis?: BidAnalysis): number {
  if (!analysis || analysis.qualifications_met.length === 0) {
    return 50; // Default when no analysis available
  }

  const metCount = analysis.qualifications_met.filter((q) => q.met).length;
  const totalCount = analysis.qualifications_met.length;

  return Math.round((metCount / totalCount) * 100);
}

/**
 * Calculate financial fit score
 */
function calculateFinancialScore(bid: Bid, profile: CompanyProfile): number {
  if (!bid.budget || !profile.revenue) {
    return 50; // Default when data missing
  }

  const budgetRatio = bid.budget / profile.revenue;

  // Optimal ratio: 10-30% of revenue
  if (budgetRatio >= 0.1 && budgetRatio <= 0.3) {
    return 100;
  }
  // Acceptable: 5-10% or 30-50%
  if (budgetRatio >= 0.05 && budgetRatio < 0.1) {
    return 80;
  }
  if (budgetRatio > 0.3 && budgetRatio <= 0.5) {
    return 75;
  }
  // Risky: <5% (too small) or 50-70% (too large)
  if (budgetRatio < 0.05) {
    return 60; // Project too small to be strategic
  }
  if (budgetRatio > 0.5 && budgetRatio <= 0.7) {
    return 50; // Project may strain resources
  }
  // Dangerous: >70% of revenue
  return Math.max(20, 100 - (budgetRatio - 0.7) * 100);
}

/**
 * Calculate experience fit score
 */
function calculateExperienceScore(bid: Bid, profile: CompanyProfile): number {
  let score = 50; // Base score

  // Years of experience factor
  if (profile.experience_years >= 10) {
    score += 25;
  } else if (profile.experience_years >= 5) {
    score += 15;
  } else if (profile.experience_years >= 3) {
    score += 5;
  } else {
    score -= 10;
  }

  // Past wins factor
  if (profile.past_wins >= 20) {
    score += 25;
  } else if (profile.past_wins >= 10) {
    score += 15;
  } else if (profile.past_wins >= 5) {
    score += 10;
  } else if (profile.past_wins >= 1) {
    score += 5;
  }

  // Source-specific experience bonus
  const title = bid.title.toLowerCase();
  if (bid.source === 'g2b' && /공공|정부|국가/.test(title)) {
    score += 10; // Bonus for public sector experience
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate specialization match score
 */
function calculateSpecializationScore(bid: Bid, profile: CompanyProfile): number {
  if (!profile.specializations || profile.specializations.length === 0) {
    return 50; // Default when no specializations defined
  }

  const bidText = `${bid.title} ${bid.description || ''}`.toLowerCase();
  let matchScore = 0;
  let matchCount = 0;

  // Keywords to check
  const keywordGroups = [
    { keywords: ['스마트팩토리', 'smart factory', 'mes', '제조실행'], weight: 2 },
    { keywords: ['ai', '인공지능', 'ml', '머신러닝'], weight: 2 },
    { keywords: ['iot', '사물인터넷', '센서', '모니터링'], weight: 1.5 },
    { keywords: ['클라우드', 'cloud', 'saas', 'paas'], weight: 1.5 },
    { keywords: ['빅데이터', 'big data', '데이터분석', 'analytics'], weight: 1.5 },
    { keywords: ['erp', 'scm', '물류', '공급망'], weight: 1 },
    { keywords: ['품질', 'quality', '검사', 'inspection'], weight: 1 },
    { keywords: ['자동화', 'automation', '로봇', 'robot'], weight: 1 },
  ];

  for (const group of keywordGroups) {
    const bidHasKeyword = group.keywords.some((k) => bidText.includes(k));
    const profileHasKeyword = profile.specializations.some((s) =>
      group.keywords.some((k) => s.toLowerCase().includes(k))
    );

    if (bidHasKeyword && profileHasKeyword) {
      matchScore += 20 * group.weight;
      matchCount++;
    } else if (bidHasKeyword && !profileHasKeyword) {
      matchScore -= 5; // Penalty for missing required specialization
    }
  }

  // Bonus for multiple matches
  if (matchCount >= 3) {
    matchScore += 15;
  }

  return Math.min(100, Math.max(0, 50 + matchScore));
}

/**
 * Calculate timing fit score
 */
function calculateTimingScore(bid: Bid): number {
  if (!bid.deadline) {
    return 50; // Default when no deadline
  }

  const daysUntilDeadline = Math.floor(
    (new Date(bid.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Optimal: 14-45 days
  if (daysUntilDeadline >= 14 && daysUntilDeadline <= 45) {
    return 100;
  }
  // Good: 7-14 days or 45-60 days
  if (daysUntilDeadline >= 7 && daysUntilDeadline < 14) {
    return 80;
  }
  if (daysUntilDeadline > 45 && daysUntilDeadline <= 60) {
    return 85;
  }
  // Risky: <7 days (rush) or >60 days (might change)
  if (daysUntilDeadline >= 3 && daysUntilDeadline < 7) {
    return 50;
  }
  if (daysUntilDeadline > 60 && daysUntilDeadline <= 90) {
    return 70;
  }
  // Critical: <3 days
  if (daysUntilDeadline < 3) {
    return 20;
  }
  // Too far: >90 days
  return 60;
}

/**
 * Calculate competition advantage score
 */
function calculateCompetitionScore(analysis?: BidAnalysis): number {
  if (!analysis) {
    return 50; // Default
  }

  // Base on competition level
  const competitionBase =
    analysis.competition_level === 'low'
      ? 90
      : analysis.competition_level === 'medium'
        ? 60
        : 30;

  // Adjust by win probability
  const winProbBonus = (analysis.win_probability - 50) * 0.2;

  return Math.min(100, Math.max(0, competitionBase + winProbBonus));
}

/**
 * Calculate weighted overall score
 */
function calculateOverallScore(breakdown: FitScoreBreakdown): number {
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    weightedSum += breakdown[key as keyof FitScoreBreakdown] * weight;
  }

  return Math.round(weightedSum);
}

/**
 * Convert score to letter grade
 */
function scoreToGrade(score: number): FitGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Convert grade to recommendation
 */
function gradeToRecommendation(grade: FitGrade): FitRecommendation {
  switch (grade) {
    case 'A':
      return 'strongly_recommend';
    case 'B':
      return 'recommend';
    case 'C':
      return 'consider';
    case 'D':
      return 'caution';
    case 'F':
      return 'not_recommend';
  }
}

/**
 * Get human-readable recommendation text
 */
export function getRecommendationText(recommendation: FitRecommendation): string {
  switch (recommendation) {
    case 'strongly_recommend':
      return '적극 권장 - 높은 적합도, 입찰 참여를 강력히 권장합니다';
    case 'recommend':
      return '권장 - 양호한 적합도, 입찰 참여를 권장합니다';
    case 'consider':
      return '검토 필요 - 일부 리스크 존재, 신중한 검토 후 결정하세요';
    case 'caution':
      return '주의 필요 - 적합도 낮음, 전략적 판단 필요';
    case 'not_recommend':
      return '비권장 - 적합도 매우 낮음, 다른 기회 탐색을 권장합니다';
  }
}

/**
 * Batch calculate fit scores for multiple bids
 */
export function calculateBatchFitScores(
  bids: Bid[],
  profile: CompanyProfile,
  analyses?: Map<string, BidAnalysis>
): Map<string, FitScore> {
  const scores = new Map<string, FitScore>();

  for (const bid of bids) {
    const analysis = analyses?.get(bid.id);
    const score = calculateFitScore(bid, profile, analysis);
    scores.set(bid.id, score);
  }

  return scores;
}

/**
 * Rank bids by fit score
 */
export function rankBidsByFit(
  bids: Bid[],
  profile: CompanyProfile,
  analyses?: Map<string, BidAnalysis>
): Array<{ bid: Bid; score: FitScore; rank: number }> {
  const scores = calculateBatchFitScores(bids, profile, analyses);

  const ranked = bids
    .map((bid) => ({
      bid,
      score: scores.get(bid.id)!,
    }))
    .sort((a, b) => b.score.overall - a.score.overall)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return ranked;
}
