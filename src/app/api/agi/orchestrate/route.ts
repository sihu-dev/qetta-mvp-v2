/**
 * AGI Orchestrator API Route
 * /api/agi/orchestrate
 *
 * Main entry point for AGI operations
 * Implements 3-Tier Intelligence: 95% Rule -> 4% ML -> 1% Claude
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { techCombiner } from '@/lib/agi/ultra-thinking';
import type { BusinessRequirement, Tier } from '@/lib/agi/types';
import { metrics } from '@/lib/metrics';

export interface OrchestrateRequest {
  type: 'recommend_tech' | 'analyze_events' | 'search_memory' | 'predict';
  orgId: string;
  payload: Record<string, unknown>;
}

export interface OrchestrateResponse {
  success: boolean;
  tier: Tier;
  data?: unknown;
  error?: string;
  metadata: {
    executionTime: number;
    tokensUsed?: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<OrchestrateResponse>> {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const body: OrchestrateRequest = await request.json();
    const { type, orgId, payload } = body;

    if (!type || !orgId) {
      statusCode = 400;
      return NextResponse.json(
        {
          success: false,
          tier: 'rule' as Tier,
          error: 'Missing required fields: type, orgId',
          metadata: { executionTime: Date.now() - startTime },
        },
        { status: 400 }
      );
    }

    let result: unknown;
    let tier: Tier = 'rule';
    let tokensUsed = 0;

    switch (type) {
      case 'recommend_tech': {
        // Tier 3: Claude API (Tech Combiner)
        tier = 'claude';
        const requirement = payload as unknown as BusinessRequirement;
        const recommendation = await techCombiner.recommend(requirement);
        result = recommendation;
        tokensUsed = 4000; // Estimated
        break;
      }

      case 'analyze_events': {
        // Tier 1: Rule-based analysis first
        tier = 'rule';
        const supabase = createServerClient();

        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .eq('org_id', orgId)
          .order('occurred_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Simple rule-based analysis
        const alarmCount = events?.filter((e) => e.alarm_active).length || 0;
        const statusCounts: Record<string, number> = {};

        events?.forEach((e) => {
          statusCounts[e.machine_state] = (statusCounts[e.machine_state] || 0) + 1;
        });

        result = {
          totalEvents: events?.length || 0,
          alarmCount,
          statusDistribution: statusCounts,
          recentAlarms: events?.filter((e) => e.alarm_active).slice(0, 5),
        };
        break;
      }

      case 'search_memory': {
        // Tier 2: ML-based vector search
        tier = 'ml';
        const { query } = payload as { query: string; limit?: number };

        // For now, return placeholder
        // TODO: Implement vector embedding generation and search
        result = {
          query,
          matches: [],
          note: 'Vector search implementation pending',
        };
        break;
      }

      case 'predict': {
        // Tier 1 -> 2: Start with rules, escalate to ML
        tier = 'rule';
        const { target, assetId } = payload as { target: string; assetId: string };

        // Simple rule-based prediction
        const supabase = createServerClient();
        const { data: recentEvents } = await supabase
          .from('events')
          .select('*')
          .eq('org_id', orgId)
          .eq('asset_id', assetId)
          .order('occurred_at', { ascending: false })
          .limit(50);

        const alarmRate = (recentEvents?.filter((e) => e.alarm_active).length || 0) / Math.max(recentEvents?.length || 1, 1);

        result = {
          target,
          assetId,
          prediction: {
            riskLevel: alarmRate > 0.3 ? 'high' : alarmRate > 0.1 ? 'medium' : 'low',
            alarmRate: Math.round(alarmRate * 100),
            confidence: 0.7,
            recommendation: alarmRate > 0.3
              ? 'Preventive maintenance recommended'
              : 'Normal operation',
          },
        };
        break;
      }

      default:
        statusCode = 400;
        return NextResponse.json(
          {
            success: false,
            tier: 'rule',
            error: `Unknown operation type: ${type}`,
            metadata: { executionTime: Date.now() - startTime },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      tier,
      data: result,
      metadata: {
        executionTime: Date.now() - startTime,
        tokensUsed: tokensUsed > 0 ? tokensUsed : undefined,
      },
    });

  } catch (error) {
    console.error('AGI Orchestrate Error:', error);
    statusCode = 500;
    return NextResponse.json(
      {
        success: false,
        tier: 'rule',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { executionTime: Date.now() - startTime },
      },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest('POST', '/api/agi/orchestrate', statusCode, (Date.now() - startTime) / 1000);
  }
}
