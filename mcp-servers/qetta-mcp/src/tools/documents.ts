/**
 * Document Tools
 * 문서 생성 도구 (DOCX, XLSX, PPTX)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const documentTools: Tool[] = [
  {
    name: 'document_generate_proposal',
    description: '제안서 자동 생성 (DOCX) - 입찰 정보 기반 맞춤형 제안서',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        bid_id: {
          type: 'string',
          description: '입찰 ID (선택)',
        },
        title: {
          type: 'string',
          description: '제안서 제목',
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
            },
          },
          description: '섹션 목록',
        },
        company_info: {
          type: 'object',
          description: '회사 정보',
        },
      },
      required: ['org_id', 'title'],
    },
  },
  {
    name: 'document_generate_quotation',
    description: '견적서 자동 생성 (XLSX) - 품목별 단가 및 합계 계산',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        bid_id: {
          type: 'string',
          description: '입찰 ID (선택)',
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              unit: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' },
            },
          },
          description: '품목 목록',
        },
        company_info: {
          type: 'object',
          description: '회사 정보',
        },
        valid_until: {
          type: 'string',
          description: '견적 유효기간',
        },
      },
      required: ['org_id', 'items'],
    },
  },
  {
    name: 'document_generate_presentation',
    description: '프레젠테이션 자동 생성 (PPTX) - 제안 발표용 슬라이드',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        bid_id: {
          type: 'string',
          description: '입찰 ID (선택)',
        },
        title: {
          type: 'string',
          description: '프레젠테이션 제목',
        },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['title', 'content', 'chart', 'closing'] },
              title: { type: 'string' },
              content: { type: 'string' },
            },
          },
          description: '슬라이드 목록',
        },
      },
      required: ['org_id', 'title'],
    },
  },
  {
    name: 'document_list_generated',
    description: '생성된 문서 목록 조회',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        doc_type: {
          type: 'string',
          enum: ['proposal', 'quotation', 'presentation', 'package', 'evidence'],
          description: '문서 유형 필터 (선택)',
        },
        limit: {
          type: 'number',
          description: '최대 결과 수 (기본값: 20)',
        },
      },
      required: ['org_id'],
    },
  },
];

export async function handleDocumentTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  switch (name) {
    case 'document_generate_proposal':
      return await generateProposal(args, supabase);
    case 'document_generate_quotation':
      return await generateQuotation(args, supabase);
    case 'document_generate_presentation':
      return await generatePresentation(args, supabase);
    case 'document_list_generated':
      return await listGeneratedDocuments(args, supabase);
    default:
      throw new Error(`Unknown document tool: ${name}`);
  }
}

async function generateProposal(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, bid_id, title, sections, company_info } = args as {
    org_id: string;
    bid_id?: string;
    title: string;
    sections?: Array<{ title: string; content: string }>;
    company_info?: Record<string, unknown>;
  };

  // 실제 구현에서는 docx 라이브러리로 문서 생성
  // 여기서는 메타데이터만 저장
  const filename = `proposal_${Date.now()}.docx`;
  const storagePath = `documents/${org_id}/${filename}`;

  // 문서 생성 시뮬레이션
  const documentStructure = {
    format: 'docx',
    branding: {
      name: 'Qetta',
      slogan: 'in·ev·it·able',
      tagline: 'Data Flows. Evidence Follows.',
      primaryColor: '#9333ea',
    },
    structure: {
      coverPage: {
        title,
        company: company_info?.name || 'Qetta Corp',
        date: new Date().toISOString().split('T')[0],
      },
      tableOfContents: true,
      sections: sections || [
        { title: '회사 소개', content: '[회사 소개 내용]' },
        { title: '기술 제안', content: '[기술 제안 내용]' },
        { title: '수행 계획', content: '[수행 계획 내용]' },
        { title: '가격 제안', content: '[가격 제안 내용]' },
      ],
    },
  };

  // DB에 메타데이터 저장
  const { data, error } = await supabase
    .from('generated_documents')
    .insert({
      org_id,
      bid_id,
      doc_type: 'proposal',
      format: 'docx',
      file_path: storagePath,
      file_size: 0, // 실제 구현에서는 실제 크기
      metadata: documentStructure,
    })
    .select()
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            document_id: data.id,
            file_path: storagePath,
            format: 'docx',
            structure: documentStructure,
            message: '제안서가 생성되었습니다. (실제 파일 생성은 서버사이드에서 처리)',
            note: 'Use src/lib/docs/docx-builder.ts for actual DOCX generation',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function generateQuotation(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, bid_id, items, company_info, valid_until } = args as {
    org_id: string;
    bid_id?: string;
    items: Array<{ name: string; unit: string; quantity: number; unit_price: number }>;
    company_info?: Record<string, unknown>;
    valid_until?: string;
  };

  // 합계 계산
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const vat = subtotal * 0.1;
  const total = subtotal + vat;

  const filename = `quotation_${Date.now()}.xlsx`;
  const storagePath = `documents/${org_id}/${filename}`;

  const documentStructure = {
    format: 'xlsx',
    branding: {
      name: 'Qetta',
      primaryColor: '#9333ea',
    },
    sheets: [
      {
        name: '견적서',
        header: {
          company: company_info?.name || 'Qetta Corp',
          date: new Date().toISOString().split('T')[0],
          validUntil: valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        items: items.map((item, index) => ({
          no: index + 1,
          ...item,
          amount: item.quantity * item.unit_price,
        })),
        totals: {
          subtotal,
          vat,
          total,
        },
      },
    ],
  };

  const { data, error } = await supabase
    .from('generated_documents')
    .insert({
      org_id,
      bid_id,
      doc_type: 'quotation',
      format: 'xlsx',
      file_path: storagePath,
      file_size: 0,
      metadata: documentStructure,
    })
    .select()
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            document_id: data.id,
            file_path: storagePath,
            format: 'xlsx',
            summary: {
              itemCount: items.length,
              subtotal: `₩${subtotal.toLocaleString()}`,
              vat: `₩${vat.toLocaleString()}`,
              total: `₩${total.toLocaleString()}`,
            },
            structure: documentStructure,
            message: '견적서가 생성되었습니다.',
            note: 'Use src/lib/docs/xlsx-builder.ts for actual XLSX generation',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function generatePresentation(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, bid_id, title, slides } = args as {
    org_id: string;
    bid_id?: string;
    title: string;
    slides?: Array<{ type: string; title: string; content?: string }>;
  };

  const filename = `presentation_${Date.now()}.pptx`;
  const storagePath = `documents/${org_id}/${filename}`;

  const defaultSlides = [
    { type: 'title', title, subtitle: 'Qetta - in·ev·it·able' },
    { type: 'content', title: '목차', content: '1. 회사소개\n2. 제안개요\n3. 기술역량\n4. 수행계획' },
    { type: 'content', title: '회사 소개', content: '[회사 소개 내용]' },
    { type: 'content', title: '제안 개요', content: '[제안 개요 내용]' },
    { type: 'chart', title: '기술 역량', content: '[차트 데이터]' },
    { type: 'closing', title: '감사합니다', subtitle: 'Data Flows. Evidence Follows.' },
  ];

  const documentStructure = {
    format: 'pptx',
    branding: {
      name: 'Qetta',
      slogan: 'in·ev·it·able',
      tagline: 'Data Flows. Evidence Follows.',
      primaryColor: '#9333ea',
    },
    slides: slides || defaultSlides,
    slideCount: (slides || defaultSlides).length,
  };

  const { data, error } = await supabase
    .from('generated_documents')
    .insert({
      org_id,
      bid_id,
      doc_type: 'presentation',
      format: 'pptx',
      file_path: storagePath,
      file_size: 0,
      metadata: documentStructure,
    })
    .select()
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            document_id: data.id,
            file_path: storagePath,
            format: 'pptx',
            slideCount: documentStructure.slideCount,
            structure: documentStructure,
            message: '프레젠테이션이 생성되었습니다.',
            note: 'Use src/lib/docs/pptx-builder.ts for actual PPTX generation',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function listGeneratedDocuments(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, doc_type, limit = 20 } = args as {
    org_id: string;
    doc_type?: string;
    limit?: number;
  };

  let query = supabase
    .from('generated_documents')
    .select('id, doc_type, format, file_path, file_size, generated_at, bid_id')
    .eq('org_id', org_id)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (doc_type) {
    query = query.eq('doc_type', doc_type);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Query failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: data?.length || 0,
            documents: data,
          },
          null,
          2
        ),
      },
    ],
  };
}
