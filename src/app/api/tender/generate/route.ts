/**
 * Tender Generate API Route
 * /api/tender/generate
 *
 * Generate proposal documents (DOCX, XLSX, PPTX)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DocxBuilder, type DocxContent } from '@/lib/docs/docx-builder';
import { PptxBuilder, type ProposalPptData } from '@/lib/docs/pptx-builder';
import { XlsxBuilder, type QuotationData } from '@/lib/docs/xlsx-builder';
import type { DocumentType, DocumentFormat } from '@/lib/tender/types';
import * as path from 'path';

export interface GenerateRequest {
  bidId?: string;
  orgId: string;
  docType: DocumentType;
  format: DocumentFormat;
  data: {
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
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: GenerateRequest = await request.json();
    const { bidId, orgId, docType, format, data } = body;

    if (!orgId || !docType || !format || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: orgId, docType, format, data' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = `/tmp/qetta/documents/${orgId}`;
    const filename = `${docType}_${timestamp}`;
    const outputPath = path.join(outputDir, filename);

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
          return NextResponse.json(
            { error: 'XLSX format requires quotation docType and items data' },
            { status: 400 }
          );
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
        return NextResponse.json(
          { error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Document generation failed' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      document,
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Tender Generate Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tender/generate - List generated documents
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const bidId = searchParams.get('bidId');
    const docType = searchParams.get('docType') as DocumentType | null;
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      documents: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Document List Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
