/**
 * 2026 정부지원사업 목록
 * Qetta Factory (uniLAB) 타겟 사업
 */

import type { GovProgram, GovProgramFilter } from '../types';

// =============================================================================
// 2026 정부지원사업 목록
// =============================================================================

export const GOV_PROGRAMS_2026: GovProgram[] = [
  // =========================================================================
  // P0 - 최우선 타겟
  // =========================================================================
  {
    id: 'pre-startup-2026',
    title: '예비창업패키지',
    name: '예비창업패키지',
    nameEn: 'Pre-Startup Package',
    agency: '창업진흥원',
    organization: '창업진흥원',
    maxAmount: 100000000,      // 1억
    amount: 100000000,
    amountUnit: 'KRW',
    eligibility: [
      '예비창업자 (사업자등록 전)',
      '만 39세 이하',
      '혁신적인 기술창업 아이템 보유',
    ],
    applicationPeriod: {
      start: '2026-02-01',
      end: '2026-03-31',
    },
    description: '예비창업자의 기술창업을 지원하는 사업. 창업 사업화 자금, 창업 교육, 멘토링 등 종합 지원.',
    benefits: [
      '최대 1억원 사업화 자금',
      '창업 교육 및 멘토링',
      '사무공간 지원',
      '네트워킹 기회',
    ],
    requirements: [
      '사업계획서 제출',
      '발표 평가 통과',
      '창업 교육 이수',
    ],
    link: 'https://www.k-startup.go.kr',
    priority: 'P0',
    status: 'UPCOMING',
    source: 'manual',
    tags: ['예비창업', '창업지원', '기술창업', '1억'],
  },
  {
    id: 'tips-2026',
    title: 'TIPS (민간투자주도형 기술창업지원)',
    name: 'TIPS (민간투자주도형 기술창업지원)',
    nameEn: 'Tech Incubator Program for Startup',
    agency: '중소벤처기업부',
    organization: '중소벤처기업부',
    maxAmount: 500000000,      // R&D 5억
    amount: 500000000,
    amountUnit: 'KRW',
    eligibility: [
      '기술 기반 스타트업',
      '엔젤투자 매칭 필수 (최소 2억)',
      'PoC 완료 또는 MVP 보유',
    ],
    applicationPeriod: {
      start: '2026-03-01',
      end: '2026-04-30',
    },
    description: '민간 투자와 연계한 기술창업 지원. R&D 자금과 엔젤 매칭 투자를 통한 초기 스타트업 육성.',
    benefits: [
      'R&D 자금 최대 5억원',
      '엔젤 매칭 투자 2억원',
      '창업자금 1억원',
      '해외 마케팅 1억원',
    ],
    requirements: [
      'TIPS 운영사 선정',
      '엔젤투자 유치',
      'R&D 계획서 제출',
    ],
    link: 'https://www.jointips.or.kr',
    priority: 'P0',
    status: 'UPCOMING',
    source: 'manual',
    tags: ['TIPS', '엔젤투자', 'R&D', '기술창업', '5억'],
  },

  // =========================================================================
  // P1 - 주요 타겟
  // =========================================================================
  {
    id: 'youth-startup-fund-2026',
    title: '청년전용창업자금',
    name: '청년전용창업자금',
    nameEn: 'Youth Startup Fund',
    agency: '중소벤처기업부',
    organization: '중소벤처기업부',
    maxAmount: 100000000,      // 1억
    amount: 100000000,
    amountUnit: 'KRW',
    eligibility: [
      '만 39세 이하 청년 창업자',
      '창업 후 7년 이내 기업',
      '제조업, 지식서비스업 등',
    ],
    applicationPeriod: {
      start: '2026-01-15',
      end: '2026-12-31',
    },
    description: '청년 창업기업 대상 저금리 정책자금. 연 2.0% 금리로 시설자금 및 운전자금 지원.',
    benefits: [
      '최대 1억원 대출',
      '연 2.0% 저금리',
      '최대 10년 상환 기간',
      '거치 기간 5년',
    ],
    requirements: [
      '사업계획서',
      '신용 평가',
      '담보 또는 신용보증',
    ],
    link: 'https://www.semas.or.kr',
    priority: 'P1',
    status: 'OPEN',
    source: 'manual',
    tags: ['청년', '창업자금', '저금리', '대출', '1억'],
  },
  {
    id: 'smart-factory-basic-2026',
    title: '스마트공장 보급·확산사업 (기초)',
    name: '스마트공장 보급·확산사업 (기초)',
    nameEn: 'Smart Factory Basic Level',
    agency: '중소벤처기업부',
    organization: '중소벤처기업부',
    maxAmount: 70000000,       // 7천만원
    amount: 70000000,
    amountUnit: 'KRW',
    eligibility: [
      '제조업 중소기업',
      '상시 근로자 5인 이상',
      '스마트공장 미보유 기업',
    ],
    applicationPeriod: {
      start: '2026-02-01',
      end: '2026-06-30',
    },
    description: '중소 제조기업의 스마트공장 기초 수준 구축 지원. 데이터 수집 및 모니터링 체계 구축.',
    benefits: [
      '최대 7천만원 지원 (자부담 50%)',
      '스마트공장 컨설팅',
      '공급기업 매칭',
      '사후관리 지원',
    ],
    requirements: [
      '수요조사서 제출',
      '현장 실사',
      '자부담금 확보',
    ],
    link: 'https://smart-factory.kr',
    priority: 'P1',
    status: 'UPCOMING',
    source: 'manual',
    tags: ['스마트공장', '제조', '기초수준', '데이터수집', '7천만'],
  },
  {
    id: 'ai-voucher-2026',
    title: 'AI 바우처 지원사업',
    name: 'AI 바우처 지원사업',
    nameEn: 'AI Voucher Program',
    agency: '정보통신산업진흥원(NIPA)',
    organization: '정보통신산업진흥원(NIPA)',
    maxAmount: 300000000,      // 3억
    amount: 300000000,
    amountUnit: 'KRW',
    eligibility: [
      '중소·중견기업',
      'AI 솔루션 도입 희망 기업',
      '기 도입 AI 솔루션 없는 기업',
    ],
    applicationPeriod: {
      start: '2026-03-01',
      end: '2026-05-31',
    },
    description: 'AI 솔루션 도입을 위한 바우처 지원. 수요기업과 AI 공급기업 매칭 지원.',
    benefits: [
      '최대 3억원 바우처',
      'AI 솔루션 컨설팅',
      '공급기업 매칭',
      '기술 교육',
    ],
    requirements: [
      'AI 도입 계획서',
      '현장 평가',
      '자부담금 (기업 규모별 차등)',
    ],
    link: 'https://www.nipa.kr',
    priority: 'P1',
    status: 'UPCOMING',
    source: 'manual',
    tags: ['AI바우처', 'AI도입', 'NIPA', '3억'],
  },

  // =========================================================================
  // P2 - 보조 타겟
  // =========================================================================
  {
    id: 'early-startup-2026',
    title: '초기창업패키지',
    name: '초기창업패키지',
    nameEn: 'Early Startup Package',
    agency: '창업진흥원',
    organization: '창업진흥원',
    maxAmount: 100000000,      // 1억
    amount: 100000000,
    amountUnit: 'KRW',
    eligibility: [
      '창업 3년 이내 기업',
      '기술 기반 창업',
      '대표자 연령 무관',
    ],
    applicationPeriod: {
      start: '2026-02-15',
      end: '2026-04-15',
    },
    description: '창업 초기 기업의 사업화 지원. 멘토링, 사업화 자금, 교육 등 종합 지원.',
    benefits: [
      '최대 1억원 사업화 자금',
      '전담 멘토 배정',
      '투자 연계',
      '홍보 마케팅 지원',
    ],
    requirements: [
      '사업계획서',
      '발표 평가',
      '창업 교육 이수',
    ],
    link: 'https://www.k-startup.go.kr',
    priority: 'P2',
    status: 'UPCOMING',
    source: 'manual',
    tags: ['초기창업', '3년이내', '1억'],
  },
  {
    id: 'sme-rd-2026',
    title: '중소기업 R&D 지원사업',
    name: '중소기업 R&D 지원사업',
    nameEn: 'SME R&D Support',
    agency: '중소벤처기업부',
    organization: '중소벤처기업부',
    maxAmount: 500000000,      // 5억
    amount: 500000000,
    amountUnit: 'KRW',
    eligibility: [
      '중소기업',
      '법인 사업자',
      '매칭펀드 확보 가능',
    ],
    applicationPeriod: {
      start: '2026-01-01',
      end: '2026-12-31',
    },
    description: '중소기업 기술개발 R&D 지원. 혁신형 기술개발, 시장대응형 기술개발 등.',
    benefits: [
      '과제당 3~5억원',
      '기술개발 컨설팅',
      '사업화 연계',
    ],
    requirements: [
      'R&D 과제 제안서',
      '매칭펀드 (20~30%)',
      '연구 인력 보유',
    ],
    link: 'https://www.smtech.go.kr',
    priority: 'P2',
    status: 'OPEN',
    source: 'manual',
    tags: ['R&D', '기술개발', '5억'],
  },
  {
    id: 'digital-twin-2026',
    title: '디지털트윈 실증사업',
    name: '디지털트윈 실증사업',
    nameEn: 'Digital Twin Demonstration',
    agency: '산업통상자원부',
    organization: '산업통상자원부',
    maxAmount: 1000000000,     // 10억
    amount: 1000000000,
    amountUnit: 'KRW',
    eligibility: [
      '디지털트윈 기술 보유 기업',
      '컨소시엄 구성 필수',
      '실증 대상 확보',
    ],
    applicationPeriod: {
      start: '2026-04-01',
      end: '2026-05-31',
    },
    description: '제조, 도시, 건설 등 분야별 디지털트윈 기술 실증 지원.',
    benefits: [
      '최대 10억원 지원',
      '기술 실증 환경',
      '사업화 연계',
    ],
    requirements: [
      '컨소시엄 구성',
      '실증 계획서',
      '기술 확보 증빙',
    ],
    link: 'https://www.kiat.or.kr',
    priority: 'P2',
    status: 'UPCOMING',
    source: 'manual',
    tags: ['디지털트윈', '실증', '10억'],
  },
];

