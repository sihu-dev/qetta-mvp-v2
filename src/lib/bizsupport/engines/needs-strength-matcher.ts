/**
 * Needs-Strength Matcher
 * RFP 분석 결과와 Qetta 13개 강점 매칭
 *
 * 매칭 공식 (가산 방식):
 * score = (keywordMatch * kwWeight) + (hiddenNeedMatch * hdWeight) + (semanticMatch * semWeight) + clientBonus
 */

import type {
  RFPAnalysisResult,
  ClientType,
  QettaStrength,
  StrengthMatch,
  MatchResult,
  MatchRequest,
  HiddenNeed,
} from '../types';
import { QETTA_STRENGTHS, getStrengthById } from '../data/qetta-strengths';
import {
  getMatchConfigForClient,
  getCategoryWeight,
  MATCHING_THRESHOLDS,
  CLIENT_TYPE_META,
} from '../data/client-priorities';

// =============================================================================
// 매칭 로직
// =============================================================================

/**
 * 키워드 매칭 점수 계산
 */
function calculateKeywordMatch(
  strength: QettaStrength,
  analysis: RFPAnalysisResult
): { score: number; matchedKeywords: string[] } {
  const allKeywords = [
    ...analysis.keywords.primary.map((k) => k.term),
    ...analysis.keywords.secondary.map((k) => k.term),
    ...analysis.keywords.technical.map((k) => k.term),
    ...analysis.keywords.domain.map((k) => k.term),
  ].map((k) => k.toLowerCase());

  const matchedKeywords: string[] = [];

  for (const strengthKeyword of strength.keywords) {
    const lowerKeyword = strengthKeyword.toLowerCase();
    if (allKeywords.some((k) => k.includes(lowerKeyword) || lowerKeyword.includes(k))) {
      matchedKeywords.push(strengthKeyword);
    }
  }

  // 강점 제목/설명과 RFP 텍스트 매칭
  const rfpText = (analysis.metadata.rawText || '').toLowerCase();
  if (rfpText.includes(strength.title.toLowerCase())) {
    matchedKeywords.push(strength.title);
  }

  const score = matchedKeywords.length > 0
    ? Math.min(matchedKeywords.length / strength.keywords.length, 1.0)
    : 0;

  return { score, matchedKeywords: [...new Set(matchedKeywords)] };
}

/**
 * 은닉 니즈 매칭 점수 계산
 */
function calculateHiddenNeedMatch(
  strength: QettaStrength,
  hiddenNeeds: HiddenNeed[]
): { score: number; matchedNeeds: string[] } {
  const matchedNeeds: string[] = [];

  // 강점 카테고리와 은닉 니즈 카테고리 매핑
  const categoryMapping: Record<string, string[]> = {
    COST: ['BUDGET_JUSTIFICATION'],
    SPEED: ['KPI_PRESSURE'],
    TECH: ['PUBLICITY', 'KPI_PRESSURE'],
    TRUST: ['RISK_AVERSION', 'COMPLIANCE'],
    SUPPORT: ['RISK_AVERSION'],
  };

  const relevantNeedCategories = categoryMapping[strength.category] || [];

  for (const need of hiddenNeeds) {
    if (need.confidence < MATCHING_THRESHOLDS.minConfidence) continue;

    // 카테고리 매칭
    if (relevantNeedCategories.includes(need.category)) {
      matchedNeeds.push(need.need);
    }

    // 키워드 매칭
    const needText = need.need.toLowerCase();
    for (const keyword of strength.keywords) {
      if (needText.includes(keyword.toLowerCase())) {
        matchedNeeds.push(need.need);
        break;
      }
    }
  }

  const uniqueNeeds = [...new Set(matchedNeeds)];
  const score = uniqueNeeds.length > 0
    ? Math.min(uniqueNeeds.length / Math.max(hiddenNeeds.length, 1), 1.0)
    : 0;

  return { score, matchedNeeds: uniqueNeeds };
}

/**
 * 의미적 유사도 점수 계산 (pgvector 결과 기반)
 */
function calculateSemanticMatch(
  strength: QettaStrength,
  analysis: RFPAnalysisResult
): number {
  // 유사 문서의 매칭 키워드와 강점 키워드 비교
  let totalSimilarity = 0;
  let matchCount = 0;

  for (const doc of analysis.similarDocuments) {
    const hasOverlap = doc.matchedKeywords.some((k) =>
      strength.keywords.some((sk) =>
        k.toLowerCase().includes(sk.toLowerCase()) ||
        sk.toLowerCase().includes(k.toLowerCase())
      )
    );

    if (hasOverlap) {
      totalSimilarity += doc.similarity;
      matchCount++;
    }
  }

  return matchCount > 0 ? totalSimilarity / matchCount : 0;
}

/**
 * 단일 강점 매칭 점수 계산
 */
