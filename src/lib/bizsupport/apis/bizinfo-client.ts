/**
 * 기업마당 (Bizinfo) API Client
 * 중소벤처기업부 기업지원사업 통합 플랫폼
 * https://www.bizinfo.go.kr
 */

import axios, { AxiosInstance } from 'axios';
import type { GovProgram } from '../types';
import { logger } from '@/lib/logging';

// =============================================================================
// 타입 정의
// =============================================================================

interface BizinfoApiConfig {
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
}

interface BizinfoSearchParams {
  keyword?: string;
  pblancBgngYmd?: string;   // 공고시작일 (YYYYMMDD)
  pblancEndYmd?: string;    // 공고종료일 (YYYYMMDD)
  bizPbancSttsCd?: string;  // 사업공고상태코드
  jrsdInsttCd?: string;     // 소관기관코드
  pageNo?: number;
  numOfRows?: number;
}

interface BizinfoProgram {
  pblancId: string;         // 공고ID
  pblancNm: string;         // 공고명
  jrsdInsttNm: string;      // 소관기관명
  bsnsSumryCn: string;      // 사업요약내용
  totPrgrmCnt: number;      // 총프로그램수
  reqstPrdBeginDt: string;  // 신청기간시작일
  reqstPrdEndDt: string;    // 신청기간종료일
  pblancUrl: string;        // 공고URL
  sprtCycl: string;         // 지원주기
  bsnsBudget: string;       // 사업예산
  sprtTargetCn: string;     // 지원대상내용
}

interface BizinfoApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: BizinfoProgram[] | BizinfoProgram;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// =============================================================================
// API Client
// =============================================================================

export class BizinfoClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: BizinfoApiConfig) {
    this.apiKey = config.apiKey;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://www.bizinfo.go.kr/uss/rss',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  /**
   * 지원사업 검색
   */
  async searchPrograms(params: BizinfoSearchParams = {}): Promise<GovProgram[]> {
    try {
      const response = await this.client.get<BizinfoApiResponse>('/pblancList.do', {
        params: {
          serviceKey: this.apiKey,
          dataType: 'json',
          pageNo: params.pageNo || 1,
          numOfRows: params.numOfRows || 20,
          ...params,
        },
      });

      const items = response.data.response.body.items.item;
      const programs = Array.isArray(items) ? items : [items];

      return programs.filter(Boolean).map(this.transformToGovProgram);
    } catch (error) {
      logger.error('Bizinfo search programs error', error);
      return [];
    }
  }

  /**
   * 최신 공고 조회
   */
  async getLatestPrograms(count: number = 10): Promise<GovProgram[]> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.searchPrograms({
      pblancBgngYmd: this.formatDate(thirtyDaysAgo),
      pblancEndYmd: this.formatDate(today),
      numOfRows: count,
    });
  }

  /**
   * 키워드로 검색
   */
  async searchByKeyword(keyword: string): Promise<GovProgram[]> {
    return this.searchPrograms({ keyword });
  }

  /**
   * 스마트공장 관련 사업 검색
   */
  async getSmartFactoryPrograms(): Promise<GovProgram[]> {
    const keywords = ['스마트공장', '스마트팩토리', '제조혁신'];
    const results: GovProgram[] = [];

    for (const keyword of keywords) {
      const programs = await this.searchByKeyword(keyword);
      results.push(...programs);
    }

    // 중복 제거
    const uniqueIds = new Set<string>();
    return results.filter((p) => {
      if (uniqueIds.has(p.id)) return false;
      uniqueIds.add(p.id);
      return true;
    });
  }

  /**
   * AI/빅데이터 관련 사업 검색
   */
  async getAIPrograms(): Promise<GovProgram[]> {
    const keywords = ['AI', '인공지능', '빅데이터', 'AI바우처'];
    const results: GovProgram[] = [];

    for (const keyword of keywords) {
      const programs = await this.searchByKeyword(keyword);
      results.push(...programs);
    }

    // 중복 제거
    const uniqueIds = new Set<string>();
    return results.filter((p) => {
      if (uniqueIds.has(p.id)) return false;
      uniqueIds.add(p.id);
      return true;
    });
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private transformToGovProgram(item: BizinfoProgram): GovProgram {
    const budgetAmount = this.parseBudget(item.bsnsBudget);
    return {
      id: `bizinfo-${item.pblancId}`,
      title: item.pblancNm,
      name: item.pblancNm,
      agency: item.jrsdInsttNm,
      organization: item.jrsdInsttNm,
      maxAmount: budgetAmount,
      amount: budgetAmount,
      amountUnit: 'KRW',
      eligibility: item.sprtTargetCn ? [item.sprtTargetCn] : [],
      applicationPeriod: {
        start: this.parseDate(item.reqstPrdBeginDt),
        end: this.parseDate(item.reqstPrdEndDt),
      },
      description: item.bsnsSumryCn,
      benefits: [],
      requirements: [],
      link: item.pblancUrl || 'https://www.bizinfo.go.kr',
      priority: 'P1',
      status: this.determineStatus(item.reqstPrdEndDt),
      source: 'bizinfo',
      tags: this.extractTags(item.pblancNm, item.bsnsSumryCn),
    };
  }

  private parseBudget(budgetStr: string): number {
    if (!budgetStr) return 0;

    // "100억원", "5천만원", "1억원" 등 파싱
    const match = budgetStr.match(/([0-9,]+)\s*(억원|천만원|백만원|만원|원)/);
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

  private parseDate(dateStr: string): string {
    if (!dateStr || dateStr.length !== 8) return '';
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private determineStatus(endDateStr: string): GovProgram['status'] {
    if (!endDateStr) return 'UPCOMING';

    const endDate = new Date(this.parseDate(endDateStr));
    const today = new Date();

    if (endDate < today) return 'CLOSED';
    if (endDate > today) return 'OPEN';
    return 'OPEN';
  }

  private extractTags(name: string, description: string): string[] {
    const text = `${name} ${description}`.toLowerCase();
    const tags: string[] = [];

    const tagKeywords: Record<string, string> = {
      '스마트공장': '스마트공장',
      'ai': 'AI',
      '인공지능': 'AI',
      '빅데이터': '빅데이터',
      '창업': '창업',
      'r&d': 'R&D',
      '수출': '수출',
      '디지털': '디지털전환',
      '바우처': '바우처',
    };

    for (const [keyword, tag] of Object.entries(tagKeywords)) {
      if (text.includes(keyword)) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)];
  }
}

// =============================================================================
// Factory
// =============================================================================

let instance: BizinfoClient | null = null;

export function getBizinfoClient(): BizinfoClient {
  if (!instance) {
    const apiKey = process.env.BIZINFO_API_KEY;
    if (!apiKey) {
      logger.warn('Bizinfo API key not configured, using mock client');
      return new BizinfoClient({ apiKey: 'mock-key' });
    }
    instance = new BizinfoClient({ apiKey });
  }
  return instance;
}
