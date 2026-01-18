/**
 * K-Startup API Client
 * 창업진흥원 창업지원사업 플랫폼
 * https://www.k-startup.go.kr
 */

import axios, { AxiosInstance } from 'axios';
import type { GovProgram } from '../types';

// =============================================================================
// 타입 정의
// =============================================================================

interface KStartupApiConfig {
  apiKey: string;
  baseUrl?: string;
}

interface KStartupSearchParams {
  searchKeyword?: string;
  pbancYr?: string;          // 공고년도
  pbancSttsCd?: string;      // 공고상태 (01:공고중, 02:접수중, 03:마감)
  bizTpCd?: string;          // 사업유형코드
  pageNo?: number;
  numOfRows?: number;
}

interface KStartupProgram {
  pbancSn: string;           // 공고일련번호
  pbancNm: string;           // 공고명
  sprtBizNm: string;         // 지원사업명
  operInstNm: string;        // 운영기관명
  pbancBgngYmd: string;      // 공고시작일
  pbancEndYmd: string;       // 공고종료일
  rcptBgngYmd: string;       // 접수시작일
  rcptEndYmd: string;        // 접수종료일
  sprtAmt: string;           // 지원금액
  sprtTargetCn: string;      // 지원대상
  pbancCn: string;           // 공고내용
  bizTpNm: string;           // 사업유형명
  pbancUrl: string;          // 공고URL
}

interface KStartupApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: KStartupProgram[] | KStartupProgram;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// =============================================================================
// 사업유형 코드
// =============================================================================

export const KSTARTUP_BIZ_TYPES = {
  PRE_STARTUP: '01',           // 예비창업자
  EARLY_STARTUP: '02',         // 초기창업자(3년이내)
  GROWTH_STARTUP: '03',        // 도약기창업자(3~7년)
  ESTABLISHED: '04',           // 성숙기
  GLOBAL: '05',                // 글로벌
  SOCIAL: '06',                // 사회적기업
} as const;

// =============================================================================
// API Client
// =============================================================================

export class KStartupClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: KStartupApiConfig) {
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://www.k-startup.go.kr/api',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * 지원사업 검색
   */
  async searchPrograms(params: KStartupSearchParams = {}): Promise<GovProgram[]> {
    try {
      const response = await this.client.get<KStartupApiResponse>('/pbancList.do', {
        params: {
          serviceKey: this.apiKey,
          dataType: 'json',
          pageNo: params.pageNo || 1,
          numOfRows: params.numOfRows || 20,
          pbancYr: params.pbancYr || new Date().getFullYear().toString(),
          ...params,
        },
      });

      const items = response.data.response.body.items?.item;
      if (!items) return [];

      const programs = Array.isArray(items) ? items : [items];
      return programs.filter(Boolean).map(this.transformToGovProgram);
    } catch (error) {
      console.error('[K-Startup] Search programs error:', error);
      // API 실패 시 Mock 데이터 반환
      return this.getMockPrograms();
    }
  }

  /**
   * 예비창업패키지 조회
   */
  async getPreStartupPackages(): Promise<GovProgram[]> {
    return this.searchPrograms({
      bizTpCd: KSTARTUP_BIZ_TYPES.PRE_STARTUP,
      pbancSttsCd: '02', // 접수중
    });
  }

  /**
   * 초기창업패키지 조회
   */
  async getEarlyStartupPackages(): Promise<GovProgram[]> {
    return this.searchPrograms({
      bizTpCd: KSTARTUP_BIZ_TYPES.EARLY_STARTUP,
      pbancSttsCd: '02',
    });
  }

  /**
   * 현재 접수중인 모든 사업 조회
   */
  async getOpenPrograms(): Promise<GovProgram[]> {
    return this.searchPrograms({
      pbancSttsCd: '02', // 접수중
    });
  }

  /**
   * 키워드로 검색
   */
  async searchByKeyword(keyword: string): Promise<GovProgram[]> {
    return this.searchPrograms({
      searchKeyword: keyword,
    });
  }