function matchStrength(
  strength: QettaStrength,
  analysis: RFPAnalysisResult,
  clientType: ClientType
): StrengthMatch {
  const config = getMatchConfigForClient(clientType);
  const categoryWeight = getCategoryWeight(clientType, strength.category);

  // 각 요소별 점수 계산
  const keywordResult = calculateKeywordMatch(strength, analysis);
  const hiddenNeedResult = calculateHiddenNeedMatch(strength, analysis.hiddenNeeds);
  const semanticScore = calculateSemanticMatch(strength, analysis);

  // 가산 방식 점수 계산
  const baseScore =
    keywordResult.score * config.keywordWeight +
    hiddenNeedResult.score * config.hiddenWeight +
    semanticScore * config.semanticWeight;

  // ClientType별 카테고리 가중치 적용
  const weightedScore = baseScore * (1 + categoryWeight);

  // 보너스 점수 가산
  const finalScore = Math.min((weightedScore * 100) + config.clientBonus, 100);

  // 추론 근거 생성
  const reasoning = generateReasoning(
    strength,
    keywordResult,
    hiddenNeedResult,
    semanticScore,
    clientType
  );

  const calculatedScore = Math.round(finalScore * 10) / 10;
  return {
    strengthId: strength.id,
    strength,
    score: calculatedScore,
    matchScore: calculatedScore,
    matchedKeywords: keywordResult.matchedKeywords,
    matchedNeeds: hiddenNeedResult.matchedNeeds,
    reasoning,
  };
}

/**
 * 추론 근거 생성
 */
function generateReasoning(
  strength: QettaStrength,
  keywordResult: { score: number; matchedKeywords: string[] },
  hiddenNeedResult: { score: number; matchedNeeds: string[] },
  semanticScore: number,
  clientType: ClientType
): string {
  const parts: string[] = [];

  if (keywordResult.matchedKeywords.length > 0) {
    parts.push(`키워드 매칭: ${keywordResult.matchedKeywords.slice(0, 3).join(', ')}`);
  }

  if (hiddenNeedResult.matchedNeeds.length > 0) {
    parts.push(`은닉 니즈 대응: ${hiddenNeedResult.matchedNeeds.length}건`);
  }

  if (semanticScore > 0.5) {
    parts.push('유사 프로젝트 연관성 높음');
  }

  const clientMeta = CLIENT_TYPE_META[clientType];
  if (strength.applicableClients.includes(clientType)) {
    parts.push(`${clientMeta.label} 맞춤 강점`);
  }

  return parts.length > 0 ? parts.join(' | ') : '일반적 적합성';
}

// =============================================================================
// 전체 매칭 함수
// =============================================================================

export async function matchStrengths(request: MatchRequest): Promise<MatchResult> {
  const analysis = request.analysisResult;
  if (!analysis) {
    throw new Error('Analysis result is required');
  }

  const clientType = request.clientType;

  // 모든 강점에 대해 매칭 실행
  let matches: StrengthMatch[] = QETTA_STRENGTHS.map((strength) =>
    matchStrength(strength, analysis, clientType)
  );

  // 사용자 지정 강점이 있으면 해당 강점만 필터링
  if (request.customStrengths && request.customStrengths.length > 0) {
    matches = matches.filter((m) => request.customStrengths!.includes(m.strengthId));
  }

  // 점수 순으로 정렬
  matches.sort((a, b) => b.matchScore - a.matchScore);

  // 상위 4개 강점 선택
  const topStrengths = matches.slice(0, 4).map((m) => m.strengthId);

  // 전체 점수 계산
  const overallScore = matches.length > 0
    ? matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length
    : 0;

  // 추천 등급 결정
  const recommendation = getRecommendation(overallScore, matches[0]?.matchScore || 0);

  return {
    rfpId: analysis.rfpId,
    clientType,
    matches,
    topStrengths,
    overallScore: Math.round(overallScore * 10) / 10,
    recommendation,
  };
}

function getRecommendation(
  overallScore: number,
  topScore: number
): MatchResult['recommendation'] {
  if (topScore >= 70 && overallScore >= 50) {
    return 'STRONG_FIT';
  }
  if (topScore >= 50 && overallScore >= 35) {
    return 'GOOD_FIT';
  }
  if (topScore >= 30 && overallScore >= 20) {
    return 'MODERATE_FIT';
  }
  return 'WEAK_FIT';
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

export function getRecommendationLabel(recommendation: MatchResult['recommendation']): string {
  const labels: Record<MatchResult['recommendation'], string> = {
    STRONG_FIT: '강력 추천',
    GOOD_FIT: '추천',
    MODERATE_FIT: '검토 필요',
    WEAK_FIT: '부적합',
  };
  return labels[recommendation];
}

export function getRecommendationColor(recommendation: MatchResult['recommendation']): string {
  const colors: Record<MatchResult['recommendation'], string> = {
    STRONG_FIT: '#10b981',  // green
    GOOD_FIT: '#3b82f6',    // blue
    MODERATE_FIT: '#f59e0b', // amber
    WEAK_FIT: '#ef4444',    // red
  };
  return colors[recommendation];
}

export function selectTopStrengths(
  matches: StrengthMatch[],
  count: number = 4
): QettaStrength[] {
  return matches
    .slice(0, count)
    .map((m) => getStrengthById(m.strengthId))
    .filter((s): s is QettaStrength => s !== undefined);
}
