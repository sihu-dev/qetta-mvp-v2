# 🔧 PHASE 2: 수집기 구현

> **For**: Claude Code CLI  
> **Duration**: 2-3주  
> **Priority**: P0 (나라장터) → P1 (UNGM) → P2 (SAM, 카자흐)

---

## 2.1 나라장터 수집기 (P0)

### `src/lib/tender/collectors/g2b-collector.ts`

```typescript
/**
 * 나라장터 (G2B) 입찰공고 수집기
 * 
 * API: 공공데이터포털 - 조달청 입찰공고정보
 * URL: https://www.data.go.kr/dataset/3045157/openapi.do
 * 
 * 핵심 원칙: "문서를 파싱하려 하지 말고, 데이터 소스를 바꿔라"
 * → HWP 파싱 대신 API에서 구조화된 데이터 직접 수집
 */

import { parseStringPromise } from 'xml2js';
import { BaseCollector } from './base-collector';
import { 
  Bid, 
  BidFilter, 
  CollectorResult,
  BidSource 
} from '../types';

export class G2BCollector extends BaseCollector {
  
  constructor() {
    super({
      source: 'g2b',
      baseUrl: process.env.G2B_API_URL || 
        'https://apis.data.go.kr/1230000/BidPublicInfoService04',
      apiKey: process.env.G2B_API_KEY,
      rateLimit: 100, // 분당 100회
    });
  }
  
  get source(): BidSource {
    return 'g2b';
  }
  
  /**
   * 입찰공고 수집
   */
  async collect(filter?: BidFilter): Promise<CollectorResult> {
    const bids: Bid[] = [];
    const errors: string[] = [];
    
    try {
      // 물품 입찰
      const goodsBids = await this.collectByType('getBidPblancListInfoThngPPSSrch', filter);
      bids.push(...goodsBids);
      
      // 용역 입찰  
      const serviceBids = await this.collectByType('getBidPblancListInfoServcPPSSrch', filter);
      bids.push(...serviceBids);
      
      // 공사 입찰
      const constructionBids = await this.collectByType('getBidPblancListInfoCnstwkPPSSrch', filter);
      bids.push(...constructionBids);
      
    } catch (error) {
      errors.push(this.handleError(error));
    }
    
    return {
      success: errors.length === 0,
      source: 'g2b',
      count: bids.length,
      bids,
      errors: errors.length > 0 ? errors : undefined,
      collectedAt: new Date(),
    };
  }
  
  /**
   * 타입별 입찰 수집
   */
  private async collectByType(
    endpoint: string, 
    filter?: BidFilter
  ): Promise<Bid[]> {
    const params = new URLSearchParams({
      serviceKey: this.config.apiKey || '',
      numOfRows: '100',
      pageNo: '1',
      inqryDiv: '1', // 공고일 기준
      type: 'xml',
    });
    
    // 날짜 필터
    if (filter?.deadlineAfter) {
      params.append('inqryBgnDt', this.formatDate(filter.deadlineAfter));
    }
    if (filter?.deadlineBefore) {
      params.append('inqryEndDt', this.formatDate(filter.deadlineBefore));
    }
    
    await this.rateLimitDelay();
    
    const response = await this.client.get(`/${endpoint}?${params}`);
    const xml = response.data;
    
    // XML 파싱
    const parsed = await parseStringPromise(xml, { explicitArray: false });
    const items = parsed?.response?.body?.items?.item;
    
    if (!items) return [];
    
    const itemArray = Array.isArray(items) ? items : [items];
    
    return itemArray.map(item => this.parseBid(item));
  }
  
  /**
   * API 응답을 Bid 객체로 변환
   */
  parseBid(raw: G2BRawBid): Bid {
    return {
      id: '', // DB 저장 시 생성
      orgId: '', // 사용자 조직으로 설정
      source: 'g2b',
      externalId: raw.bidNtceNo || raw.bfSpecRgstNo || '',
      title: raw.bidNtceNm || '',
      description: raw.ntceInsttNm ? `발주기관: ${raw.ntceInsttNm}` : undefined,
      budget: this.parseNumber(raw.presmptPrce) || this.parseNumber(raw.asignBdgtAmt),
      currency: 'KRW',
      deadline: this.parseDate(raw.bidClseDt),
      status: 'new',
      rawData: raw,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }
  
  private parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    // 형식: 2026/01/18 17:00
    const match = dateStr.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
    if (match) {
      return new Date(
        parseInt(match[1]),
        parseInt(match[2]) - 1,
        parseInt(match[3]),
        parseInt(match[4]),
        parseInt(match[5])
      );
    }
    return undefined;
  }
  
  private parseNumber(str?: string): number | undefined {
    if (!str) return undefined;
    const num = parseInt(str.replace(/,/g, ''));
    return isNaN(num) ? undefined : num;
  }
}

// API 응답 타입
interface G2BRawBid {
  bidNtceNo?: string;      // 입찰공고번호
  bfSpecRgstNo?: string;   // 사전규격등록번호
  bidNtceNm?: string;      // 입찰공고명
  ntceInsttNm?: string;    // 공고기관명
  dminsttNm?: string;      // 수요기관명
  presmptPrce?: string;    // 추정가격
  asignBdgtAmt?: string;   // 배정예산액
  bidClseDt?: string;      // 입찰마감일시
  opengDt?: string;        // 개찰일시
  ntceKindNm?: string;     // 공고종류명
  cntrctMthdNm?: string;   // 계약방법명
  bidNtceDtlUrl?: string;  // 입찰공고상세URL
}
```

