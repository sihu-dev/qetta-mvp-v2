/**
 * Qetta 13개 강점 데이터베이스
 * 카테고리: COST(3) + SPEED(2) + TECH(3) + TRUST(3) + SUPPORT(2) = 13개
 */

import type { QettaStrength, StrengthCategory, ClientType } from '../types';

export const QETTA_STRENGTHS: QettaStrength[] = [
  // ==========================================================================
  // COST - 비용 (3개)
  // ==========================================================================
  {
    id: 'cost-reduction',
    category: 'COST',
    title: '연 3천만원 절감',
    titleEn: 'Annual ₩30M Savings',
    description: 'MES 시스템 대비 99% 비용 절감. 대기업 수준의 설비 모니터링을 중소기업 예산으로 구현.',
    metric: 'MES 대비 1/100',
    priority: 10,
    applicableClients: ['SME_MANUFACTURER', 'STARTUP', 'LOCAL_GOVERNMENT'],
    keywords: ['비용절감', '저렴', '경제적', '예산', 'MES', '비용효율', '가성비'],
  },
  {
    id: 'flexible-pricing',
    category: 'COST',
    title: '유연한 가격',
    titleEn: 'Flexible Pricing',
    description: '50만원부터 시작 가능한 단계별 도입. 기업 규모와 예산에 맞춤형 플랜 제공.',
    metric: '50만원 시작',
    priority: 8,
    applicableClients: ['SME_MANUFACTURER', 'STARTUP'],
    keywords: ['저렴', '단계별', '맞춤형', '플랜', '구독', '월정액'],
  },
  {
    id: 'roi-fast',
    category: 'COST',
    title: 'ROI 0.7개월',
    titleEn: 'ROI in 0.7 Months',
    description: '도입 후 0.7개월 내 투자 회수. 업계 최단 ROI 달성 기간.',
    metric: '빠른 투자 회수',
    priority: 9,
    applicableClients: ['SME_MANUFACTURER', 'PUBLIC_INSTITUTION', 'LARGE_ENTERPRISE'],
    keywords: ['ROI', '투자회수', '수익', '효과', '성과'],
  },

  // ==========================================================================
  // SPEED - 속도 (2개)
  // ==========================================================================
  {
    id: 'fast-deployment',
    category: 'SPEED',
    title: '10분 설치',
    titleEn: '10-Minute Setup',
    description: '플러그앤플레이 방식으로 10분 내 설치 완료. 기존 설비 변경 없이 즉시 데이터 수집 시작.',
    metric: '당일 데이터 수집',
    priority: 9,
    applicableClients: ['SME_MANUFACTURER', 'STARTUP', 'SYSTEM_INTEGRATOR'],
    keywords: ['빠른설치', '간편', '플러그앤플레이', '즉시', '당일', '신속'],
  },
  {
    id: 'quick-results',
    category: 'SPEED',
    title: '즉시 효과',
    titleEn: 'Immediate Results',
    description: '설치 당일부터 실시간 모니터링 가능. 도입 즉시 가시적 성과 확인.',
    metric: '설치 당일 모니터링',
    priority: 7,
    applicableClients: ['SME_MANUFACTURER', 'PUBLIC_INSTITUTION'],
    keywords: ['즉시', '실시간', '가시적', '모니터링', '빠른효과'],
  },

  // ==========================================================================
  // TECH - 기술 (3개)
  // ==========================================================================
  {
    id: 'ai-quality',
    category: 'TECH',
    title: 'AI 품질 예측',
    titleEn: 'AI Quality Prediction',
    description: 'AI 기반 품질 예측으로 불량률 30%에서 5%로 대폭 감소. 사전 품질 관리 실현.',
    metric: '불량률 30%→5%',
    priority: 10,
    applicableClients: ['SME_MANUFACTURER', 'LARGE_ENTERPRISE', 'PUBLIC_INSTITUTION'],
    keywords: ['AI', '인공지능', '품질', '불량', '예측', '품질관리', '불량률'],
  },
  {
    id: 'predictive',
    category: 'TECH',
    title: '72시간 예지보전',
    titleEn: '72-Hour Predictive Maintenance',
    description: '72시간 전 고장 예측으로 비계획 정지 80% 감소. AI 기반 설비 수명 예측.',
    metric: '정지 -80%',
    priority: 9,
    applicableClients: ['SME_MANUFACTURER', 'LARGE_ENTERPRISE', 'SYSTEM_INTEGRATOR'],
    keywords: ['예지보전', '예측', '고장', '정지', '설비관리', 'CBM', 'PdM'],
  },
  {
    id: 'plug-and-play',
    category: 'TECH',
    title: '플러그앤플레이',
    titleEn: 'Plug & Play',
    description: '비침투형 OTT칩으로 기존 설비 변경 없이 설치. PLC/SCADA 연동 불필요.',
    metric: '비침투 설치',
    priority: 8,
    applicableClients: ['SME_MANUFACTURER', 'SYSTEM_INTEGRATOR'],
    keywords: ['플러그앤플레이', '비침투', 'OTT', '간편설치', 'PLC', 'SCADA'],
  },

  // ==========================================================================
  // TRUST - 신뢰 (3개)
  // ==========================================================================
  {
    id: 'gov-certified',
    category: 'TRUST',
    title: '정부 인증',
    titleEn: 'Government Certified',
    description: 'AI바우처, 스마트공장 지원사업 공식 공급기업. 정부 검증 완료.',
    metric: 'AI바우처/스마트공장',
    priority: 9,
    applicableClients: ['SME_MANUFACTURER', 'LOCAL_GOVERNMENT', 'PUBLIC_INSTITUTION'],
    keywords: ['정부인증', 'AI바우처', '스마트공장', '지원사업', '공급기업', '인증'],
  },
  {
    id: 'data-security',
    category: 'TRUST',
    title: 'Gov ZIP 보안',
    titleEn: 'Gov ZIP Security',
    description: 'SHA-256 해시 기반 변조 탐지. 전자정부법 27조 준수 증빙 패키지.',
    metric: '변조 탐지 가능',
    priority: 8,
    applicableClients: ['LOCAL_GOVERNMENT', 'PUBLIC_INSTITUTION', 'LARGE_ENTERPRISE'],
    keywords: ['보안', 'Gov ZIP', '증빙', '변조탐지', '전자정부', '감사', '무결성'],
  },
  {
    id: 'track-record',
    category: 'TRUST',
    title: '검증된 실적',
    titleEn: 'Proven Track Record',
    description: '다수의 스마트공장, AI바우처 사업 수행 실적. 유사 프로젝트 성공 경험.',
    metric: '유사 프로젝트 다수',
    priority: 7,
    applicableClients: ['PUBLIC_INSTITUTION', 'LOCAL_GOVERNMENT'],
    keywords: ['실적', '경험', '수행', '프로젝트', '레퍼런스', '사례'],
  },

  // ==========================================================================
  // SUPPORT - 지원 (2개)
  // ==========================================================================
  {
    id: 'local-support',
    category: 'SUPPORT',
    title: '부산 본사',
    titleEn: 'Busan Headquarters',
    description: '부산 본사 기반 지역 밀착 지원. 동남권 제조업체 현장 대응 강점.',
    metric: '지역 밀착 지원',
    priority: 6,
    applicableClients: ['SME_MANUFACTURER', 'LOCAL_GOVERNMENT'],
    keywords: ['부산', '지역', '동남권', '현장지원', '밀착', '로컬'],
  },
  {
    id: 'easy-use',
    category: 'SUPPORT',
    title: '사용 편의',
    titleEn: 'User Friendly',
    description: '엑셀 친숙한 UI로 제조 현장 담당자 즉시 활용. 별도 교육 불필요.',
    metric: '엑셀 친숙한 UI',
    priority: 7,
    applicableClients: ['SME_MANUFACTURER', 'STARTUP'],
    keywords: ['쉬운', '편리', '직관적', '엑셀', 'UI', '사용자친화'],
  },
];

