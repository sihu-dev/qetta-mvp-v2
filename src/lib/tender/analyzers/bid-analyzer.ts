/**
 * Bid Analyzer - 입찰 공고 분석기
 * Analyzes bid requirements and company fit
 */

import type { Bid, BidAnalysis, CompetitionLevel, QualificationCheck } from '../types';

export interface AnalyzeOptions {
  checkQualifications: boolean;
  estimateCompetition: boolean;
  generateRecommendations: boolean;
}

/**
 * Analyze a bid for fit and opportunity
 */
export async function analyzeBid(
  bid: Bid,
  companyProfile: CompanyProfile,
  options: AnalyzeOptions = {
    checkQualifications: true,
    estimateCompetition: true,
    generateRecommendations: true,
  }
): Promise<BidAnalysis> {
  const qualifications = options.checkQualifications
    ? await checkQualifications(bid, companyProfile)
    : [];

  const competitionLevel = options.estimateCompetition
    ? await estimateCompetition(bid)
    : 'medium';

  const recommendations = options.generateRecommendations
    ? await generateRecommendations(bid, qualifications, competitionLevel)
    : [];

  const winProbability = calculateWinProbability(
    qualifications,
    competitionLevel
  );

  return {
    id: '',
    bid_id: bid.id,
    org_id: bid.org_id,
    qualifications_met: qualifications,
    required_documents: [], // TODO: Extract from bid
    competition_level: competitionLevel,
    win_probability: winProbability,
    recommendations,
    analyzed_at: new Date().toISOString(),
  };
}

interface CompanyProfile {
  certifications: string[];
  experience_years: number;
  past_wins: number;
  revenue: number;
}

async function checkQualifications(
  bid: Bid,
  profile: CompanyProfile
): Promise<QualificationCheck[]> {
  // TODO: Implement qualification checking logic
  // This will use AI to parse requirements from bid description
  return [
    {
      requirement: 'Business registration',
      met: true,
    },
  ];
}

async function estimateCompetition(bid: Bid): Promise<CompetitionLevel> {
  // TODO: Implement competition estimation
  // Based on budget size, deadline, and historical data
  if (bid.budget && bid.budget > 1000000000) {
    return 'high';
  } else if (bid.budget && bid.budget > 100000000) {
    return 'medium';
  }
  return 'low';
}

async function generateRecommendations(
  bid: Bid,
  qualifications: QualificationCheck[],
  competition: CompetitionLevel
): Promise<BidAnalysis['recommendations']> {
  const recommendations: BidAnalysis['recommendations'] = [];

  const unmetQuals = qualifications.filter((q) => !q.met);
  if (unmetQuals.length > 0) {
    recommendations.push({
      type: 'weakness',
      content: `${unmetQuals.length} qualification(s) not met`,
      priority: 'high',
    });
  }

  if (competition === 'low') {
    recommendations.push({
      type: 'opportunity',
      content: 'Low competition - good candidate for bidding',
      priority: 'high',
    });
  }

  return recommendations;
}

function calculateWinProbability(
  qualifications: QualificationCheck[],
  competition: CompetitionLevel
): number {
  const qualScore = qualifications.filter((q) => q.met).length / Math.max(qualifications.length, 1);
  const competitionMultiplier =
    competition === 'low' ? 1.2 : competition === 'medium' ? 1.0 : 0.7;

  return Math.round(qualScore * 100 * competitionMultiplier);
}