---

## 2.2 UNGM 수집기 (P1)

### `src/lib/tender/collectors/ungm-collector.ts`

```typescript
/**
 * UNGM (UN Global Marketplace) 입찰공고 수집기
 * 
 * API: UNGM Public API
 * URL: https://www.ungm.org/Public/Notice
 * 
 * 특징: 인증 불필요, 공개 API
 */

import { BaseCollector } from './base-collector';
import { 
  Bid, 
  BidFilter, 
  CollectorResult,
  BidSource 
} from '../types';

export class UNGMCollector extends BaseCollector {
  
  constructor() {
    super({
      source: 'ungm',
      baseUrl: 'https://www.ungm.org/Public',
      rateLimit: 30, // 보수적으로 분당 30회
    });
  }
  
  get source(): BidSource {
    return 'ungm';
  }
  
  /**
   * 입찰공고 수집
   */
  async collect(filter?: BidFilter): Promise<CollectorResult> {
    const bids: Bid[] = [];
    const errors: string[] = [];
    
    try {
      // UNGM 공고 목록 API 호출
      const params = this.buildSearchParams(filter);
      
      await this.rateLimitDelay();
      
      const response = await this.client.get('/Notice/Search', {
        params,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const data = response.data;
      
      if (data?.Results) {
        for (const item of data.Results) {
          bids.push(this.parseBid(item));
        }
      }
      
    } catch (error) {
      errors.push(this.handleError(error));
    }
    
    return {
      success: errors.length === 0,
      source: 'ungm',
      count: bids.length,
      bids,
      errors: errors.length > 0 ? errors : undefined,
      collectedAt: new Date(),
    };
  }
  
  private buildSearchParams(filter?: BidFilter): Record<string, string> {
    const params: Record<string, string> = {
      PageIndex: '0',
      PageSize: '50',
      OnlyCurrentlyActive: 'true',
    };
    
    if (filter?.keywords?.length) {
      params.Title = filter.keywords.join(' ');
    }
    
    if (filter?.deadlineAfter) {
      params.DeadlineFrom = filter.deadlineAfter.toISOString().slice(0, 10);
    }
    
    if (filter?.deadlineBefore) {
      params.DeadlineTo = filter.deadlineBefore.toISOString().slice(0, 10);
    }
    
    return params;
  }
  
  /**
   * API 응답을 Bid 객체로 변환
   */
  parseBid(raw: UNGMRawBid): Bid {
    return {
      id: '',
      orgId: '',
      source: 'ungm',
      externalId: raw.Reference || raw.Id?.toString() || '',
      title: raw.Title || '',
      description: raw.Description || undefined,
      budget: undefined, // UNGM은 예산 비공개가 많음
      currency: 'USD',
      deadline: raw.Deadline ? new Date(raw.Deadline) : undefined,
      status: 'new',
      rawData: raw,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

interface UNGMRawBid {
  Id?: number;
  Reference?: string;
  Title?: string;
  Description?: string;
  Organization?: string;
  Deadline?: string;
  PublishedDate?: string;
  NoticeType?: string;
  BeneficiaryCountry?: string;
}
```

