/**
 * Competitor Analyzer - 경쟁 분석기
 * Analyzes competition landscape for bid opportunities
 */

import type { Bid, BidSource, CompetitionLevel } from '../types';

export interface CompetitorProfile {
  name: string;
  strength: 'strong' | 'medium' | 'weak';
  specializations: string[];
  estimatedWinRate: number;
  recentWins?: number;
  notes?: string;
}

export interface CompetitorAnalysis {
  bid_id: string;
  competition_level: CompetitionLevel;
  estimated_competitors: number;
  competitor_profiles: CompetitorProfile[];
  market_insights: MarketInsight[];
  strategy_recommendations: StrategyRecommendation[];
  analyzed_at: string;
}

export interface MarketInsight {
  type: 'trend' | 'opportunity' | 'threat' | 'info';
  content: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface StrategyRecommendation {
  strategy: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
}

/**
 * Analyze competition for a specific bid
 */
export async function analyzeCompetitors(bid: Bid): Promise<CompetitorAnalysis> {
  const competitionLevel = estimateCompetitionLevel(bid);
  const estimatedCompetitors = estimateCompetitorCount(bid, competitionLevel);
  const competitorProfiles = generateCompetitorProfiles(bid, competitionLevel);
  const marketInsights = generateMarketInsights(bid, competitionLevel);
  const strategyRecommendations = generateStrategyRecommendations(
    bid,
    competitionLevel,
    estimatedCompetitors
  );

  return {
    bid_id: bid.id,
    competition_level: competitionLevel,
    estimated_competitors: estimatedCompetitors,
    competitor_profiles: competitorProfiles,
    market_insights: marketInsights,
    strategy_recommendations: strategyRecommendations,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Estimate competition level based on bid characteristics
 */
function estimateCompetitionLevel(bid: Bid): CompetitionLevel {
  let score = 50;

  // Budget impact
  if (bid.budget) {
    if (bid.budget > 1000000000) score += 25;
    else if (bid.budget > 500000000) score += 15;
    else if (bid.budget > 100000000) score += 5;
    else score -= 10;
  }

  // Source impact
  const sourceScores: Record<BidSource, number> = {
    g2b: 15, // 나라장터 매우 경쟁적
    sam: 10, // SAM.gov 경쟁적
    ungm: 0, // UN 중간
    kz: -10, // KZ 상대적 덜 경쟁적
  };
  score += sourceScores[bid.source] || 0;

  // Title keywords impact
  const title = bid.title.toLowerCase();
  const hotKeywords = ['스마트', 'ai', '인공지능', '클라우드', '빅데이터', 'digital', 'smart'];
  const coldKeywords = ['유지보수', '운영', '관리', '단순', 'maintenance'];

  if (hotKeywords.some((k) => title.includes(k))) score += 15;
  if (coldKeywords.some((k) => title.includes(k))) score -= 10;

  // Deadline impact
  if (bid.deadline) {
    const daysLeft = (new Date(bid.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 7) score -= 15; // 긴급 = 덜 경쟁적
    else if (daysLeft > 30) score += 10; // 여유 = 더 경쟁적
  }

  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Estimate number of competitors
 */
function estimateCompetitorCount(bid: Bid, level: CompetitionLevel): number {
  const baseCount: Record<CompetitionLevel, [number, number]> = {
    high: [10, 25],
    medium: [5, 12],
    low: [2, 6],
  };

  const [min, max] = baseCount[level];

  // Adjust by budget
  let adjustment = 0;
  if (bid.budget) {
    if (bid.budget > 1000000000) adjustment = 5;
    else if (bid.budget > 500000000) adjustment = 3;
    else if (bid.budget < 100000000) adjustment = -2;
  }

  // Random within range for variation
  const range = max - min;
  const base = min + Math.floor(range * 0.5); // Use midpoint instead of random

  return Math.max(1, base + adjustment);
}

/**
 * Generate typical competitor profiles based on bid type
 */
function generateCompetitorProfiles(
  bid: Bid,
  level: CompetitionLevel
): CompetitorProfile[] {
  const profiles: CompetitorProfile[] = [];
  const title = bid.title.toLowerCase();

  // Large tech companies (for high-budget or tech projects)
  if (bid.budget && bid.budget > 500000000) {
    profiles.push({
      name: '대형 SI 업체',
      strength: 'strong',
      specializations: ['시스템통합', '대규모 프로젝트', '공공사업'],
      estimatedWinRate: level === 'high' ? 0.25 : 0.35,
      notes: '풍부한 자원과 실적으로 대형 프로젝트 선호',
    });
  }

  // Specialized tech companies
  if (/스마트|ai|iot|빅데이터|클라우드/.test(title)) {
    profiles.push({
      name: '전문 테크 기업',
      strength: 'medium',
      specializations: ['AI/ML', '클라우드', 'IoT', '데이터분석'],
      estimatedWinRate: 0.2,
      notes: '기술 전문성으로 차별화, 가격 경쟁력은 낮을 수 있음',
    });
  }

  // Regional/SME competitors
  if (bid.source === 'g2b') {
    profiles.push({
      name: '중소 전문기업',
      strength: 'medium',
      specializations: ['특화 솔루션', '맞춤 개발'],
      estimatedWinRate: 0.15,
      notes: '중소기업 우대 정책 활용 가능',
    });

    profiles.push({
      name: '지역 IT 기업',
      strength: 'weak',
      specializations: ['지역 네트워크', '유지보수'],
      estimatedWinRate: 0.1,
      notes: '지역 연고를 활용한 관계 영업',
    });
  }

  // International competitors (for international bids)
  if (bid.source === 'ungm' || bid.source === 'sam') {
    profiles.push({
      name: '글로벌 컨설팅 기업',
      strength: 'strong',
      specializations: ['국제 프로젝트', '다국어 지원', '글로벌 네트워크'],
      estimatedWinRate: 0.3,
      notes: '국제 입찰 경험과 네트워크 보유',
    });
  }

  // Consortium competitors
  if (bid.budget && bid.budget > 1000000000) {
    profiles.push({
      name: '컨소시엄',
      strength: 'strong',
      specializations: ['대규모 통합', '복합 프로젝트'],
      estimatedWinRate: 0.2,
      notes: '여러 기업 연합으로 역량 보완',
    });
  }

  return profiles;
}

/**
 * Generate market insights
 */
function generateMarketInsights(bid: Bid, level: CompetitionLevel): MarketInsight[] {
  const insights: MarketInsight[] = [];
  const title = bid.title.toLowerCase();

  // Technology trend insights
  if (/스마트팩토리|smart factory/.test(title)) {
    insights.push({
      type: 'trend',
      content: '스마트팩토리 시장 연평균 15% 성장 중, 정부 지원 확대',
      confidence: 'high',
    });
  }

  if (/ai|인공지능/.test(title)) {
    insights.push({
      type: 'trend',
      content: 'AI 도입 수요 급증, 숙련 인력 부족이 병목',
      confidence: 'high',
    });
  }

  // Competition insights
  if (level === 'high') {
    insights.push({
      type: 'threat',
      content: '경쟁 치열, 가격 덤핑 가능성 있음',
      confidence: 'medium',
    });
  } else if (level === 'low') {
    insights.push({
      type: 'opportunity',
      content: '경쟁 낮음, 품질 차별화로 수주 가능성 높음',
      confidence: 'medium',
    });
  }

  // Source-specific insights
  if (bid.source === 'g2b') {
    insights.push({
      type: 'info',
      content: '나라장터 입찰, 적격심사 또는 협상계약 방식 확인 필요',
      confidence: 'high',
    });
  }

  if (bid.source === 'ungm') {
    insights.push({
      type: 'info',
      content: 'UN 조달, 벤더 등록 및 국제 인증 요구 가능',
      confidence: 'high',
    });
  }

  // Budget insights
  if (bid.budget) {
    if (bid.budget > 1000000000) {
      insights.push({
        type: 'opportunity',
        content: '대형 프로젝트, 컨소시엄 구성 또는 하도급 전략 고려',
        confidence: 'medium',
      });
    } else if (bid.budget < 100000000) {
      insights.push({
        type: 'info',
        content: '소규모 프로젝트, 신속한 의사결정이 유리',
        confidence: 'medium',
      });
    }
  }

  return insights;
}

/**
 * Generate strategy recommendations
 */
function generateStrategyRecommendations(
  bid: Bid,
  level: CompetitionLevel,
  competitorCount: number
): StrategyRecommendation[] {
  const recommendations: StrategyRecommendation[] = [];
  const title = bid.title.toLowerCase();

  // Competition-based strategies
  if (level === 'high') {
    recommendations.push({
      strategy: '차별화 전략',
      description: '기술력, 실적, 사후관리 등 비가격 요소로 차별화',
      priority: 'high',
      expectedImpact: '가격 경쟁 회피, 품질 평가 점수 향상',
    });

    recommendations.push({
      strategy: '가격 최적화',
      description: '원가 분석을 통한 경쟁력 있는 가격 산정',
      priority: 'high',
      expectedImpact: '가격 평가 점수 확보, 수익성 유지',
    });
  }

  if (level === 'low') {
    recommendations.push({
      strategy: '품질 우선 전략',
      description: '최고 품질 제안으로 안정적 수주 추진',
      priority: 'medium',
      expectedImpact: '높은 평가 점수, 장기 파트너십 구축',
    });
  }

  // Technology strategies
  if (/스마트|ai|iot/.test(title)) {
    recommendations.push({
      strategy: '기술 제휴',
      description: '전문 기술 파트너와 협력하여 역량 강화',
      priority: 'medium',
      expectedImpact: '기술 평가 점수 향상, 리스크 분산',
    });
  }

  // Size-based strategies
  if (bid.budget && bid.budget > 1000000000) {
    recommendations.push({
      strategy: '컨소시엄 구성',
      description: '보완적 역량의 기업들과 컨소시엄 구성',
      priority: 'high',
      expectedImpact: '자격 요건 충족, 프로젝트 수행 안정성',
    });
  }

  // Source-specific strategies
  if (bid.source === 'g2b') {
    recommendations.push({
      strategy: '중소기업 우대 활용',
      description: '중소기업 확인서, 직접생산증명 등 활용',
      priority: 'medium',
      expectedImpact: '중소기업 가산점 확보',
    });
  }

  if (bid.source === 'ungm' || bid.source === 'sam') {
    recommendations.push({
      strategy: '국제 인증 확보',
      description: '요구되는 국제 표준 인증 사전 확보',
      priority: 'high',
      expectedImpact: '자격 요건 충족, 신뢰도 향상',
    });
  }

  // General strategies
  recommendations.push({
    strategy: '조기 준비',
    description: '마감 2주 전 제안서 완료, 충분한 검토 시간 확보',
    priority: 'medium',
    expectedImpact: '품질 향상, 오류 방지',
  });

  return recommendations;
}

/**
 * Compare our company against competitors
 */
export function compareWithCompetitors(
  ourStrengths: string[],
  competitors: CompetitorProfile[]
): {
  advantages: string[];
  disadvantages: string[];
  differentiators: string[];
} {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const differentiators: string[] = [];

  const strongCompetitors = competitors.filter((c) => c.strength === 'strong');
  const allCompetitorSpecs = competitors.flatMap((c) => c.specializations);

  // Find our unique strengths
  for (const strength of ourStrengths) {
    const competitorHas = allCompetitorSpecs.some(
      (s) => s.toLowerCase().includes(strength.toLowerCase())
    );
    if (!competitorHas) {
      differentiators.push(strength);
    }
  }

  // Analyze against strong competitors
  for (const competitor of strongCompetitors) {
    const theyHaveWeNot = competitor.specializations.filter(
      (s) => !ourStrengths.some((o) => o.toLowerCase().includes(s.toLowerCase()))
    );
    if (theyHaveWeNot.length > 0) {
      disadvantages.push(`${competitor.name} 대비 ${theyHaveWeNot.join(', ')} 역량 부족`);
    }

    const weHaveTheyNot = ourStrengths.filter(
      (s) => !competitor.specializations.some((c) => c.toLowerCase().includes(s.toLowerCase()))
    );
    if (weHaveTheyNot.length > 0) {
      advantages.push(`${competitor.name} 대비 ${weHaveTheyNot.join(', ')} 강점`);
    }
  }

  return { advantages, disadvantages, differentiators };
}
