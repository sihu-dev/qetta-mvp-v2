/**
 * DOCX Builder - 제안서/보고서 문서 생성기
 * Uses docx npm for Word document generation
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
  PageBreak,
  ImageRun,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import type { BuilderOptions, BuildResult } from './index';

export interface DocxContent {
  title: string;
  subtitle?: string;
  company: CompanyInfo;
  sections: DocxSection[];
  appendices?: AppendixItem[];
}

export interface CompanyInfo {
  name: string;
  address?: string;
  representative?: string;
  contact?: string;
  email?: string;
  logoPath?: string;
}

export interface DocxSection {
  title: string;
  level?: 1 | 2 | 3;
  content?: string;
  bullets?: string[];
  table?: DocxTableData;
  image?: { path: string; width?: number; height?: number };
  pageBreak?: boolean;
}

export interface DocxTableData {
  headers: string[];
  rows: string[][];
  widths?: number[];
}

export interface AppendixItem {
  title: string;
  content: string;
}

export class DocxBuilder {
  private sections: (Paragraph | Table)[] = [];
  private options: BuilderOptions;

  constructor(options: BuilderOptions = {}) {
    this.options = {
      language: 'ko',
      author: 'Qetta',
      company: 'Qetta Inc.',
      ...options,
    };
  }

  /**
   * 제안서 생성
   */
  createProposal(data: DocxContent): this {
    // 표지
    this.addCoverPage(data.title, data.subtitle, data.company);

    // 목차
    this.addTableOfContents(data.sections);

    // 섹션
    for (const section of data.sections) {
      if (section.pageBreak) {
        this.sections.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
      this.addSection(section);
    }

    // 부록
    if (data.appendices && data.appendices.length > 0) {
      this.addAppendices(data.appendices);
    }

    return this;
  }

  /**
   * 표지 페이지
   */
  private addCoverPage(title: string, subtitle?: string, company?: CompanyInfo): void {
    // 빈 공간
    this.sections.push(
      new Paragraph({
        spacing: { before: 2000 },
      })
    );

    // 제목
    this.sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 56, // 28pt
            color: '9333ea', // Qetta purple
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // 부제
    if (subtitle) {
      this.sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: subtitle,
              size: 32,
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 },
        })
      );
    }

    // 회사 정보
    if (company) {
      this.sections.push(
        new Paragraph({
          spacing: { before: 2000 },
        })
      );

      this.sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: company.name,
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      );

      if (company.representative) {
        this.sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `대표: ${company.representative}`,
                size: 22,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );
      }

      if (company.email || company.contact) {
        this.sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: [company.email, company.contact].filter(Boolean).join(' | '),
                size: 20,
                color: '888888',
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );
      }
    }

    // 페이지 나눔
    this.sections.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  /**
   * 목차
   */
  private addTableOfContents(sections: DocxSection[]): void {
    this.sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '목 차',
            bold: true,
            size: 36,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    let index = 1;
    for (const section of sections) {
      const level = section.level || 1;
      const indent = (level - 1) * 400;

      this.sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: level === 1 ? `${index}. ${section.title}` : section.title,
              size: level === 1 ? 24 : 22,
              bold: level === 1,
            }),
          ],
          indent: { left: indent },
          spacing: { after: 100 },
        })
      );

      if (level === 1) index++;
    }

    this.sections.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  /**
   * 섹션 추가
   */
  private addSection(section: DocxSection): void {
    const level = section.level || 1;
    const headingLevel =
      level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;

    // 제목
    this.sections.push(
      new Paragraph({
        text: section.title,
        heading: headingLevel,
        spacing: { before: 400, after: 200 },
      })
    );

    // 본문
    if (section.content) {
      this.sections.push(
        new Paragraph({
          text: section.content,
          spacing: { after: 200 },
        })
      );
    }

    // 불릿 리스트
    if (section.bullets) {
      for (const bullet of section.bullets) {
        this.sections.push(
          new Paragraph({
            text: bullet,
            bullet: { level: 0 },
            spacing: { after: 100 },
          })
        );
      }
    }

    // 테이블
    if (section.table) {
      this.sections.push(this.createTable(section.table));
    }

    // 이미지
    if (section.image && fs.existsSync(section.image.path)) {
      const imageData = fs.readFileSync(section.image.path);
      this.sections.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageData,
              transformation: {
                width: section.image.width || 400,
                height: section.image.height || 300,
              },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      );
    }
  }

  /**
   * 테이블 생성
   */
  private createTable(data: DocxTableData): Table {
    const widths = data.widths || data.headers.map(() => 100 / data.headers.length);

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header
        new TableRow({
          children: data.headers.map(
            (header, i) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: widths[i], type: WidthType.PERCENTAGE },
                shading: { fill: 'E0E0E0' },
              })
          ),
        }),
        // Data rows
        ...data.rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell, i) =>
                  new TableCell({
                    children: [new Paragraph({ text: cell })],
                    width: { size: widths[i], type: WidthType.PERCENTAGE },
                  })
              ),
            })
        ),
      ],
    });
  }

  /**
   * 부록 추가
   */
  private addAppendices(appendices: AppendixItem[]): void {
    this.sections.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    this.sections.push(
      new Paragraph({
        text: '부 록',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 400 },
      })
    );

    for (const item of appendices) {
      this.sections.push(
        new Paragraph({
          text: item.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      this.sections.push(
        new Paragraph({
          text: item.content,
          spacing: { after: 200 },
        })
      );
    }
  }

  /**
   * 파일 저장
   */
  async save(outputPath: string): Promise<BuildResult> {
    try {
      const doc = new Document({
        creator: this.options.author,
        description: 'Generated by Qetta Document Skills Engine',
        sections: [
          {
            properties: {},
            children: this.sections,
          },
        ],
      });

      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);

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
    const doc = new Document({
      creator: this.options.author,
      description: 'Generated by Qetta Document Skills Engine',
      sections: [
        {
          properties: {},
          children: this.sections,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}
