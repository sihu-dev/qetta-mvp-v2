/**
 * ClientType별 우선순위 매트릭스
 * 고객 유형에 따른 강점 카테고리 가중치
 */

import type { ClientType, ClientPriority, StrengthCategory } from '../types';

// =============================================================================
// ClientType 우선순위 정의
// =============================================================================

export const CLIENT_PRIORITIES: ClientPriority[] = [
  {
    // SME 제조업체: 비용 절감 > 빠른 도입 > 사용 편의
    clientType: 'SME_MANUFACTURER',
    priorities: [
      { category: 'COST', weight: 0.35 },
      { category: 'SPEED', weight: 0.25 },
      { category: 'SUPPORT', weight: 0.20 },
      { category: 'TECH', weight: 0.15 },
      { category: 'TRUST', weight: 0.05 },
    ],
    bonusPoints: 10,
  },
  {
    // 지자체: 정부 인증 > 데이터 보안 > 지역 지원
    clientType: 'LOCAL_GOVERNMENT',
    priorities: [
      { category: 'TRUST', weight: 0.40 },
      { category: 'SUPPORT', weight: 0.25 },
      { category: 'COST', weight: 0.20 },
      { category: 'TECH', weight: 0.10 },
      { category: 'SPEED', weight: 0.05 },
    ],
    bonusPoints: 15,
  },
  {
    // 공공기관: 실적 > 안정성 > 기술력
    clientType: 'PUBLIC_INSTITUTION',
    priorities: [
      { category: 'TRUST', weight: 0.35 },
      { category: 'TECH', weight: 0.25 },
      { category: 'COST', weight: 0.20 },
      { category: 'SPEED', weight: 0.10 },
      { category: 'SUPPORT', weight: 0.10 },
    ],
    bonusPoints: 12,
  },
  {
    // 스타트업: 빠른 도입 > 비용 > 기술
    clientType: 'STARTUP',
    priorities: [
      { category: 'SPEED', weight: 0.30 },
      { category: 'COST', weight: 0.30 },
      { category: 'TECH', weight: 0.20 },
      { category: 'SUPPORT', weight: 0.15 },
      { category: 'TRUST', weight: 0.05 },
    ],
    bonusPoints: 8,
  },
  {
    // SI업체: 기술력 > 확장성 > 파트너십
    clientType: 'SYSTEM_INTEGRATOR',
    priorities: [
      { category: 'TECH', weight: 0.40 },
      { category: 'SPEED', weight: 0.25 },
      { category: 'SUPPORT', weight: 0.15 },
      { category: 'COST', weight: 0.15 },
      { category: 'TRUST', weight: 0.05 },
    ],
    bonusPoints: 10,
  },
  {
    // 대기업: 기술력 > 신뢰성 > ROI
    clientType: 'LARGE_ENTERPRISE',
    priorities: [
      { category: 'TECH', weight: 0.35 },
      { category: 'TRUST', weight: 0.30 },
      { category: 'COST', weight: 0.20 },
      { category: 'SPEED', weight: 0.10 },
      { category: 'SUPPORT', weight: 0.05 },
    ],
    bonusPoints: 5,
  },
];

// =============================================================================
// 유틸리티 함수
// =============================================================================

export function getClientPriority(clientType: ClientType): ClientPriority | undefined {
  return CLIENT_PRIORITIES.find((p) => p.clientType === clientType);
}

export function getCategoryWeight(clientType: ClientType, category: StrengthCategory): number {
  const priority = getClientPriority(clientType);
  if (!priority) return 0.2; // 기본값

  const categoryPriority = priority.priorities.find((p) => p.category === category);
  return categoryPriority?.weight ?? 0.2;
}

export function getBonusPoints(clientType: ClientType): number {
  const priority = getClientPriority(clientType);
  return priority?.bonusPoints ?? 0;
}

/** ClientType 한글 라벨 */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  SME_MANUFACTURER: '중소 제조업체',
  LOCAL_GOVERNMENT: '지자체',
  PUBLIC_INSTITUTION: '공공기관',
  STARTUP: '스타트업',
  SYSTEM_INTEGRATOR: 'SI업체',
  LARGE_ENTERPRISE: '대기업',
};

// =============================================================================
// ClientType 메타데이터
// =============================================================================

export const CLIENT_TYPE_META: Record<ClientType, {
  label: string;
  labelEn: string;
  description: string;
  appealPoints: string[];
}> = {
  SME_MANUFACTURER: {
    label: '중소 제조업체',
    labelEn: 'SME Manufacturer',
    description: '제조 현장의 디지털 전환을 추진하는 중소기업',
    appealPoints: ['MES 대비 99% 비용 절감', '10분 설치', '엑셀 친숙한 UI'],
  },
  LOCAL_GOVERNMENT: {
    label: '지자체',
    labelEn: 'Local Government',
    description: '스마트공장 지원사업을 운영하는 지방자치단체',
    appealPoints: ['정부 인증 공급기업', 'Gov ZIP 변조 탐지', '지역 밀착 지원'],
  },
  PUBLIC_INSTITUTION: {
    label: '공공기관',
    labelEn: 'Public Institution',
    description: '정부 R&D 및 지원사업을 수행하는 공공기관',
    appealPoints: ['다수 유사 실적', '전자정부법 준수', 'AI 품질 예측'],
  },
  STARTUP: {
    label: '스타트업',
    labelEn: 'Startup',
    description: '빠른 성장을 추구하는 기술 스타트업',
    appealPoints: ['50만원 시작', '당일 데이터 수집', 'ROI 0.7개월'],
  },
  SYSTEM_INTEGRATOR: {
    label: 'SI업체',
    labelEn: 'System Integrator',
    description: '스마트공장 솔루션을 구축하는 시스템 통합사업자',
    appealPoints: ['플러그앤플레이', '72시간 예지보전', 'API 연동'],
  },
  LARGE_ENTERPRISE: {
    label: '대기업',
    labelEn: 'Large Enterprise',
    description: '대규모 제조 시설을 운영하는 대기업',
    appealPoints: ['AI 품질 예측', 'Gov ZIP 보안', '검증된 실적'],
  },
};

// =============================================================================
// 매칭 Threshold 설정
// =============================================================================

export const MATCHING_THRESHOLDS = {
  competitive: 0.4,    // 경쟁 입찰: 40% 이상 매칭 시 추천
  negotiated: 0.2,     // 수의계약: 20% 이상 매칭 시 추천
  minConfidence: 0.5,  // 은닉 니즈 최소 신뢰도
} as const;

// =============================================================================
// 매칭 설정
// =============================================================================

export interface MatchConfig {
  keywordWeight: number;     // 명시적 키워드 가중치
  hiddenWeight: number;      // 은닉 니즈 가중치
  semanticWeight: number;    // pgvector 유사도 가중치
  clientBonus: number;       // ClientType별 보너스 점수
  threshold: {
    competitive: number;
    negotiated: number;
  };
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  keywordWeight: 0.4,
  hiddenWeight: 0.4,
  semanticWeight: 0.2,
  clientBonus: 0,           // getBonusPoints()로 동적 설정
  threshold: {
    competitive: 0.4,
    negotiated: 0.2,
  },
};

export function getMatchConfigForClient(clientType: ClientType): MatchConfig {
  return {
    ...DEFAULT_MATCH_CONFIG,
    clientBonus: getBonusPoints(clientType),
  };
}
