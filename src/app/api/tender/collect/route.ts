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

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { BidSource, CollectResult } from '@/lib/tender/types';

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
}

/**
 * POST /api/tender/collect - Collect bids from a source
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: CollectRequest = await request.json();
    const { orgId, source, filters, limit = 20 } = body;

    if (!orgId || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: orgId, source' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Simulate collection (actual implementation would call external APIs)
    // TODO: Implement actual collectors for each source
    const collectedBids = await simulateCollection(source, filters, limit);

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

    const result: CollectResult = {
      source,
      success: true,
      count: inserted?.length || 0,
      errors: [],
      collected_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      result,
      bids: inserted || [],
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Tender Collect Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

interface SimulatedBid {
  external_id: string;
  title: string;
  description: string | null;
  budget: number | null;
  currency: string;
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
    ],
    ungm: [
      'Digital Transformation Consulting',
      'IT Infrastructure Modernization',
      'Cloud Migration Services',
      'Data Analytics Platform',
      'Cybersecurity Assessment',
    ],
    sam: [
      'Federal IT Modernization',
      'Defense System Integration',
      'Government Cloud Services',
      'Enterprise Software Development',
      'Security Operations Center',
    ],
    kz: [
      'Цифровизация производства',
      'Система мониторинга оборудования',
      'Платформа анализа данных',
      'Интеграция ERP систем',
      'Автоматизация склада',
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
    if (filters?.keyword && !sourceTitles[i].toLowerCase().includes(filters.keyword.toLowerCase())) continue;

    sampleBids.push({
      external_id: `${source.toUpperCase()}-2024-${String(i + 1).padStart(5, '0')}`,
      title: sourceTitles[i],
      description: `${sourceTitles[i]}에 대한 입찰 공고입니다.`,
      budget,
      currency: source === 'kz' ? 'KZT' : source === 'sam' ? 'USD' : 'KRW',
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
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const source = searchParams.get('source') as BidSource | null;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      bids: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Tender List Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