  /**
   * TIPS 프로그램 검색
   */
  async getTIPSPrograms(): Promise<GovProgram[]> {
    return this.searchByKeyword('TIPS');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private transformToGovProgram(item: KStartupProgram): GovProgram {
    const programName = item.pbancNm || item.sprtBizNm;
    const agencyName = item.operInstNm || '창업진흥원';
    const amountValue = this.parseAmount(item.sprtAmt);
    return {
      id: `kstartup-${item.pbancSn}`,
      title: programName,
      name: programName,
      agency: agencyName,
      organization: agencyName,
      maxAmount: amountValue,
      amount: amountValue,
      amountUnit: 'KRW',
      eligibility: item.sprtTargetCn ? item.sprtTargetCn.split('\n').filter(Boolean) : [],
      applicationPeriod: {
        start: this.formatDate(item.rcptBgngYmd),
        end: this.formatDate(item.rcptEndYmd),
      },
      description: item.pbancCn || item.sprtBizNm,
      benefits: [],
      requirements: [],
      link: item.pbancUrl || 'https://www.k-startup.go.kr',
      priority: this.determinePriority(item.sprtBizNm, item.sprtAmt),
      status: this.determineStatus(item.rcptEndYmd),
      source: 'kstartup',
      tags: this.extractTags(item),
    };
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;

    // "최대 1억원", "5천만원~1억원" 등 파싱
    const match = amountStr.match(/([0-9,]+)\s*(억원|천만원|백만원|만원|원)/);
    if (!match) return 0;

    const value = parseInt(match[1].replace(/,/g, ''), 10);
    const unit = match[2];

    switch (unit) {
      case '억원':
        return value * 100000000;
      case '천만원':
        return value * 10000000;
      case '백만원':
        return value * 1000000;
      case '만원':
        return value * 10000;
      default:
        return value;
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    // YYYYMMDD -> YYYY-MM-DD
    if (dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return dateStr;
  }

  private determineStatus(endDateStr: string): GovProgram['status'] {
    if (!endDateStr) return 'UPCOMING';

    const endDate = new Date(this.formatDate(endDateStr));
    const today = new Date();
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (endDate < today) return 'CLOSED';
    if (endDate > oneWeekLater) return 'OPEN';
    return 'OPEN';
  }

  private determinePriority(name: string, amount: string): GovProgram['priority'] {
    const nameLC = name.toLowerCase();

    // P0: 예비창업패키지, TIPS
    if (nameLC.includes('예비창업') || nameLC.includes('tips')) {
      return 'P0';
    }

    // P1: 초기창업, 청년창업, AI바우처
    if (nameLC.includes('초기창업') || nameLC.includes('청년') || nameLC.includes('ai바우처')) {
      return 'P1';
    }

    // 금액 기준
    const parsedAmount = this.parseAmount(amount);
    if (parsedAmount >= 100000000) return 'P1';  // 1억 이상

    return 'P2';
  }

  private extractTags(item: KStartupProgram): string[] {
    const tags: string[] = [];
    const text = `${item.pbancNm} ${item.sprtBizNm} ${item.bizTpNm}`.toLowerCase();

    const tagMapping: Record<string, string> = {
      '예비창업': '예비창업',
      '초기창업': '초기창업',
      'tips': 'TIPS',
      '청년': '청년',
      '글로벌': '글로벌',
      '기술': '기술창업',
      'r&d': 'R&D',
      '스마트': '스마트',
    };

    for (const [keyword, tag] of Object.entries(tagMapping)) {
      if (text.includes(keyword)) {
        tags.push(tag);
      }
    }

    // 사업유형 태그
    if (item.bizTpNm) {
      tags.push(item.bizTpNm);
    }

    return [...new Set(tags)];
  }

  /**
   * Mock 데이터 (API 실패 시)
   */
  private getMockPrograms(): GovProgram[] {
    return [
      {
        id: 'kstartup-mock-1',
        title: '2026년 예비창업패키지',
        name: '2026년 예비창업패키지',
        agency: '창업진흥원',
        organization: '창업진흥원',
        maxAmount: 100000000,
        amount: 100000000,
        amountUnit: 'KRW',
        eligibility: ['예비창업자', '만 39세 이하'],
        applicationPeriod: {
          start: '2026-02-01',
          end: '2026-03-31',
        },
        description: '예비창업자의 기술창업을 지원하는 사업',
        benefits: ['최대 1억원 사업화 자금', '멘토링', '교육'],
        requirements: ['사업계획서', '발표평가'],
        link: 'https://www.k-startup.go.kr',
        priority: 'P0',
        status: 'UPCOMING',
        source: 'kstartup',
        tags: ['예비창업', '1억'],
      },
      {
        id: 'kstartup-mock-2',
        title: '2026년 초기창업패키지',
        name: '2026년 초기창업패키지',
        agency: '창업진흥원',
        organization: '창업진흥원',
        maxAmount: 100000000,
        amount: 100000000,
        amountUnit: 'KRW',
        eligibility: ['창업 3년 이내'],
        applicationPeriod: {
          start: '2026-02-15',
          end: '2026-04-15',
        },
        description: '초기창업기업의 사업화 지원',
        benefits: ['최대 1억원', '전담 멘토'],
        requirements: ['사업계획서', '발표평가'],
        link: 'https://www.k-startup.go.kr',
        priority: 'P1',
        status: 'UPCOMING',
        source: 'kstartup',
        tags: ['초기창업', '1억'],
      },
    ];
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: KStartupClient | null = null;

export function getKStartupClient(): KStartupClient {
  if (!instance) {
    const apiKey = process.env.KSTARTUP_API_KEY;
    if (!apiKey) {
      console.warn('[K-Startup] API key not configured, using mock client');
      return new KStartupClient({ apiKey: 'mock-key' });
    }
    instance = new KStartupClient({ apiKey });
  }
  return instance;
}
