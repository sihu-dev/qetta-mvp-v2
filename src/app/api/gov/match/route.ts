/**
 * Strength Match API Route
 * POST /api/gov/match - Needs-Strength 매칭
 */

import { NextRequest, NextResponse } from 'next/server';
import { matchStrengths, getRecommendationLabel } from '@/lib/bizsupport/engines/needs-strength-matcher';
import type { MatchRequest, RFPAnalysisResult, ClientType } from '@/lib/bizsupport/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rfpId, analysisResult, clientType, customStrengths } = body as {
      rfpId: string;
      analysisResult: RFPAnalysisResult;
      clientType: ClientType;
      customStrengths?: string[];
    };

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
    console.error('[API] Match error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Matching failed',
      },
      { status: 500 }
    );
  }
}
