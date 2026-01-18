/**
 * Regenerate Section API Route
 * POST /api/gov/regenerate-section - 특정 섹션 재생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { regenerateSection } from '@/lib/bizsupport/engines/section-writer';
import type {
  RFPAnalysisResult,
  MatchResult,
  CompanyProfile,
  ProposalSectionType,
} from '@/lib/bizsupport/types';
import { QETTA_COMPANY_PROFILE } from '@/lib/bizsupport/data/gov-programs-2026';
import { parseJson } from '@/lib/api';
import { logger } from '@/lib/logging';

interface RegenerateSectionRequestBody {
  proposalId: string;
  sectionType: ProposalSectionType;
  analysisResult: RFPAnalysisResult;
  matchResult: MatchResult;
  companyProfile?: CompanyProfile;
  feedback?: string;
  style?: 'formal' | 'technical' | 'persuasive';
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson<RegenerateSectionRequestBody>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const {
      proposalId,
      sectionType,
      analysisResult,
      matchResult,
      companyProfile,
      feedback,
      style,
    } = parsed.data;

    // Validation
    if (!sectionType) {
      return NextResponse.json(
        {
          success: false,
          error: 'sectionType is required',
        },
        { status: 400 }
      );
    }

    if (!analysisResult || !matchResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'analysisResult and matchResult are required',
        },
        { status: 400 }
      );
    }

    // 유효한 섹션 타입 확인
    const validSections: ProposalSectionType[] = [
      'UNDERSTANDING',
      'SOLUTION',
      'TECHNICAL',
      'EXECUTION_PLAN',
      'TEAM',
      'EXPERIENCE',
      'COST_ROI',
    ];

    if (!validSections.includes(sectionType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sectionType. Must be one of: ${validSections.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 회사 정보 기본값
    const company: CompanyProfile = companyProfile || {
      name: QETTA_COMPANY_PROFILE.name,
      representative: QETTA_COMPANY_PROFILE.representative,
      foundedYear: QETTA_COMPANY_PROFILE.foundedYear,
    };

    // 섹션 재생성
    const startTime = Date.now();
    const regeneratedSection = await regenerateSection(
      sectionType,
      analysisResult,
      matchResult,
      company,
      feedback
    );
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        proposalId,
        section: regeneratedSection,
        regeneratedAt: new Date().toISOString(),
      },
      feedback: feedback || null,
      style: style || 'balanced',
      processingTime,
    });
  } catch (error) {
    logger.error('Regenerate Section error', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Regeneration failed',
      },
      { status: 500 }
    );
  }
}
