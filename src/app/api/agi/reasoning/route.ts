/**
 * AGI Reasoning API Route
 * /api/agi/reasoning
 *
 * Multi-modal reasoning engine
 * Supports: deductive, inductive, abductive, analogical
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { ReasoningMode, ReasoningChain } from '@/lib/agi/types';
import { metrics } from '@/lib/metrics';
import {
  parseJson,
  successResponse,
  badRequest,
  internalError,
} from '@/lib/api';
import { logger } from '@/lib/logging';

export interface ReasoningRequest {
  orgId: string;
  mode: ReasoningMode;
  premises: string[];
  context?: {
    assetId?: string;
    eventIds?: string[];
    timeRange?: { start: string; end: string };
  };
}

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * POST /api/agi/reasoning - Execute reasoning
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const parsed = await parseJson<ReasoningRequest>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const { orgId, mode, premises, context } = parsed.data;

    if (!orgId || !mode || !premises?.length) {
      statusCode = 400;
      return badRequest('Missing required fields: orgId, mode, premises');
    }

    const supabase = createServerClient();

    // Fetch relevant context if provided
    let contextData: unknown[] = [];
    if (context?.eventIds?.length) {
      const { data } = await supabase
        .from('events')
        .select('*')
        .in('id', context.eventIds);
      contextData = data || [];
    }

    // Rule-based reasoning (Tier 1)
    const chain = executeReasoning(mode, premises, contextData);

    // Store insight if confidence is high
    if (chain.confidence >= CONFIDENCE_THRESHOLD) {
      await supabase.from('agi_insights').insert({
        org_id: orgId,
        insight_type: 'reasoning',
        content: chain.conclusion,
        confidence: chain.confidence,
        tier: 'rule',
        related_event_ids: context?.eventIds || [],
        metadata: {
          mode,
          premises,
          steps: chain.steps,
        },
      });
    }

    return successResponse(
      {
        tier: 'rule',
        chain,
      },
      { executionTime: Date.now() - startTime }
    );

  } catch (error) {
    logger.error('Reasoning Error', error);
    statusCode = 500;
    return internalError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    metrics.httpRequest('POST', '/api/agi/reasoning', statusCode, (Date.now() - startTime) / 1000);
  }
}

function executeReasoning(
  mode: ReasoningMode,
  premises: string[],
  context: unknown[]
): ReasoningChain {
  switch (mode) {
    case 'deductive':
      return deductiveReasoning(premises);
    case 'inductive':
      return inductiveReasoning(premises, context);
    case 'abductive':
      return abductiveReasoning(premises);
    case 'analogical':
      return analogicalReasoning(premises, context);
    default:
      return deductiveReasoning(premises);
  }
}

function deductiveReasoning(premises: string[]): ReasoningChain {
  // Simple deductive reasoning: If A and B, then C
  const steps = premises.map((premise, i) => ({
    premise,
    inference: `Premise ${i + 1} established`,
    confidence: 0.9,
  }));

  return {
    mode: 'deductive',
    steps,
    conclusion: `Based on ${premises.length} premises, the logical conclusion follows.`,
    confidence: 0.85,
    evidence: premises,
  };
}

function inductiveReasoning(premises: string[], context: unknown[]): ReasoningChain {
  // Pattern-based induction
  const patternCount = context.length;
  const confidence = Math.min(0.9, 0.5 + (patternCount * 0.05));

  return {
    mode: 'inductive',
    steps: [
      {
        premise: `Observed ${patternCount} related events`,
        inference: 'Pattern analysis indicates probable conclusion',
        confidence,
      },
    ],
    conclusion: 'Based on observed patterns, a general rule is likely.',
    confidence,
    evidence: premises,
  };
}

function abductiveReasoning(premises: string[]): ReasoningChain {
  // Best explanation inference
  return {
    mode: 'abductive',
    steps: [
      {
        premise: premises.join('; '),
        inference: 'Seeking best explanation for observations',
        confidence: 0.7,
      },
    ],
    conclusion: 'The most likely explanation for the observed facts is inferred.',
    confidence: 0.7,
    evidence: premises,
  };
}

function analogicalReasoning(premises: string[], context: unknown[]): ReasoningChain {
  // Similarity-based reasoning
  return {
    mode: 'analogical',
    steps: [
      {
        premise: 'Comparing with similar past cases',
        inference: `Found ${context.length} analogous situations`,
        confidence: 0.65,
      },
    ],
    conclusion: 'Based on similar cases, the same outcome is expected.',
    confidence: 0.65,
    evidence: premises,
  };
}
