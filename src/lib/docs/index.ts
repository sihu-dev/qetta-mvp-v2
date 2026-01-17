/**
 * Qetta Document Skills Engine
 * 문서 생성 기술조합 핵심 모듈
 *
 * "inevitable" - Data Flows. Evidence Follows.
 *
 * 지원 포맷:
 * - DOCX: 제안서, 보고서 (docx npm)
 * - XLSX: 견적서, 데이터 시트 (exceljs)
 * - PPTX: 발표자료 (pptxgenjs)
 * - PDF: WeasyPrint 연동 (추후)
 * - ZIP: 제출 패키지 (archiver)
 */

export { DocxBuilder, type DocxContent, type DocxSection } from './docx-builder';
export { XlsxBuilder, type QuotationData, type QuotationItem } from './xlsx-builder';
export { PptxBuilder, type ProposalPptData, type PptSection, type ContactInfo } from './pptx-builder';

// ═══════════════════════════════════════════════════════════
// 공통 타입
// ═══════════════════════════════════════════════════════════

export type DocumentFormat = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'zip';
export type DocumentType = 'proposal' | 'quotation' | 'presentation' | 'report' | 'evidence';

export interface BuilderOptions {
  language?: 'ko' | 'en' | 'ru' | 'kz';
  author?: string;
  company?: string;
  templatePath?: string;
}

export interface BuildResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════════
// 문서 생성 팩토리
// ═══════════════════════════════════════════════════════════

import { DocxBuilder } from './docx-builder';
import { XlsxBuilder } from './xlsx-builder';
import { PptxBuilder } from './pptx-builder';

/**
 * 문서 빌더 팩토리
 */
export function createBuilder(
  format: DocumentFormat,
  options: BuilderOptions = {}
): DocxBuilder | XlsxBuilder | PptxBuilder {
  switch (format) {
    case 'docx':
      return new DocxBuilder(options);
    case 'xlsx':
      return new XlsxBuilder(options);
    case 'pptx':
      return new PptxBuilder(options);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * 문서 스킬: 제안서 생성 (DOCX)
 */
export async function generateProposal(
  data: import('./docx-builder').DocxContent,
  outputPath: string,
  options: BuilderOptions = {}
): Promise<BuildResult> {
  const builder = new DocxBuilder(options);
  return builder.createProposal(data).save(outputPath);
}

/**
 * 문서 스킬: 견적서 생성 (XLSX)
 */
export async function generateQuotation(
  data: import('./xlsx-builder').QuotationData,
  outputPath: string,
  options: BuilderOptions = {}
): Promise<BuildResult> {
  const builder = new XlsxBuilder(options);
  return builder.createQuotation(data).save(outputPath);
}

/**
 * 문서 스킬: 발표자료 생성 (PPTX)
 */
export async function generatePresentation(
  data: import('./pptx-builder').ProposalPptData,
  outputPath: string,
  options: BuilderOptions = {}
): Promise<BuildResult> {
  const builder = new PptxBuilder(options);
  return builder.createProposal(data).save(outputPath);
}