---

## 2.3 SAM.gov 수집기 (P2)

### `src/lib/tender/collectors/sam-collector.ts`

```typescript
/**
 * SAM.gov (미국 연방 조달) 수집기
 * 
 * API: SAM.gov Opportunities API
 * URL: https://api.sam.gov/opportunities/v2/search
 * 
 * 요구사항: API Key 필요 (api.sam.gov에서 발급)
 */

import { BaseCollector } from './base-collector';
import { 
  Bid, 
  BidFilter, 
  CollectorResult,
  BidSource 
} from '../types';

export class SAMCollector extends BaseCollector {
  
  constructor() {
    super({
      source: 'sam',
      baseUrl: process.env.SAM_API_URL || 
        'https://api.sam.gov/opportunities/v2',
      apiKey: process.env.SAM_API_KEY,
      rateLimit: 60,
    });
  }
  
  get source(): BidSource {
    return 'sam';
  }
  
  async collect(filter?: BidFilter): Promise<CollectorResult> {
    const bids: Bid[] = [];
    const errors: string[] = [];
    
    try {
      const params: Record<string, string> = {
        api_key: this.config.apiKey || '',
        postedFrom: this.getDateDaysAgo(30),
        postedTo: this.getTodayDate(),
        limit: '100',
      };
      
      if (filter?.keywords?.length) {
        params.q = filter.keywords.join(' ');
      }
      
      await this.rateLimitDelay();
      
      const response = await this.client.get('/search', { params });
      
      const data = response.data;
      
      if (data?.opportunitiesData) {
        for (const item of data.opportunitiesData) {
          bids.push(this.parseBid(item));
        }
      }
      
    } catch (error) {
      errors.push(this.handleError(error));
    }
    
    return {
      success: errors.length === 0,
      source: 'sam',
      count: bids.length,
      bids,
      errors: errors.length > 0 ? errors : undefined,
      collectedAt: new Date(),
    };
  }
  
  parseBid(raw: SAMRawBid): Bid {
    return {
      id: '',
      orgId: '',
      source: 'sam',
      externalId: raw.noticeId || '',
      title: raw.title || '',
      description: raw.description || undefined,
      budget: undefined,
      currency: 'USD',
      deadline: raw.responseDeadLine ? new Date(raw.responseDeadLine) : undefined,
      status: 'new',
      rawData: raw,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }
  
  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

interface SAMRawBid {
  noticeId?: string;
  title?: string;
  description?: string;
  department?: string;
  subTier?: string;
  office?: string;
  responseDeadLine?: string;
  postedDate?: string;
  type?: string;
  baseType?: string;
}
```

---

## 2.4 카자흐스탄 수집기 (P2)

### `src/lib/tender/collectors/kz-collector.ts`

```typescript
/**
 * 카자흐스탄 공공조달 (goszakup.gov.kz) 수집기
 * 
 * API: goszakup.gov.kz 개발자 API
 * 
 * 특징: 러시아어/카자흐어, 계정 등록 필요
 */

import { BaseCollector } from './base-collector';
import { 
  Bid, 
  BidFilter, 
  CollectorResult,
  BidSource 
} from '../types';

export class KZCollector extends BaseCollector {
  
  constructor() {
    super({
      source: 'kz',
      baseUrl: process.env.KZ_GOSZAKUP_API_URL || 
        'https://goszakup.gov.kz/ru/api',
      apiKey: process.env.KZ_GOSZAKUP_API_KEY,
      rateLimit: 30,
    });
  }
  
  get source(): BidSource {
    return 'kz';
  }
  
  async collect(filter?: BidFilter): Promise<CollectorResult> {
    const bids: Bid[] = [];
    const errors: string[] = [];
    
    try {
      // 카자흐스탄 API 구조에 맞게 구현
      // (API 문서 확인 후 상세 구현)
      
      await this.rateLimitDelay();
      
      const response = await this.client.get('/tenders', {
        params: {
          status: 'active',
          limit: 100,
        },
      });
      
      const data = response.data;
      
      if (Array.isArray(data)) {
        for (const item of data) {
          bids.push(this.parseBid(item));
        }
      }
      
    } catch (error) {
      errors.push(this.handleError(error));
    }
    
    return {
      success: errors.length === 0,
      source: 'kz',
      count: bids.length,
      bids,
      errors: errors.length > 0 ? errors : undefined,
      collectedAt: new Date(),
    };
  }
  
  parseBid(raw: KZRawBid): Bid {
    return {
      id: '',
      orgId: '',
      source: 'kz',
      externalId: raw.id?.toString() || '',
      title: raw.name_ru || raw.name_kk || '',
      description: raw.description_ru || undefined,
      budget: raw.amount,
      currency: 'KZT',
      deadline: raw.end_date ? new Date(raw.end_date) : undefined,
      status: 'new',
      rawData: raw,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

interface KZRawBid {
  id?: number;
  name_ru?: string;
  name_kk?: string;
  description_ru?: string;
  description_kk?: string;
  amount?: number;
  end_date?: string;
  customer_name_ru?: string;
  status?: string;
}
```

