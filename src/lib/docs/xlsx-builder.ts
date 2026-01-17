/**
 * XLSX Builder - 견적서/데이터 시트 생성기
 * Uses exceljs for Excel document generation
 */

import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import type { BuilderOptions, BuildResult } from './index';

export interface QuotationData {
  bidTitle: string;
  bidNumber: string;
  submissionDate: string;
  validDays?: number;
  company?: QuotationCompany;
  items: QuotationItem[];
  notes?: string[];
}

export interface QuotationCompany {
  name: string;
  businessNumber?: string;
  address?: string;
  representative?: string;
  phone?: string;
  email?: string;
}

export interface QuotationItem {
  name: string;
  spec?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  note?: string;
}

export class XlsxBuilder {
  private workbook: ExcelJS.Workbook;
  private options: BuilderOptions;

  constructor(options: BuilderOptions = {}) {
    this.workbook = new ExcelJS.Workbook();
    this.options = {
      language: 'ko',
      author: 'Qetta',
      company: 'Qetta Inc.',
      ...options,
    };

    // 메타데이터
    this.workbook.creator = this.options.author || 'Qetta';
    this.workbook.created = new Date();
  }

  /**
   * 견적서 생성
   */
  createQuotation(data: QuotationData): this {
    const sheet = this.workbook.addWorksheet('견적서');

    // 컬럼 너비 설정
    sheet.columns = [
      { key: 'no', width: 6 },
      { key: 'name', width: 30 },
      { key: 'spec', width: 20 },
      { key: 'quantity', width: 10 },
      { key: 'unit', width: 8 },
      { key: 'unitPrice', width: 15 },
      { key: 'amount', width: 18 },
      { key: 'note', width: 15 },
    ];

    let rowIndex = 1;

    // 타이틀
    sheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
    const titleCell = sheet.getCell(`A${rowIndex}`);
    titleCell.value = '견 적 서';
    titleCell.font = { size: 24, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(rowIndex).height = 40;
    rowIndex += 2;

    // 기본 정보
    sheet.getCell(`A${rowIndex}`).value = '공고명';
    sheet.getCell(`A${rowIndex}`).font = { bold: true };
    sheet.getCell(`B${rowIndex}`).value = data.bidTitle;
    sheet.mergeCells(`B${rowIndex}:H${rowIndex}`);
    rowIndex++;

    sheet.getCell(`A${rowIndex}`).value = '공고번호';
    sheet.getCell(`A${rowIndex}`).font = { bold: true };
    sheet.getCell(`B${rowIndex}`).value = data.bidNumber;
    sheet.getCell(`D${rowIndex}`).value = '제출일';
    sheet.getCell(`D${rowIndex}`).font = { bold: true };
    sheet.getCell(`E${rowIndex}`).value = data.submissionDate;
    rowIndex++;

    if (data.validDays) {
      sheet.getCell(`A${rowIndex}`).value = '유효기간';
      sheet.getCell(`A${rowIndex}`).font = { bold: true };
      sheet.getCell(`B${rowIndex}`).value = `${data.validDays}일`;
    }
    rowIndex += 2;

    // 공급자 정보
    if (data.company) {
      sheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
      sheet.getCell(`A${rowIndex}`).value = '■ 공급자 정보';
      sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 12 };
      sheet.getCell(`A${rowIndex}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3E8FF' }, // Light purple
      };
      rowIndex++;

      sheet.getCell(`A${rowIndex}`).value = '회사명';
      sheet.getCell(`B${rowIndex}`).value = data.company.name;
      sheet.getCell(`D${rowIndex}`).value = '사업자번호';
      sheet.getCell(`E${rowIndex}`).value = data.company.businessNumber || '-';
      rowIndex++;

      sheet.getCell(`A${rowIndex}`).value = '주소';
      sheet.getCell(`B${rowIndex}`).value = data.company.address || '-';
      sheet.mergeCells(`B${rowIndex}:H${rowIndex}`);
      rowIndex++;

      sheet.getCell(`A${rowIndex}`).value = '대표자';
      sheet.getCell(`B${rowIndex}`).value = data.company.representative || '-';
      sheet.getCell(`D${rowIndex}`).value = '연락처';
      sheet.getCell(`E${rowIndex}`).value = data.company.phone || '-';
      rowIndex += 2;
    }

    // 품목 헤더
    const headerRow = sheet.getRow(rowIndex);
    headerRow.values = ['No', '품목명', '규격', '수량', '단위', '단가', '금액', '비고'];
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    for (let col = 1; col <= 8; col++) {
      const cell = headerRow.getCell(col);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9333EA' }, // Qetta purple
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
    rowIndex++;

    // 품목 데이터
    let totalAmount = 0;
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const amount = item.quantity * item.unitPrice;
      totalAmount += amount;

      const row = sheet.getRow(rowIndex);
      row.values = [
        i + 1,
        item.name,
        item.spec || '-',
        item.quantity,
        item.unit || 'EA',
        item.unitPrice,
        amount,
        item.note || '',
      ];

      // 숫자 포맷
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).numFmt = '#,##0';

      // 테두리
      for (let col = 1; col <= 8; col++) {
        row.getCell(col).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      rowIndex++;
    }

    // 합계
    const subtotalRow = sheet.getRow(rowIndex);
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    subtotalRow.getCell(1).value = '공급가액 합계';
    subtotalRow.getCell(1).alignment = { horizontal: 'right' };
    subtotalRow.getCell(1).font = { bold: true };
    subtotalRow.getCell(7).value = totalAmount;
    subtotalRow.getCell(7).numFmt = '#,##0';
    subtotalRow.getCell(7).font = { bold: true };
    this.applyBorder(subtotalRow, 8);
    rowIndex++;

    // 부가세
    const vat = Math.round(totalAmount * 0.1);
    const vatRow = sheet.getRow(rowIndex);
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    vatRow.getCell(1).value = '부가세 (10%)';
    vatRow.getCell(1).alignment = { horizontal: 'right' };
    vatRow.getCell(7).value = vat;
    vatRow.getCell(7).numFmt = '#,##0';
    this.applyBorder(vatRow, 8);
    rowIndex++;

    // 총액
    const grandTotal = totalAmount + vat;
    const totalRow = sheet.getRow(rowIndex);
    sheet.mergeCells(`A${rowIndex}:F${rowIndex}`);
    totalRow.getCell(1).value = '총 합계';
    totalRow.getCell(1).alignment = { horizontal: 'right' };
    totalRow.getCell(1).font = { bold: true, size: 14 };
    totalRow.getCell(7).value = grandTotal;
    totalRow.getCell(7).numFmt = '#,##0';
    totalRow.getCell(7).font = { bold: true, size: 14 };
    totalRow.getCell(7).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF3CD' }, // Yellow
    };
    this.applyBorder(totalRow, 8);
    rowIndex += 2;

    // 비고
    if (data.notes && data.notes.length > 0) {
      sheet.getCell(`A${rowIndex}`).value = '■ 비고';
      sheet.getCell(`A${rowIndex}`).font = { bold: true };
      rowIndex++;

      for (const note of data.notes) {
        sheet.getCell(`A${rowIndex}`).value = `• ${note}`;
        sheet.mergeCells(`A${rowIndex}:H${rowIndex}`);
        rowIndex++;
      }
    }

    return this;
  }

  /**
   * 데이터 시트 생성
   */
  createDataSheet(sheetName: string, headers: string[], data: (string | number)[][]): this {
    const sheet = this.workbook.addWorksheet(sheetName);

    // 헤더
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 데이터
    for (const row of data) {
      sheet.addRow(row);
    }

    // 자동 너비
    sheet.columns.forEach((column) => {
      column.width = 15;
    });

    return this;
  }

  private applyBorder(row: ExcelJS.Row, colCount: number): void {
    for (let col = 1; col <= colCount; col++) {
      row.getCell(col).border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }

  /**
   * 파일 저장
   */
  async save(outputPath: string): Promise<BuildResult> {
    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await this.workbook.xlsx.writeFile(outputPath);
      const stats = fs.statSync(outputPath);

      return {
        success: true,
        filePath: outputPath,
        fileSize: stats.size,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Buffer 반환
   */
  async toBuffer(): Promise<Buffer> {
    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }
}
