/**
 * Strength Match API Route
 * POST /api/gov/match - Needs-Strength 매칭
 */

import { NextRequest, NextResponse } from 'next/server';
import { matchStrengths, getRecommendationLabel } from '@/lib/bizsupport/engines/needs-strength-matcher';
import type { RFPAnalysisResult, ClientType } from '@/lib/bizsupport/types';
import { parseJson } from '@/lib/api';
import { logger } from '@/lib/logging';

interface MatchRequestBody {
  rfpId: string;
  analysisResult: RFPAnalysisResult;
  clientType: ClientType;
  customStrengths?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson<MatchRequestBody>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const { rfpId, analysisResult, clientType, customStrengths } = parsed.data;

    // Validation
    if (!analysisResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'analysisResult is required',
        },
        { status: 400 }
      );
    }

    if (!clientType) {
      return NextResponse.json(
        {
          success: false,
          error: 'clientType is required',
        },
        { status: 400 }
      );
    }

    // 매칭 실행
    const result = await matchStrengths({
      rfpId,
      analysisResult,
      clientType,
      customStrengths,
    });

    return NextResponse.json({
      success: true,
      data: result,
      summary: {
        topStrengths: result.topStrengths,
        overallScore: result.overallScore,
        recommendation: result.recommendation,
        recommendationLabel: getRecommendationLabel(result.recommendation),
        totalMatches: result.matches.length,
      },
    });
  } catch (error) {
    logger.error('Match error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Matching failed',
      },
      { status: 500 }
    );
  }
}
