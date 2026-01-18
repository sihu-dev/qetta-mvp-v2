# 🔧 PHASE 3-4: 분석기 & 문서 생성기

> **For**: Claude Code CLI  
> **Duration**: 3-4주

---

## 3.1 입찰 분석기

### `src/lib/tender/analyzers/bid-analyzer.ts`

```typescript
/**
 * 입찰 공고 분석기
 * 
 * 3-Tier Intelligence 적용:
 * - Tier 1 (95%): Rule Engine - 자격요건 체크
 * - Tier 2 (4%): ML - 경쟁 강도 예측  
 * - Tier 3 (1%): Claude API - 복잡한 분석
 */

import { 
  Bid, 
  BidAnalysis, 
  OrgProfile,
  QualificationCheck,
  RequiredDocument,
  CompetitionLevel 
} from '../types';

export class BidAnalyzer {
  private orgProfile: OrgProfile;
  private enableAI: boolean;
  
  constructor(orgProfile: OrgProfile, enableAI = false) {
    this.orgProfile = orgProfile;
    this.enableAI = enableAI;
  }
  
  /**
   * 입찰 공고 분석 실행
   */
  async analyze(bid: Bid): Promise<BidAnalysis> {
    // Tier 1: Rule Engine (95%)
    const qualificationsMet = this.checkQualifications(bid);
    const requiredDocuments = this.extractRequiredDocuments(bid);
    
    // Tier 2: 기본 경쟁 분석
    const competitionLevel = this.estimateCompetition(bid);
    
    // 기본 낙찰 확률
    let winProbability = this.calculateBaseProbability(
      qualificationsMet,
      competitionLevel
    );
    
    // Tier 3: AI 분석 (선택적)
    let recommendations: string[] = [];
    
    if (this.enableAI && this.needsAIAnalysis(bid)) {
      const aiResult = await this.runAIAnalysis(bid);
      winProbability = aiResult.adjustedProbability || winProbability;
      recommendations = aiResult.recommendations || [];
    } else {
      recommendations = this.generateBasicRecommendations(
        qualificationsMet,
        requiredDocuments
      );
    }
    
    return {
      id: '',
      bidId: bid.id,
      orgId: bid.orgId,
      qualificationsMet,
      requiredDocuments,
      competitionLevel,
      winProbability,
      recommendations,
      analyzedAt: new Date(),
    };
  }
  
  /**
   * Tier 1: 자격요건 체크 (Rule Engine)
   */
  private checkQualifications(bid: Bid): QualificationCheck[] {
    const checks: QualificationCheck[] = [];
    const rawData = bid.rawData as Record<string, unknown>;
    
    // 매출액 요건
    if (rawData?.minRevenue) {
      const required = Number(rawData.minRevenue);
      const met = (this.orgProfile.revenue || 0) >= required;
      checks.push({
        requirement: `매출액 ${this.formatCurrency(required)} 이상`,
        met,
        note: met ? undefined : `현재 매출: ${this.formatCurrency(this.orgProfile.revenue || 0)}`,
      });
    }
    
    // 인력 요건
    if (rawData?.minEmployees) {
      const required = Number(rawData.minEmployees);
      const met = (this.orgProfile.employees || 0) >= required;
      checks.push({
        requirement: `상시 근로자 ${required}명 이상`,
        met,
        note: met ? undefined : `현재 인력: ${this.orgProfile.employees || 0}명`,
      });
    }
    
    // 인증 요건 (ISO 등)
    const certKeywords = ['ISO', 'ISMS', 'PIMS', 'GMP', 'HACCP'];
    const description = String(rawData?.description || bid.description || '');
    
    for (const cert of certKeywords) {
      if (description.includes(cert)) {
        const met = this.orgProfile.certifications?.some(c => 
          c.includes(cert)
        ) || false;
        checks.push({
          requirement: `${cert} 인증 보유`,
          met,
        });
      }
    }
    
    // 유사 실적 요건
    if (description.includes('유사실적') || description.includes('수행실적')) {
      const hasSimilar = (this.orgProfile.pastProjects?.length || 0) > 0;
      checks.push({
        requirement: '유사 수행실적 보유',
        met: hasSimilar,
        note: hasSimilar ? 
          `${this.orgProfile.pastProjects?.length}건 보유` : 
          '실적 없음',
      });
    }
    
    return checks;
  }
  
  /**
   * Tier 1: 필수 서류 추출
   */
  private extractRequiredDocuments(bid: Bid): RequiredDocument[] {
    const docs: RequiredDocument[] = [];
    const rawData = bid.rawData as Record<string, unknown>;
    const description = String(rawData?.description || bid.description || '');
    
    // 기본 필수 서류
    const commonDocs = [
      { name: '사업자등록증', keywords: ['사업자등록'] },
      { name: '법인등기부등본', keywords: ['법인등기', '등기부등본'] },
      { name: '국세/지방세 완납증명', keywords: ['납세', '완납증명'] },
      { name: '재무제표', keywords: ['재무제표', '결산서'] },
      { name: '기술인력 현황', keywords: ['기술인력', '인력현황'] },
      { name: '유사실적 증명', keywords: ['유사실적', '수행실적'] },
    ];
    
    for (const doc of commonDocs) {
      const required = doc.keywords.some(k => description.includes(k));
      docs.push({
        name: doc.name,
        required,
        available: true, // 기본적으로 준비 가능으로 표시
      });
    }
    
    return docs;
  }
  
  /**
   * Tier 2: 경쟁 강도 추정
   */
  private estimateCompetition(bid: Bid): CompetitionLevel {
    const budget = bid.budget || 0;
    
    // 예산 규모에 따른 기본 경쟁 강도
    if (budget < 50_000_000) {
      return 'low'; // 5천만 미만: 경쟁 낮음
    } else if (budget < 500_000_000) {
      return 'medium'; // 5억 미만: 보통
    } else {
      return 'high'; // 5억 이상: 경쟁 높음
    }
  }
  
  /**
   * 기본 낙찰 확률 계산
   */
  private calculateBaseProbability(
    qualifications: QualificationCheck[],
    competition: CompetitionLevel
  ): number {
    // 자격요건 충족률
    const metCount = qualifications.filter(q => q.met).length;
    const totalCount = qualifications.length || 1;
    const qualificationScore = (metCount / totalCount) * 100;
    
    // 경쟁 강도 보정
    const competitionFactor = {
      low: 1.2,
      medium: 1.0,
      high: 0.8,
    }[competition];
    
    // 기본 확률 (0-100)
    let probability = qualificationScore * competitionFactor * 0.7;
    
    return Math.min(Math.max(Math.round(probability), 0), 100);
  }
  
  /**
   * AI 분석 필요 여부 판단
   */
  private needsAIAnalysis(bid: Bid): boolean {
    // 예산 1억 이상이거나 설명이 복잡한 경우
    return (bid.budget || 0) >= 100_000_000 || 
           (bid.description?.length || 0) > 1000;
  }
  
  /**
   * Tier 3: Claude API 분석
   */
  private async runAIAnalysis(bid: Bid): Promise<{
    adjustedProbability?: number;
    recommendations?: string[];
  }> {
    // Claude API 호출 (구현 시 추가)
    // 비용 절감을 위해 필요한 경우만 호출
    return {
      adjustedProbability: undefined,
      recommendations: [],
    };
  }
  
  /**
   * 기본 추천사항 생성
   */
  private generateBasicRecommendations(
    qualifications: QualificationCheck[],
    documents: RequiredDocument[]
  ): string[] {
    const recommendations: string[] = [];
    
    // 미충족 자격요건 안내
    const unmet = qualifications.filter(q => !q.met);
    if (unmet.length > 0) {
      recommendations.push(
        `다음 자격요건 충족 필요: ${unmet.map(q => q.requirement).join(', ')}`
      );
    }
    
    // 모든 자격 충족 시
    if (unmet.length === 0 && qualifications.length > 0) {
      recommendations.push('모든 자격요건 충족 - 입찰 참여 권장');
    }
    
    // 필수 서류 안내
    const requiredDocs = documents.filter(d => d.required);
    if (requiredDocs.length > 0) {
      recommendations.push(
        `필수 서류 ${requiredDocs.length}종 준비 필요`
      );
    }
    
    return recommendations;
  }
  
  private formatCurrency(amount: number): string {
    if (amount >= 100_000_000) {
      return `${(amount / 100_000_000).toFixed(1)}억원`;
    } else if (amount >= 10_000) {
      return `${(amount / 10_000).toFixed(0)}만원`;
    }
    return `${amount}원`;
  }
}
```

