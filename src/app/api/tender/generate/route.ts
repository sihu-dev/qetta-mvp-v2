/**
 * Tender Generate API Route
 * /api/tender/generate
 *
 * Generate proposal documents (DOCX, XLSX, PPTX)
 * Supports both manual data input and automatic generation from bid analysis
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DocxBuilder, type DocxContent } from '@/lib/docs/docx-builder';
import { PptxBuilder, type ProposalPptData } from '@/lib/docs/pptx-builder';
import { XlsxBuilder, type QuotationData } from '@/lib/docs/xlsx-builder';
import {
  generateBidDocuments,
  type BidDocumentInput,
} from '@/lib/docs/bid-document-generator';
import {
  analyzeBid,
  calculateFitScore,
  analyzeCompetitors,
  type CompanyProfile,
} from '@/lib/tender/analyzers';
import type { Bid, DocumentType, DocumentFormat } from '@/lib/tender/types';
import * as path from 'path';
import * as os from 'os';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logging';
import {
  parseJson,
  parseLimit,
  successResponse,
  badRequest,
  notFound,
  internalError,
} from '@/lib/api';
import { DEMO_COMPANY_PROFILE } from '@/lib/config/constants';

export interface GenerateRequest {
  bidId?: string;
  orgId: string;
  docType?: DocumentType;
  format?: DocumentFormat;
  // Auto-generate mode (from bid analysis)
  autoGenerate?: boolean;
  documentTypes?: ('proposal' | 'quotation' | 'presentation')[];
  companyProfile?: CompanyProfile;
  returnBuffer?: boolean;
  // Manual mode
  data?: {
    title: string;
    company: {
      name: string;
      representative?: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    sections?: Array<{
      title: string;
      content?: string;
      bullets?: string[];
    }>;
    items?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      unit?: string;
    }>;
  };
}

/**
 * POST /api/tender/generate - Generate a document
 * Supports two modes:
 * 1. autoGenerate: true - Generate from bid analysis (bidId required)
 * 2. Manual mode - Provide data directly
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const parsed = await parseJson<GenerateRequest>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const {
      bidId,
      orgId,
      autoGenerate,
      documentTypes,
      companyProfile,
      returnBuffer,
      docType,
      format,
      data,
    } = parsed.data;

    if (!orgId) {
      statusCode = 400;
      return badRequest('Missing required field: orgId');
    }

    const supabase = createServerClient();

    // ═══════════════════════════════════════════════════════════
    // Auto-generate mode: Generate from bid analysis
    // ═══════════════════════════════════════════════════════════
    if (autoGenerate) {
      if (!bidId) {
        statusCode = 400;
        return badRequest('bidId is required for auto-generate mode');
      }

      logger.info('Auto-generating documents from bid analysis', { bidId, orgId });

      // Fetch the bid
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .select('*')
        .eq('id', bidId)
        .single();

      if (bidError) throw bidError;
      if (!bid) {
        statusCode = 404;
        return notFound('Bid');
      }

      // Default company profile
      const profile: CompanyProfile = companyProfile || DEMO_COMPANY_PROFILE;

      // Convert to typed Bid
      const typedBid: Bid = {
        id: bid.id,
        org_id: bid.org_id,
        source: bid.source,
        external_id: bid.external_id,
        title: bid.title,
        description: bid.description,
        budget: bid.budget,
        currency: bid.currency,
        deadline: bid.deadline,
        status: bid.status,
        fit_score: bid.fit_score,
        raw_data: bid.raw_data,
        created_at: bid.created_at,
        updated_at: bid.updated_at,
      };

      // Run analysis
      const analysis = await analyzeBid(typedBid, profile);
      const fitScore = calculateFitScore(typedBid, profile, analysis);
      const competitorAnalysis = await analyzeCompetitors(typedBid);

      // Prepare document input
      const docInput: BidDocumentInput = {
        bid: typedBid,
        analysis,
        fitScore,
        competitorAnalysis,
        companyProfile: profile,
      };

      // Output directory
      const outputDir = path.join(os.tmpdir(), 'qetta-docs', bidId);

      // Generate documents
      const types = documentTypes || ['proposal', 'quotation', 'presentation'];
      const results = await generateBidDocuments(docInput, {
        outputDir,
        generateProposal: types.includes('proposal'),
        generateQuotation: types.includes('quotation'),
        generatePresentation: types.includes('presentation'),
      });

      // Prepare response
      const response: {
        success: boolean;
        mode: string;
        documents: typeof results;
        summary: {
          bidId: string;
          bidTitle: string;
          fitScore: number;
          fitGrade: string;
          generatedAt: string;
          outputDir: string;
        };
        buffers?: Record<string, string>;
        metadata: {
          executionTime: number;
        };
      } = {
        success: true,
        mode: 'auto-generate',
        documents: results,
        summary: {
          bidId,
          bidTitle: typedBid.title,
          fitScore: fitScore.overall,
          fitGrade: fitScore.grade,
          generatedAt: new Date().toISOString(),
          outputDir,
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };

      // Optionally include base64 buffers
      if (returnBuffer) {
        response.buffers = {};
        const fs = await import('fs');

        if (results.proposal?.success && results.proposal.filePath) {
          const buffer = fs.readFileSync(results.proposal.filePath);
          response.buffers.proposal = buffer.toString('base64');
        }
        if (results.quotation?.success && results.quotation.filePath) {
          const buffer = fs.readFileSync(results.quotation.filePath);
          response.buffers.quotation = buffer.toString('base64');
        }
        if (results.presentation?.success && results.presentation.filePath) {
          const buffer = fs.readFileSync(results.presentation.filePath);
          response.buffers.presentation = buffer.toString('base64');
        }
      }

      logger.info('Auto-generate completed', {
        bidId,
        proposal: results.proposal?.success,
        quotation: results.quotation?.success,
        presentation: results.presentation?.success,
      });

      return successResponse(
        {
          mode: response.mode,
          documents: response.documents,
          summary: response.summary,
          buffers: response.buffers,
        },
        response.metadata
      );
    }

    // ═══════════════════════════════════════════════════════════
    // Manual mode: Generate from provided data
    // ═══════════════════════════════════════════════════════════
    if (!docType || !format || !data) {
      statusCode = 400;
      return badRequest('Missing required fields: docType, format, data (or use autoGenerate: true)');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manualOutputDir = `/tmp/qetta/documents/${orgId}`;
    const filename = `${docType}_${timestamp}`;
    const outputPath = path.join(manualOutputDir, filename);

    let result;

    switch (format) {
      case 'docx': {
        const docxContent: DocxContent = {
          title: data.title,
          subtitle: `${docType === 'proposal' ? '제안서' : '문서'}`,
          company: {
            name: data.company.name,
            representative: data.company.representative,
            email: data.company.email,
            contact: data.company.phone,
            address: data.company.address,
          },
          sections: (data.sections || []).map((s, i) => ({
            title: s.title,
            level: 1 as const,
            content: s.content,
            bullets: s.bullets,
            pageBreak: i > 0,
          })),
        };

        const builder = new DocxBuilder({ language: 'ko' });
        builder.createProposal(docxContent);
        result = await builder.save(`${outputPath}.docx`);
        break;
      }

      case 'pptx': {
        const pptxData: ProposalPptData = {
          title: data.title,
          subtitle: data.company.name,
          date: new Date().toLocaleDateString('ko-KR'),
          sections: (data.sections || []).map((s) => ({
            title: s.title,
            content: s.content,
            bullets: s.bullets,
          })),
          contact: {
            company: data.company.name,
            name: data.company.representative || '',
            email: data.company.email || '',
            phone: data.company.phone,
          },
        };

        const builder = new PptxBuilder({ language: 'ko' });
        builder.createProposal(pptxData);
        result = await builder.save(`${outputPath}.pptx`);
        break;
      }

      case 'xlsx': {
        if (docType !== 'quotation' || !data.items) {
          statusCode = 400;
          return badRequest('XLSX format requires quotation docType and items data');
        }

        const xlsxData: QuotationData = {
          bidTitle: data.title,
          bidNumber: `QT-${Date.now()}`,
          submissionDate: new Date().toLocaleDateString('ko-KR'),
          validDays: 30,
          company: {
            name: data.company.name,
            representative: data.company.representative,
            businessNumber: '',
            address: data.company.address,
            phone: data.company.phone,
            email: data.company.email,
          },
          items: data.items.map((item) => ({
            name: item.name,
            spec: '',
            unit: item.unit || '식',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          notes: ['본 견적서는 30일간 유효합니다.'],
        };

        const builder = new XlsxBuilder({ language: 'ko' });
        builder.createQuotation(xlsxData);
        result = await builder.save(`${outputPath}.xlsx`);
        break;
      }

      default:
        statusCode = 400;
        return badRequest(`Unsupported format: ${format}`);
    }

    if (!result.success) {
      statusCode = 500;
      return internalError(result.error || 'Document generation failed');
    }

    // Store document metadata
    const { data: document, error: saveError } = await supabase
      .from('generated_documents')
      .insert({
        bid_id: bidId || null,
        org_id: orgId,
        doc_type: docType,
        format,
        file_path: result.filePath,
        file_size: result.fileSize,
        metadata: {
          title: data.title,
          company: data.company.name,
        },
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return successResponse(
      { document },
      { executionTime: Date.now() - startTime }
    );

  } catch (error) {
    logger.error('Tender Generate Error', error);
    statusCode = 500;
    return internalError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    metrics.httpRequest('POST', '/api/tender/generate', statusCode, (Date.now() - startTime) / 1000);
  }
}

/**
 * GET /api/tender/generate - List generated documents
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const bidId = searchParams.get('bidId');
    const docType = searchParams.get('docType') as DocumentType | null;
    const limit = parseLimit(searchParams.get('limit'));

    if (!orgId) {
      statusCode = 400;
      return badRequest('Missing orgId');
    }

    const supabase = createServerClient();
    let query = supabase
      .from('generated_documents')
      .select('*')
      .eq('org_id', orgId)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (bidId) query = query.eq('bid_id', bidId);
    if (docType) query = query.eq('doc_type', docType);

    const { data, error } = await query;

    if (error) throw error;

    return successResponse({
      documents: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    logger.error('Document List Error', error);
    statusCode = 500;
    return internalError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    metrics.httpRequest('GET', '/api/tender/generate', statusCode, (Date.now() - startTime) / 1000);
  }
}
