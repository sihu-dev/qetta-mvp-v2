/**
 * SAM Collector - SAM.gov 미국 정부 조달 수집기
 * Priority: P2 (미국 정부 조달)
 * API: SAM.gov Entity/Opportunities API
 * https://sam.gov/
 */

import axios from 'axios';
import type { Bid, CollectResult, Currency } from '../types';
import { BaseCollector } from './base-collector';

interface SAMRawOpportunity {
  noticeId: string;
  title: string;
  description?: string;
  department?: string;
  subTier?: string;
  office?: string;
  postedDate: string;
  responseDeadLine?: string;
  archiveDate?: string;
  type: string;
  baseType: string;
  setAsideDescription?: string;
  naicsCode?: string;
  classificationCode?: string;
  pointOfContact?: Array<{
    fullName?: string;
    email?: string;
    phone?: string;
  }>;
  placeOfPerformance?: {
    city?: { name?: string };
    state?: { code?: string };
    country?: { code?: string };
  };
  award?: {
    amount?: number;
  };
}

interface SAMApiResponse {
  totalRecords: number;
  limit: number;
  offset: number;
  opportunitiesData: SAMRawOpportunity[];
}

export class SAMCollector extends BaseCollector {
  private readonly baseUrl = 'https://api.sam.gov/opportunities/v2/search';

  constructor(apiKey: string) {
    super({
      source: 'sam',
      api_key: apiKey,
      api_url: 'https://api.sam.gov/opportunities/v2/search',
      rate_limit: 10,
      enabled: true,
    });
  }

  async collect(): Promise<CollectResult> {
    const errors: string[] = [];
    const bids: Bid[] = [];

    try {
      // Get today's date for filtering active opportunities
      const today = new Date();
      const postedFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      const response = await axios.get<SAMApiResponse>(this.baseUrl, {
        params: {
          api_key: this.config.api_key,
          limit: 100,
          offset: 0,
          postedFrom: this.formatDate(postedFrom),
          postedTo: this.formatDate(today),
          ptype: 'o,p,k', // o=solicitation, p=presolicitation, k=combined
          status: 'active',
        },
        headers: {
          Accept: 'application/json',
        },
        timeout: 30000,
      });

      const opportunities = response.data.opportunitiesData || [];

      for (const opp of opportunities) {
        try {
          const bid = this.parseBid(opp);
          bids.push(bid);
        } catch (e) {
          errors.push(`Failed to parse opportunity ${opp.noticeId}: ${e}`);
        }
        await this.rateLimit();
      }

      return this.createResult(true, bids.length, errors);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.createResult(false, 0, [`SAM.gov API error: ${message}`]);
    }
  }

  parseBid(raw: unknown): Bid {
    const data = raw as SAMRawOpportunity;

    return {
      id: '',
      org_id: '',
      source: 'sam',
      external_id: data.noticeId,
      title: data.title,
      description: this.buildDescription(data),
      budget: data.award?.amount || null,
      currency: 'USD' as Currency,
      deadline: data.responseDeadLine || null,
      status: 'new',
      fit_score: null,
      raw_data: data as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private buildDescription(data: SAMRawOpportunity): string {
    const parts: string[] = [];

    if (data.department) {
      parts.push(`Department: ${data.department}`);
    }
    if (data.office) {
      parts.push(`Office: ${data.office}`);
    }
    if (data.type) {
      parts.push(`Type: ${data.type}`);
    }
    if (data.setAsideDescription) {
      parts.push(`Set-Aside: ${data.setAsideDescription}`);
    }
    if (data.naicsCode) {
      parts.push(`NAICS: ${data.naicsCode}`);
    }
    if (data.placeOfPerformance?.state?.code) {
      parts.push(`Location: ${data.placeOfPerformance.state.code}`);
    }
    if (data.description) {
      parts.push(data.description.substring(0, 300));
    }

    return parts.join(' | ') || 'No description available';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '/');
  }
}