---

## 4.1 XLSX 빌더 (견적서용)

### `src/lib/docs/xlsx-builder.ts`

```typescript
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { BuilderOptions, BuildResult } from './index';

export class XlsxBuilder {
  private workbook: ExcelJS.Workbook;
  private options: BuilderOptions;
  
  constructor(options: BuilderOptions = {}) {
    this.workbook = new ExcelJS.Workbook();
    this.options = {
      language: 'ko',
      ...options,
    };
    
    // 메타데이터
    this.workbook.creator = 'Qetta';
    this.workbook.created = new Date();
  }
  
  /**
   * 견적서 생성
   */
  createQuotation(data: QuotationData): this {
    const sheet = this.workbook.addWorksheet('견적서');
    
    // 헤더
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = '견 적 서';
    titleCell.font = { size: 24, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    // 기본 정보
    sheet.getCell('A3').value = '공고명';
    sheet.getCell('B3').value = data.bidTitle;
    sheet.mergeCells('B3:F3');
    
    sheet.getCell('A4').value = '공고번호';
    sheet.getCell('B4').value = data.bidNumber;
    
    sheet.getCell('A5').value = '제출일';
    sheet.getCell('B5').value = data.submissionDate;
    
    // 빈 행
    sheet.getRow(6).height = 20;
    
    // 테이블 헤더
    const headerRow = sheet.getRow(7);
    headerRow.values = ['No', '항목', '규격', '수량', '단가', '금액'];
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    
    // 스타일
    for (let col = 1; col <= 6; col++) {
      const cell = headerRow.getCell(col);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
    
    // 데이터 행
    let rowIndex = 8;
    let totalAmount = 0;
    
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const row = sheet.getRow(rowIndex);
      const amount = item.quantity * item.unitPrice;
      
      row.values = [
        i + 1,
        item.name,
        item.spec || '-',
        item.quantity,
        item.unitPrice,
        amount,
      ];
      
      // 숫자 포맷
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '#,##0';
      
      // 테두리
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
      
      totalAmount += amount;
      rowIndex++;
    }
    
    // 합계
    const totalRow = sheet.getRow(rowIndex);
    totalRow.values = ['', '', '', '', '합계', totalAmount];
    totalRow.font = { bold: true };
    totalRow.getCell(6).numFmt = '#,##0';
    
    // 부가세
    const vatRow = sheet.getRow(rowIndex + 1);
    vatRow.values = ['', '', '', '', 'VAT (10%)', Math.round(totalAmount * 0.1)];
    vatRow.getCell(6).numFmt = '#,##0';
    
    // 총액
    const grandRow = sheet.getRow(rowIndex + 2);
    grandRow.values = ['', '', '', '', '총액', Math.round(totalAmount * 1.1)];
    grandRow.font = { bold: true, size: 14 };
    grandRow.getCell(6).numFmt = '#,##0';
    
    // 컬럼 너비
    sheet.columns = [
      { width: 6 },   // No
      { width: 30 },  // 항목
      { width: 20 },  // 규격
      { width: 10 },  // 수량
      { width: 15 },  // 단가
      { width: 18 },  // 금액
    ];
    
    return this;
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
}

export interface QuotationData {
  bidTitle: string;
  bidNumber: string;
  submissionDate: string;
  items: QuotationItem[];
}

export interface QuotationItem {
  name: string;
  spec?: string;
  quantity: number;
  unitPrice: number;
}
```