---

## 2.5 수집기 통합 인덱스

### `src/lib/tender/collectors/index.ts`

```typescript
export { BaseCollector } from './base-collector';
export { G2BCollector } from './g2b-collector';
export { UNGMCollector } from './ungm-collector';
export { SAMCollector } from './sam-collector';
export { KZCollector } from './kz-collector';

import { G2BCollector } from './g2b-collector';
import { UNGMCollector } from './ungm-collector';
import { SAMCollector } from './sam-collector';
import { KZCollector } from './kz-collector';
import { BaseCollector } from './base-collector';
import { BidSource } from '../types';

/**
 * 소스별 수집기 팩토리
 */
export function getCollector(source: BidSource): BaseCollector {
  switch (source) {
    case 'g2b':
      return new G2BCollector();
    case 'ungm':
      return new UNGMCollector();
    case 'sam':
      return new SAMCollector();
    case 'kz':
      return new KZCollector();
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

/**
 * 모든 소스에서 수집
 */
export async function collectAll() {
  const collectors = [
    new G2BCollector(),
    new UNGMCollector(),
    new SAMCollector(),
    new KZCollector(),
  ];
  
  const results = await Promise.allSettled(
    collectors.map(c => c.collect())
  );
  
  return results.map((result, index) => ({
    source: collectors[index].source,
    ...(result.status === 'fulfilled' ? result.value : { 
      success: false, 
      error: result.reason 
    }),
  }));
}
```

---

## 2.6 API Route: 수집 트리거

### `src/app/api/tender/collect/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCollector, collectAll } from '@/lib/tender/collectors';
import { BidSource } from '@/lib/tender/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 사용자 조직 조회
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();
    
    if (!membership) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }
    
    const orgId = membership.org_id;
    
    // 요청 파라미터
    const body = await request.json().catch(() => ({}));
    const source = body.source as BidSource | undefined;
    
    let results;
    
    if (source) {
      // 특정 소스만 수집
      const collector = getCollector(source);
      results = [await collector.collect(body.filter)];
    } else {
      // 모든 소스 수집
      results = await collectAll();
    }
    
    // DB에 저장
    let totalInserted = 0;
    
    for (const result of results) {
      if (result.success && result.bids?.length) {
        const bidsToInsert = result.bids.map(bid => ({
          ...bid,
          org_id: orgId,
        }));
        
        const { data, error } = await supabase
          .from('bids')
          .upsert(bidsToInsert, {
            onConflict: 'source,external_id',
            ignoreDuplicates: true,
          })
          .select();
        
        if (!error && data) {
          totalInserted += data.length;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      totalInserted,
    });
    
  } catch (error) {
    console.error('Collect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## ✅ Phase 2 체크리스트

```
[ ] G2BCollector 구현 및 테스트
[ ] UNGMCollector 구현 및 테스트
[ ] SAMCollector 구현 및 테스트
[ ] KZCollector 구현 및 테스트
[ ] 통합 인덱스 생성
[ ] API Route 구현
[ ] 실제 API 호출 테스트
[ ] DB 저장 테스트
```

---

**다음**: `03_PHASE3_ANALYZERS.md` (입찰 분석기 구현)
