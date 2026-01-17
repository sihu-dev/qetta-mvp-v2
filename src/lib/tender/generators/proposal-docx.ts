/**
 * Proposal DOCX Generator - 제안서 문서 생성기
 * Uses docx npm package for Word document generation
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Packer,
} from 'docx';
import type { Bid, BidAnalysis } from '../types';

export interface ProposalConfig {
  companyName: string;
  companyAddress: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ProposalContent {
  executiveSummary: string;
  technicalApproach: string;
  timeline: string;
  pricing: {
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
  };
  qualifications: string[];
}

/**
 * Generate a proposal document
 */
export async function generateProposal(
  bid: Bid,
  analysis: BidAnalysis,
  config: ProposalConfig,
  content: ProposalContent
): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          createTitle(`제안서: ${bid.title}`),

          // Company Info
          createHeading('1. 제안업체 정보'),
          createParagraph(`회사명: ${config.companyName}`),
          createParagraph(`주소: ${config.companyAddress}`),
          createParagraph(`담당자: ${config.contactPerson}`),
          createParagraph(`이메일: ${config.contactEmail}`),
          createParagraph(`전화: ${config.contactPhone}`),

          // Executive Summary
          createHeading('2. 요약'),
          createParagraph(content.executiveSummary),

          // Technical Approach
          createHeading('3. 기술적 접근'),
          createParagraph(content.technicalApproach),

          // Timeline
          createHeading('4. 일정'),
          createParagraph(content.timeline),

          // Pricing Table
          createHeading('5. 가격 제안'),
          createPricingTable(content.pricing.items),

          // Qualifications
          createHeading('6. 자격 요건'),
          ...content.qualifications.map((q) => createBullet(q)),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function createTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 48, // 24pt
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  });
}

function createHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function createParagraph(text: string): Paragraph {
  return new Paragraph({
    text,
    spacing: { after: 200 },
  });
}

function createBullet(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: { level: 0 },
  });
}

function createPricingTable(
  items: Array<{ name: string; quantity: number; unitPrice: number }>
): Table {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header row
      new TableRow({
        children: [
          createTableCell('항목', true),
          createTableCell('수량', true),
          createTableCell('단가', true),
          createTableCell('합계', true),
        ],
      }),
      // Data rows
      ...items.map(
        (item) =>
          new TableRow({
            children: [
              createTableCell(item.name),
              createTableCell(item.quantity.toString()),
              createTableCell(formatCurrency(item.unitPrice)),
              createTableCell(formatCurrency(item.quantity * item.unitPrice)),
            ],
          })
      ),
      // Total row
      new TableRow({
        children: [
          createTableCell('총계', true),
          createTableCell(''),
          createTableCell(''),
          createTableCell(formatCurrency(total), true),
        ],
      }),
    ],
  });
}

function createTableCell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
      }),
    ],
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}
