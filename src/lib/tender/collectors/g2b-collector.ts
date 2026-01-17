/**
 * G2B Collector - 나라장터 공고 수집기
 * Priority: P0 (핵심 한국 조달 플랫폼)
 * API: 공공데이터포털 조달청 나라장터 물품 API
 */

import axios from 'axios';
import type { Bid, CollectResult, Currency } from '../types';
import { BaseCollector } from './base-collector';

interface G2BRawBid {
  bidNtceNo: string; // 입찰공고번호
  bidNtceNm: string; // 입찰공고명
  ntceInsttNm: string; // 공고기관명
  dminsttNm: string; // 수요기관명
  presmptPrce: number; // 추정가격
  bidBeginDt: string; // 입찰개시일시
  bidClseDt: string; // 입찰마감일시
  rgstDt: string; // 등록일시
  ntceSpecDocUrl1?: string; // 공고규격서 URL
  bidNtceUrl?: string; // 입찰공고 URL
}

interface G2BApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: G2BRawBid[];
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

export class G2BCollector extends BaseCollector {
  private readonly baseUrl =
    'https://apis.data.go.kr/1230000/BidPublicInfoService03';

  constructor(apiKey: string) {
    super({
      source: 'g2b',
      api_key: apiKey,
      api_url: 'https://apis.data.go.kr/1230000/BidPublicInfoService03',
      rate_limit: 10,
      enabled: true,
    });
  }

  async collect(): Promise<CollectResult> {
    const errors: string[] = [];
    const bids: Bid[] = [];

    try {
      // 물품 입찰공고 목록 조회
      const response = await axios.get<G2BApiResponse>(
        `${this.baseUrl}/getBidPblancListInfoThng`,
        {
          params: {
            serviceKey: this.config.api_key,
            numOfRows: 100,
            pageNo: 1,
            inqryDiv: 1, // 1: 공고중
            type: 'json',
          },
        }
      );

      if (response.data.response.header.resultCode !== '00') {
        throw new Error(response.data.response.header.resultMsg);
      }

      const items = response.data.response.body.items || [];

      for (const item of items) {
        try {
          const bid = this.parseBid(item);
          bids.push(bid);
        } catch (e) {
          errors.push(`Failed to parse bid ${item.bidNtceNo}: ${e}`);
        }
        await this.rateLimit();
      }

      return this.createResult(true, bids.length, errors);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.createResult(false, 0, [message]);
    }
  }

  parseBid(raw: unknown): Bid {
    const data = raw as G2BRawBid;

    return {
      id: '', // DB에서 생성
      org_id: '', // 컨텍스트에서 제공
      source: 'g2b',
      external_id: data.bidNtceNo,
      title: data.bidNtceNm,
      description: `발주기관: ${data.ntceInsttNm}, 수요기관: ${data.dminsttNm}`,
      budget: data.presmptPrce || null,
      currency: 'KRW' as Currency,
      deadline: data.bidClseDt || null,
      status: 'new',
      fit_score: null,
      raw_data: data as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