---

## 4.2 PPTX 빌더 (발표자료용)

### `src/lib/docs/pptx-builder.ts`

```typescript
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import * as path from 'path';
import { BuilderOptions, BuildResult } from './index';

export class PptxBuilder {
  private pptx: PptxGenJS;
  private options: BuilderOptions;
  
  constructor(options: BuilderOptions = {}) {
    this.pptx = new PptxGenJS();
    this.options = {
      language: 'ko',
      ...options,
    };
    
    // 기본 설정
    this.pptx.author = 'Qetta';
    this.pptx.company = 'Qetta Inc.';
    this.pptx.layout = 'LAYOUT_16x9';
  }
  
  /**
   * 제안 발표자료 생성
   */
  createProposal(data: ProposalPptData): this {
    // 표지
    this.addTitleSlide(data.title, data.subtitle);
    
    // 목차
    this.addTocSlide(data.sections.map(s => s.title));
    
    // 섹션별 슬라이드
    for (const section of data.sections) {
      this.addSectionSlide(section);
    }
    
    // 마무리
    this.addClosingSlide(data.contact);
    
    return this;
  }
  
  private addTitleSlide(title: string, subtitle?: string): void {
    const slide = this.pptx.addSlide();
    
    // 배경 그라데이션
    slide.background = { 
      color: '9333ea',
    };
    
    // 제목
    slide.addText(title, {
      x: 0.5,
      y: 2.5,
      w: '90%',
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    
    // 부제
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.5,
        y: 4,
        w: '90%',
        h: 0.8,
        fontSize: 24,
        color: 'E0E0E0',
        align: 'center',
      });
    }
  }
  
  private addTocSlide(items: string[]): void {
    const slide = this.pptx.addSlide();
    
    slide.addText('목 차', {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: '333333',
    });
    
    const tocText = items.map((item, i) => ({
      text: `${i + 1}. ${item}`,
      options: { fontSize: 20, color: '666666', bullet: false },
    }));
    
    slide.addText(tocText, {
      x: 1,
      y: 1.5,
      w: '80%',
      h: 4,
      valign: 'top',
    });
  }
  
  private addSectionSlide(section: PptSection): void {
    const slide = this.pptx.addSlide();
    
    // 제목
    slide.addText(section.title, {
      x: 0.5,
      y: 0.3,
      w: '90%',
      h: 0.7,
      fontSize: 28,
      bold: true,
      color: '9333ea',
    });
    
    // 본문
    if (section.bullets) {
      const bulletText = section.bullets.map(b => ({
        text: b,
        options: { fontSize: 18, color: '333333', bullet: true },
      }));
      
      slide.addText(bulletText, {
        x: 0.5,
        y: 1.2,
        w: '90%',
        h: 4,
        valign: 'top',
      });
    }
    
    // 이미지
    if (section.imagePath && fs.existsSync(section.imagePath)) {
      slide.addImage({
        path: section.imagePath,
        x: 6,
        y: 1.5,
        w: 3,
        h: 3,
      });
    }
  }
  
  private addClosingSlide(contact?: ContactInfo): void {
    const slide = this.pptx.addSlide();
    
    slide.background = { color: '9333ea' };
    
    slide.addText('감사합니다', {
      x: 0.5,
      y: 2,
      w: '90%',
      h: 1.5,
      fontSize: 48,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    });
    
    if (contact) {
      slide.addText([
        { text: contact.company, options: { fontSize: 20 } },
        { text: '\n' },
        { text: `${contact.name} | ${contact.email}`, options: { fontSize: 16 } },
      ], {
        x: 0.5,
        y: 4,
        w: '90%',
        h: 1,
        color: 'E0E0E0',
        align: 'center',
      });
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
      
      await this.pptx.writeFile({ fileName: outputPath });
      
      // pptxgenjs는 .pptx를 자동 추가하므로 확인
      const finalPath = outputPath.endsWith('.pptx') ? 
        outputPath : `${outputPath}.pptx`;
      
      if (fs.existsSync(finalPath)) {
        const stats = fs.statSync(finalPath);
        return {
          success: true,
          filePath: finalPath,
          fileSize: stats.size,
        };
      }
      
      return { success: false, error: 'File not created' };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export interface ProposalPptData {
  title: string;
  subtitle?: string;
  sections: PptSection[];
  contact?: ContactInfo;
}

export interface PptSection {
  title: string;
  bullets?: string[];
  imagePath?: string;
}

export interface ContactInfo {
  company: string;
  name: string;
  email: string;
}
```

