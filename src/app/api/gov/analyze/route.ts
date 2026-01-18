/**
 * RFP Analyze API Route
 * POST /api/gov/analyze - 4-Layer RFP 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeRFP } from '@/lib/bizsupport/engines/deep-rfp-analyzer';
import type { AnalyzeRequest, ClientType } from '@/lib/bizsupport/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rfpText, rfpUrl, clientType, options } = body as {
      rfpText?: string;
      rfpUrl?: string;
      clientType?: ClientType;
      options?: AnalyzeRequest['options'];
    };

    // Validation
    if (!rfpText && !rfpUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either rfpText or rfpUrl is required',
        },
        { status: 400 }
      );
    }

    // URL에서 텍스트 추출 (TODO: 웹 스크래핑)
    const text = rfpText || '';
    if (rfpUrl && !rfpText) {
      // Placeholder: URL 처리
      return NextResponse.json(
        {
          success: false,
          error: 'URL processing not yet implemented. Please provide rfpText.',
        },
        { status: 400 }
      );
    }

    // 4-Layer 분석 실행
    const startTime = Date.now();
    const result = await analyzeRFP({
      rfpText: text,
      rfpUrl,
      clientType,
      options,
    });
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result,
      processingTime,
      layers: {
        layer1: 'Metadata extraction',
        layer2a: 'TF-IDF keywords',
        layer2b: 'Semantic matching (pgvector)',
        layer3: 'Hidden needs inference (Claude)',
        layer4: 'Strategy formulation',
      },
    });
  } catch (error) {
    console.error('[API] RFP Analyze error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}
