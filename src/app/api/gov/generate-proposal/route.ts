/**
 * Generate Proposal API Route
 * POST /api/gov/generate-proposal - 7섹션 제안서 생성
 */

import { NextRequest } from 'next/server';
import { generateAllSections } from '@/lib/bizsupport/engines/section-writer';
import type {
  RFPAnalysisResult,
  MatchResult,
  CompanyProfile,
  ProposalSectionType,
} from '@/lib/bizsupport/types';
import { QETTA_COMPANY_PROFILE } from '@/lib/bizsupport/data/gov-programs-2026';
import { parseJson, successResponse, badRequest, internalError } from '@/lib/api';
import { logger } from '@/lib/logging';

interface GenerateProposalRequestBody {
  rfpId: string;
  analysisResult: RFPAnalysisResult;
  matchResult: MatchResult;
  companyProfile?: CompanyProfile;
  sections?: ProposalSectionType[];
  format?: 'docx' | 'pdf' | 'both';
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJson<GenerateProposalRequestBody>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const {
      rfpId,
      analysisResult,
      matchResult,
      companyProfile,
      sections,
    } = parsed.data;

    // Validation
    if (!analysisResult || !matchResult) {
      return badRequest('analysisResult and matchResult are required');
    }

    // 회사 정보 기본값
    const company: CompanyProfile = companyProfile || {
      name: QETTA_COMPANY_PROFILE.name,
      representative: QETTA_COMPANY_PROFILE.representative,
      foundedYear: QETTA_COMPANY_PROFILE.foundedYear,
    };

    // 7섹션 생성
    const startTime = Date.now();
    const generatedSections = await generateAllSections(
      analysisResult,
      matchResult,
      company
    );
    const processingTime = Date.now() - startTime;

    // 필터링 (특정 섹션만 요청한 경우)
    const filteredSections = sections
      ? generatedSections.filter((s) => sections.includes(s.type))
      : generatedSections;

    const proposalId = `proposal-${Date.now()}`;

    return successResponse(
      {
        data: {
          proposalId,
          rfpId,
          sections: filteredSections,
          generatedAt: new Date().toISOString(),
        },
        summary: {
          totalSections: filteredSections.length,
          successCount: filteredSections.filter((s) => s.status === 'generated').length,
          errorCount: filteredSections.filter((s) => s.status === 'error').length,
          totalWords: filteredSections.reduce((sum, s) => sum + s.wordCount, 0),
        },
      },
      { processingTime }
    );
  } catch (error) {
    logger.error('Generate Proposal error', error);
    return internalError(error instanceof Error ? error.message : 'Generation failed');
  }
}