---

## 4.3 제출 패키지 ZIP

### `src/lib/tender/generators/submission-zip.ts`

```typescript
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SubmissionPackage {
  bidId: string;
  bidTitle: string;
  files: SubmissionFile[];
  outputPath: string;
}

export interface SubmissionFile {
  name: string;
  path: string;
  type: 'proposal' | 'quotation' | 'appendix' | 'certificate';
}

export interface PackageResult {
  success: boolean;
  zipPath?: string;
  manifest?: PackageManifest;
  error?: string;
}

export interface PackageManifest {
  bidId: string;
  bidTitle: string;
  createdAt: string;
  files: {
    name: string;
    type: string;
    size: number;
    hash: string;
  }[];
  totalSize: number;
  packageHash: string;
}

/**
 * 입찰 제출 패키지 생성
 */
export async function createSubmissionPackage(
  pkg: SubmissionPackage
): Promise<PackageResult> {
  try {
    const dir = path.dirname(pkg.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // ZIP 스트림 생성
    const output = fs.createWriteStream(pkg.outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // 매니페스트 데이터
    const manifestFiles: PackageManifest['files'] = [];
    let totalSize = 0;
    
    // 파이프 연결
    archive.pipe(output);
    
    // 파일 추가
    for (const file of pkg.files) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`File not found: ${file.path}`);
      }
      
      const stats = fs.statSync(file.path);
      const fileBuffer = fs.readFileSync(file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      archive.file(file.path, { name: file.name });
      
      manifestFiles.push({
        name: file.name,
        type: file.type,
        size: stats.size,
        hash: `sha256:${hash}`,
      });
      
      totalSize += stats.size;
    }
    
    // 매니페스트 생성
    const manifest: PackageManifest = {
      bidId: pkg.bidId,
      bidTitle: pkg.bidTitle,
      createdAt: new Date().toISOString(),
      files: manifestFiles,
      totalSize,
      packageHash: '', // 나중에 계산
    };
    
    // 매니페스트를 ZIP에 추가
    const manifestJson = JSON.stringify(manifest, null, 2);
    archive.append(manifestJson, { name: 'MANIFEST.json' });
    
    // ZIP 완료
    await archive.finalize();
    
    // 패키지 해시 계산
    await new Promise(resolve => output.on('close', resolve));
    
    const zipBuffer = fs.readFileSync(pkg.outputPath);
    manifest.packageHash = `sha256:${crypto.createHash('sha256').update(zipBuffer).digest('hex')}`;
    
    return {
      success: true,
      zipPath: pkg.outputPath,
      manifest,
    };
    
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
```

---

## ✅ Phase 3-4 체크리스트

```
[ ] BidAnalyzer 구현
[ ] XlsxBuilder 구현 (견적서)
[ ] PptxBuilder 구현 (발표자료)
[ ] submission-zip 구현
[ ] API Route 연동
[ ] 통합 테스트
```

---

**다음**: `05_QUICK_REFERENCE.md` (CLI 빠른 참조)