// =============================================================================
// 카테고리별 그룹핑
// =============================================================================

export const STRENGTHS_BY_CATEGORY: Record<StrengthCategory, QettaStrength[]> = {
  COST: QETTA_STRENGTHS.filter((s) => s.category === 'COST'),
  SPEED: QETTA_STRENGTHS.filter((s) => s.category === 'SPEED'),
  TECH: QETTA_STRENGTHS.filter((s) => s.category === 'TECH'),
  TRUST: QETTA_STRENGTHS.filter((s) => s.category === 'TRUST'),
  SUPPORT: QETTA_STRENGTHS.filter((s) => s.category === 'SUPPORT'),
};

// =============================================================================
// 유틸리티 함수
// =============================================================================

export function getStrengthById(id: string): QettaStrength | undefined {
  return QETTA_STRENGTHS.find((s) => s.id === id);
}

export function getStrengthsByCategory(): Record<StrengthCategory, QettaStrength[]>;
export function getStrengthsByCategory(category: StrengthCategory): QettaStrength[];
export function getStrengthsByCategory(category?: StrengthCategory): Record<StrengthCategory, QettaStrength[]> | QettaStrength[] {
  if (category) {
    return STRENGTHS_BY_CATEGORY[category];
  }
  return STRENGTHS_BY_CATEGORY;
}

export function getStrengthsForClient(clientType: ClientType): QettaStrength[] {
  return QETTA_STRENGTHS.filter((s) => s.applicableClients.includes(clientType))
    .sort((a, b) => b.priority - a.priority);
}

export function getTopStrengths(count: number = 4): QettaStrength[] {
  return [...QETTA_STRENGTHS]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, count);
}

export function searchStrengthsByKeyword(keyword: string): QettaStrength[] {
  const lowerKeyword = keyword.toLowerCase();
  return QETTA_STRENGTHS.filter((s) =>
    s.keywords.some((k) => k.toLowerCase().includes(lowerKeyword)) ||
    s.title.toLowerCase().includes(lowerKeyword) ||
    s.description.toLowerCase().includes(lowerKeyword)
  );
}

// =============================================================================
// 카테고리 메타데이터
// =============================================================================

export const CATEGORY_META: Record<StrengthCategory, { label: string; labelEn: string; color: string }> = {
  COST: { label: '비용', labelEn: 'Cost', color: '#10b981' },      // green
  SPEED: { label: '속도', labelEn: 'Speed', color: '#f59e0b' },    // amber
  TECH: { label: '기술', labelEn: 'Technology', color: '#3b82f6' }, // blue
  TRUST: { label: '신뢰', labelEn: 'Trust', color: '#8b5cf6' },    // purple
  SUPPORT: { label: '지원', labelEn: 'Support', color: '#ec4899' }, // pink
};
