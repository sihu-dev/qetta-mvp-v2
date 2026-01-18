/**
 * UNGM Collector - UN Global Marketplace 공고 수집기
 * Priority: P1 (국제 조달 플랫폼)
 * API: UNGM Public API
 * https://www.ungm.org/
 */

import axios from 'axios';
import type { Bid, CollectResult, Currency } from '../types';
import { BaseCollector } from './base-collector';

interface UNGMRawNotice {
  id: string;
  reference: string;
  title: string;
  description?: string;
  organizationName: string;
  country?: string;
  deadline?: string;
  publishedDate: string;
  noticeType: string;
  unspscCodes?: string[];
  beneficiaryCountries?: string[];
}

interface UNGMApiResponse {
  notices: UNGMRawNotice[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export class UNGMCollector extends BaseCollector {
  private readonly baseUrl = 'https://www.ungm.org/api/Public/Notice';

  constructor() {
    super({
      source: 'ungm',
      api_url: 'https://www.ungm.org/api/Public/Notice',
      rate_limit: 5, // Conservative rate limit
      enabled: true,
    });
  }

  async collect(): Promise<CollectResult> {
    const errors: string[] = [];
    const bids: Bid[] = [];

    try {
      // Search for active notices
      const response = await axios.post<UNGMApiResponse>(
        `${this.baseUrl}/Search`,
        {
          PageIndex: 0,
          PageSize: 100,
          DeadlineFrom: new Date().toISOString().split('T')[0],
          NoticeTypes: ['Contract', 'EOI', 'RFI', 'RFP', 'RFQ'],
          SortField: 'DatePublished',
          SortAscending: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 30000,
        }
      );

      const notices = response.data.notices || [];

      for (const notice of notices) {
        try {
          const bid = this.parseBid(notice);
          bids.push(bid);
        } catch (e) {
          errors.push(`Failed to parse notice ${notice.id}: ${e}`);
        }
        await this.rateLimit();
      }

      return this.createResult(true, bids.length, errors);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.createResult(false, 0, [`UNGM API error: ${message}`]);
    }
  }

  parseBid(raw: unknown): Bid {
    const data = raw as UNGMRawNotice;

    return {
      id: '',
      org_id: '',
      source: 'ungm',
      external_id: data.reference || data.id,
      title: data.title,
      description: this.buildDescription(data),
      budget: null, // UNGM doesn't always expose budget
      currency: 'USD' as Currency, // Default for UN
      deadline: data.deadline || null,
      status: 'new',
      fit_score: null,
      raw_data: data as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private buildDescription(data: UNGMRawNotice): string {
    const parts: string[] = [];

    if (data.organizationName) {
      parts.push(`Organization: ${data.organizationName}`);
    }
    if (data.country) {
      parts.push(`Country: ${data.country}`);
    }
    if (data.noticeType) {
      parts.push(`Type: ${data.noticeType}`);
    }
    if (data.description) {
      parts.push(data.description.substring(0, 500));
    }

    return parts.join(' | ') || 'No description available';
  }
}
