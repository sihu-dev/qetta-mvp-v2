/**
 * KZ Collector - Kazakhstan 정부 조달 수집기
 * Priority: P2 (카자흐스탄 조달)
 * API: goszakup.gov.kz GraphQL API
 * https://goszakup.gov.kz/
 */

import axios from 'axios';
import type { Bid, CollectResult, Currency } from '../types';
import { BaseCollector } from './base-collector';

interface KZRawAnnouncement {
  id: string;
  number_anno: string;
  name_ru: string;
  name_kz?: string;
  total_sum: number;
  count_lots: number;
  start_date: string;
  end_date: string;
  publish_date: string;
  customer_name_ru: string;
  customer_bin?: string;
  status: string;
  trade_method?: string;
  lots?: Array<{
    id: string;
    lot_number: string;
    name_ru: string;
    amount: number;
    count: number;
  }>;
}

interface KZGraphQLResponse {
  data: {
    Announcements: KZRawAnnouncement[];
  };
}

export class KZCollector extends BaseCollector {
  private readonly baseUrl = 'https://ows.goszakup.gov.kz/v3/graphql';

  constructor(apiKey: string) {
    super({
      source: 'kz',
      api_key: apiKey,
      api_url: 'https://ows.goszakup.gov.kz/v3/graphql',
      rate_limit: 5,
      enabled: true,
    });
  }

  async collect(): Promise<CollectResult> {
    const errors: string[] = [];
    const bids: Bid[] = [];

    try {
      const query = `
        query GetAnnouncements($filter: AnnouncementFilter, $limit: Int) {
          Announcements(filter: $filter, limit: $limit) {
            id
            number_anno
            name_ru
            name_kz
            total_sum
            count_lots
            start_date
            end_date
            publish_date
            customer_name_ru
            customer_bin
            status
            trade_method
            lots {
              id
              lot_number
              name_ru
              amount
              count
            }
          }
        }
      `;

      const today = new Date();
      const variables = {
        filter: {
          status: 'PUBLISHED',
          end_date_from: today.toISOString().split('T')[0],
        },
        limit: 100,
      };

      const response = await axios.post<KZGraphQLResponse>(
        this.baseUrl,
        { query, variables },
        {
          headers: {
            Authorization: `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 30000,
        }
      );

      const announcements = response.data.data?.Announcements || [];

      for (const anno of announcements) {
        try {
          const bid = this.parseBid(anno);
          bids.push(bid);
        } catch (e) {
          errors.push(`Failed to parse announcement ${anno.id}: ${e}`);
        }
        await this.rateLimit();
      }

      return this.createResult(true, bids.length, errors);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.createResult(false, 0, [`KZ Goszakup API error: ${message}`]);
    }
  }

  parseBid(raw: unknown): Bid {
    const data = raw as KZRawAnnouncement;

    return {
      id: '',
      org_id: '',
      source: 'kz',
      external_id: data.number_anno || data.id,
      title: data.name_ru,
      description: this.buildDescription(data),
      budget: data.total_sum || null,
      currency: 'KZT' as Currency, // Kazakhstani Tenge
      deadline: data.end_date || null,
      status: 'new',
      fit_score: null,
      raw_data: data as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private buildDescription(data: KZRawAnnouncement): string {
    const parts: string[] = [];

    if (data.customer_name_ru) {
      parts.push(`Customer: ${data.customer_name_ru}`);
    }
    if (data.trade_method) {
      parts.push(`Method: ${data.trade_method}`);
    }
    if (data.count_lots) {
      parts.push(`Lots: ${data.count_lots}`);
    }
    if (data.lots && data.lots.length > 0) {
      const lotNames = data.lots
        .slice(0, 3)
        .map((l) => l.name_ru)
        .join(', ');
      parts.push(`Items: ${lotNames}`);
    }

    return parts.join(' | ') || 'No description available';
  }
}
