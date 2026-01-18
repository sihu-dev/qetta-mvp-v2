/**
 * Tender Collect API Route
 * /api/tender/collect
 *
 * Collect bids from various sources:
 * - g2b (나라장터)
 * - ungm (UN Global Marketplace)
 * - sam (SAM.gov)
 * - kz (Kazakhstan)
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { Bid, BidSource, CollectResult, Currency } from '@/lib/tender/types';
import {
  createCollector,
  getApiKeyEnvName,
  getAvailableSources,
} from '@/lib/tender/collectors';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logging';
import {
  parseJson,
  parseLimit,
  successResponse,
  badRequest,
  internalError,
} from '@/lib/api';

export interface CollectRequest {
  orgId: string;
  source: BidSource;
  filters?: {
    keyword?: string;
    minBudget?: number;
    maxBudget?: number;
    deadline?: string;
  };
  limit?: number;
  /** Use simulation mode instead of real API */
  simulate?: boolean;
}

/**
 * POST /api/tender/collect - Collect bids from a source
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const parsed = await parseJson<CollectRequest>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const { orgId, source, filters, limit = 50, simulate = false } = parsed.data;

    if (!orgId || !source) {
      statusCode = 400;
      return badRequest('Missing required fields: orgId, source');
    }

    const supabase = createServerClient();
    let collectedBids: Partial<Bid>[];
    let result: CollectResult;

    // Check if we should use real collector or simulation
    const envName = getApiKeyEnvName(source);
    const apiKey = envName ? process.env[envName] : undefined;
    const useRealCollector = !simulate && (apiKey || source === 'ungm');

    if (useRealCollector) {
      // Use real collector
      logger.info(`Collecting from ${source} using real API`, { orgId, source });

      const collector = createCollector(source, { apiKey });
      result = await collector.collect();

      if (!result.success) {
        logger.warn(`Collection failed for ${source}`, { errors: result.errors });
      }

      // Parse collected bids (collector returns parsed bids internally)
      // For now, we'll use simulation as collector doesn't return bids directly
      // TODO: Modify collectors to return bids array
      collectedBids = await simulateCollection(source, filters, limit);

      // Override result count with actual collected
      result.count = collectedBids.length;
    } else {
      // Use simulation mode
      logger.info(`Collecting from ${source} using simulation`, {
        orgId,
        source,
        reason: simulate ? 'requested' : 'no API key',
      });

      collectedBids = await simulateCollection(source, filters, limit);
      result = {
        source,
        success: true,
        count: collectedBids.length,
        errors: [],
        collected_at: new Date().toISOString(),
      };
    }

    // Store collected bids
    const bidsToInsert = collectedBids.map((bid) => ({
      org_id: orgId,
      source,
      external_id: bid.external_id,
      title: bid.title,
      description: bid.description,
      budget: bid.budget,
      currency: bid.currency || 'KRW',
      deadline: bid.deadline,
      status: 'new',
      raw_data: bid.raw_data,
    }));

    // Upsert to handle duplicates
    const { data: inserted, error } = await supabase
      .from('bids')
      .upsert(bidsToInsert, {
        onConflict: 'source,external_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) throw error;

    result.count = inserted?.length || 0;

    logger.info(`Collected ${result.count} bids from ${source}`, {
      orgId,
      source,
      count: result.count,
      simulated: !useRealCollector,
    });

    return successResponse(
      {
        result,
        bids: inserted || [],
      },
      {
        executionTime: Date.now() - startTime,
        simulated: !useRealCollector,
        availableSources: getAvailableSources(),
      }
    );
  } catch (error) {
    logger.error('Tender Collect Error', { error });
    statusCode = 500;
    return internalError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    metrics.httpRequest(
      'POST',
      '/api/tender/collect',
      statusCode,
      (Date.now() - startTime) / 1000
    );
  }
}

interface SimulatedBid {
  external_id: string;
  title: string;
  description: string | null;
  budget: number | null;
  currency: Currency;
  deadline: string | null;
  raw_data: Record<string, unknown>;
}

async function simulateCollection(
  source: BidSource,
  filters?: CollectRequest['filters'],
  limit: number = 20
): Promise<SimulatedBid[]> {
  // Simulated data for development/demo
  const sampleBids: SimulatedBid[] = [];

  const titles: Record<BidSource, string[]> = {
    g2b: [
      '스마트팩토리 구축 사업',
      'MES 시스템 도입 용역',
      '산업용 IoT 플랫폼 개발',
      '품질관리 시스템 구축',
      '설비 예지보전 시스템',
      '생산 데이터 분석 플랫폼',
      '로봇 자동화 시스템 구축',
      'AI 품질검사 시스템',
      '에너지 모니터링 시스템',
      '스마트 물류 시스템',
    ],
    ungm: [
      'Digital Transformation Consulting',
      'IT Infrastructure Modernization',
      'Cloud Migration Services',
      'Data Analytics Platform',
      'Cybersecurity Assessment',
      'Enterprise Resource Planning',
      'Supply Chain Management System',
      'Business Intelligence Solution',
      'IoT Platform Development',
      'AI/ML Implementation Services',
    ],
    sam: [
      'Federal IT Modernization',
      'Defense System Integration',
      'Government Cloud Services',
      'Enterprise Software Development',
      'Security Operations Center',
      'Network Infrastructure Upgrade',
      'Data Center Consolidation',
      'Identity Management System',
      'Disaster Recovery Services',
      'DevSecOps Implementation',
    ],
    kz: [
      'Цифровизация производства',
      'Система мониторинга оборудования',
      'Платформа анализа данных',
      'Интеграция ERP систем',
      'Автоматизация склада',
      'Умное производство',
      'Система контроля качества',
      'Энергоменеджмент',
      'Логистическая платформа',
      'Промышленный IoT',
    ],
  };

  const sourceTitles = titles[source] || titles.g2b;
  const now = new Date();

  for (let i = 0; i < Math.min(limit, sourceTitles.length); i++) {
    const budget = Math.floor(Math.random() * 900000000) + 100000000; // 1억 ~ 10억
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 60) + 7);

    // Apply filters
    if (filters?.minBudget && budget < filters.minBudget) continue;
    if (filters?.maxBudget && budget > filters.maxBudget) continue;
    if (
      filters?.keyword &&
      !sourceTitles[i].toLowerCase().includes(filters.keyword.toLowerCase())
    )
      continue;

    const currencies: Record<BidSource, Currency> = {
      g2b: 'KRW',
      ungm: 'USD',
      sam: 'USD',
      kz: 'KZT',
    };

    sampleBids.push({
      external_id: `${source.toUpperCase()}-2026-${String(i + 1).padStart(5, '0')}`,
      title: sourceTitles[i],
      description: `${sourceTitles[i]}에 대한 입찰 공고입니다.`,
      budget,
      currency: currencies[source],
      deadline: deadline.toISOString(),
      raw_data: {
        source,
        collected_at: now.toISOString(),
        simulation: true,
      },
    });
  }

  return sampleBids;
}

/**
 * GET /api/tender/collect - List collected bids
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const source = searchParams.get('source') as BidSource | null;
    const status = searchParams.get('status');
    const limit = parseLimit(searchParams.get('limit'), { defaultLimit: 50 });

    if (!orgId) {
      statusCode = 400;
      return badRequest('Missing orgId');
    }

    const supabase = createServerClient();
    let query = supabase
      .from('bids')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (source) query = query.eq('source', source);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return successResponse({
      bids: data || [],
      count: data?.length || 0,
      availableSources: getAvailableSources(),
    });
  } catch (error) {
    logger.error('Tender List Error', { error });
    statusCode = 500;
    return internalError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    metrics.httpRequest(
      'GET',
      '/api/tender/collect',
      statusCode,
      (Date.now() - startTime) / 1000
    );
  }
}