// =============================================================================
// 유틸리티 함수
// =============================================================================

export function getGovProgramById(id: string): GovProgram | undefined {
  return GOV_PROGRAMS_2026.find((p) => p.id === id);
}

export function filterGovPrograms(filter: GovProgramFilter): GovProgram[] {
  return GOV_PROGRAMS_2026.filter((program) => {
    if (filter.status && program.status !== filter.status) return false;
    if (filter.priority && program.priority !== filter.priority) return false;
    if (filter.agency && !program.agency.includes(filter.agency)) return false;
    if (filter.minAmount && program.maxAmount < filter.minAmount) return false;
    if (filter.maxAmount && program.maxAmount > filter.maxAmount) return false;
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some((tag) =>
        program.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    return true;
  });
}

export function getOpenPrograms(): GovProgram[] {
  return filterGovPrograms({ status: 'OPEN' });
}

export function getUpcomingPrograms(): GovProgram[] {
  return filterGovPrograms({ status: 'UPCOMING' });
}

export function getPriorityPrograms(priority: 'P0' | 'P1' | 'P2'): GovProgram[] {
  return filterGovPrograms({ priority });
}

export function searchProgramsByTag(tag: string): GovProgram[] {
  return GOV_PROGRAMS_2026.filter((p) =>
    p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

// =============================================================================
// Qetta Factory 회사 정보
// =============================================================================

export const QETTA_COMPANY_PROFILE = {
  name: 'Qetta Factory',
  legalName: 'uniLAB',
  representative: '이혜인',
  team: [
    { name: '이혜인', role: '대표', note: '만30, 여성, 부산' },
    { name: '조시후', role: 'CTO', note: '기술총괄' },
    { name: '김호균', role: 'COO', note: '운영총괄' },
  ],
  foundedYear: 2026,
  status: '예비창업자',
  location: '부산',
  coreService: 'OTT칩 + AI 예지보전',
  cvp: 'MES 대비 99% 비용 절감, ROI 0.7개월',
  targetMarket: ['스마트공장', 'AI바우처', '디지털트윈'],
  poolSI: 10432,  // Pool SI 타겟 기업 수
} as const;

// =============================================================================
// 지원사업별 적합도
// =============================================================================

export const PROGRAM_FIT_SCORES: Record<string, { score: number; reasons: string[] }> = {
  'pre-startup-2026': {
    score: 95,
    reasons: [
      '예비창업자 자격 충족',
      '대표 만30세 (만39세 이하)',
      '기술창업 아이템 (OTT칩 + AI)',
      '부산 지역 (지역 가산점)',
    ],
  },
  'tips-2026': {
    score: 75,
    reasons: [
      '기술 기반 스타트업',
      'PoC 개발 진행 중',
      '엔젤 매칭 투자 필요 (미확보)',
    ],
  },
  'youth-startup-fund-2026': {
    score: 90,
    reasons: [
      '대표 만39세 이하',
      '제조업/지식서비스업',
      '저금리 자금 확보 가능',
    ],
  },
  'smart-factory-basic-2026': {
    score: 100,
    reasons: [
      '스마트공장 공급기업 자격',
      'OTT칩 = 데이터 수집 솔루션',
      '기초 수준 타겟 정확',
      'Pool SI 10,432개사 대상',
    ],
  },
  'ai-voucher-2026': {
    score: 95,
    reasons: [
      'AI 예지보전 = AI 솔루션',
      '공급기업 자격',
      '수요기업 매칭 가능',
    ],
  },
};
