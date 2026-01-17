/**
 * Quotation XLSX Generator - 견적서 엑셀 생성기
 * Uses exceljs for Excel document generation
 */

import ExcelJS from 'exceljs';
import type { Bid } from '../types';

export interface QuotationItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface QuotationConfig {
  companyName: string;
  businessNumber: string;
  address: string;
  representative: string;
  phone: string;
  email: string;
  validDays: number; // Quote validity in days
}

/**
 * Generate a quotation spreadsheet
 */
export async function generateQuotation(
  bid: Bid,
  items: QuotationItem[],
  config: QuotationConfig
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Qetta';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('견적서');

  // Set column widths
  sheet.columns = [
    { key: 'no', width: 8 },
    { key: 'name', width: 30 },
    { key: 'description', width: 40 },
    { key: 'quantity', width: 12 },
    { key: 'unit', width: 10 },
    { key: 'unitPrice', width: 15 },
    { key: 'amount', width: 18 },
  ];

  // Title
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '견 적 서';
  titleCell.font = { size: 24, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  // Quote Info
  sheet.getCell('A3').value = '공고명:';
  sheet.getCell('B3').value = bid.title;
  sheet.mergeCells('B3:G3');

  sheet.getCell('A4').value = '견적일:';
  sheet.getCell('B4').value = new Date().toLocaleDateString('ko-KR');

  sheet.getCell('A5').value = '유효기간:';
  sheet.getCell('B5').value = `${config.validDays}일`;

  // Company Info Section
  sheet.getCell('A7').value = '공급자 정보';
  sheet.getCell('A7').font = { bold: true };
  sheet.mergeCells('A7:G7');

  sheet.getCell('A8').value = '회사명:';
  sheet.getCell('B8').value = config.companyName;
  sheet.getCell('D8').value = '사업자번호:';
  sheet.getCell('E8').value = config.businessNumber;

  sheet.getCell('A9').value = '주소:';
  sheet.getCell('B9').value = config.address;
  sheet.mergeCells('B9:G9');

  sheet.getCell('A10').value = '대표자:';
  sheet.getCell('B10').value = config.representative;
  sheet.getCell('D10').value = '연락처:';
  sheet.getCell('E10').value = config.phone;

  // Items Header
  const headerRow = 12;
  const headers = ['No', '품목명', '상세설명', '수량', '단위', '단가', '금액'];
  headers.forEach((header, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Items
  let totalAmount = 0;
  items.forEach((item, index) => {
    const rowNum = headerRow + index + 1;
    const amount = item.quantity * item.unitPrice;
    totalAmount += amount;

    sheet.getCell(rowNum, 1).value = index + 1;
    sheet.getCell(rowNum, 2).value = item.name;
    sheet.getCell(rowNum, 3).value = item.description;
    sheet.getCell(rowNum, 4).value = item.quantity;
    sheet.getCell(rowNum, 5).value = item.unit;
    sheet.getCell(rowNum, 6).value = item.unitPrice;
    sheet.getCell(rowNum, 6).numFmt = '#,##0';
    sheet.getCell(rowNum, 7).value = amount;
    sheet.getCell(rowNum, 7).numFmt = '#,##0';

    // Add borders
    for (let col = 1; col <= 7; col++) {
      sheet.getCell(rowNum, col).border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  });

  // Total Row
  const totalRow = headerRow + items.length + 1;
  sheet.mergeCells(totalRow, 1, totalRow, 6);
  sheet.getCell(totalRow, 1).value = '합 계';
  sheet.getCell(totalRow, 1).font = { bold: true };
  sheet.getCell(totalRow, 1).alignment = { horizontal: 'right' };
  sheet.getCell(totalRow, 7).value = totalAmount;
  sheet.getCell(totalRow, 7).numFmt = '#,##0';
  sheet.getCell(totalRow, 7).font = { bold: true };

  // VAT Row
  const vatRow = totalRow + 1;
  const vat = Math.round(totalAmount * 0.1);
  sheet.mergeCells(vatRow, 1, vatRow, 6);
  sheet.getCell(vatRow, 1).value = '부가세 (10%)';
  sheet.getCell(vatRow, 1).alignment = { horizontal: 'right' };
  sheet.getCell(vatRow, 7).value = vat;
  sheet.getCell(vatRow, 7).numFmt = '#,##0';

  // Grand Total Row
  const grandTotalRow = vatRow + 1;
  sheet.mergeCells(grandTotalRow, 1, grandTotalRow, 6);
  sheet.getCell(grandTotalRow, 1).value = '총 합계';
  sheet.getCell(grandTotalRow, 1).font = { bold: true, size: 14 };
  sheet.getCell(grandTotalRow, 1).alignment = { horizontal: 'right' };
  sheet.getCell(grandTotalRow, 7).value = totalAmount + vat;
  sheet.getCell(grandTotalRow, 7).numFmt = '#,##0';
  sheet.getCell(grandTotalRow, 7).font = { bold: true, size: 14 };

  // Generate buffer
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
