# 🔧 PHASE 1: 기반 구축

> **For**: Claude Code CLI  
> **Duration**: 1-2주  
> **Prerequisites**: 기존 Qetta 프로젝트 클론

---

## 1.1 패키지 설치

```bash
# 문서 생성
pnpm add docx@^8.5.0 exceljs@^4.4.0 pptxgenjs@^3.12.0

# 압축/해시
pnpm add archiver@^7.0.0

# HTTP/XML
pnpm add axios@^1.6.0 xml2js@^0.6.2

# 스케줄링 (선택)
pnpm add node-cron@^3.0.3

# 타입
pnpm add -D @types/archiver @types/xml2js @types/node-cron
```

---

## 1.2 디렉토리 구조 생성

```bash
# Tender 모듈
mkdir -p src/lib/tender/collectors
mkdir -p src/lib/tender/analyzers
mkdir -p src/lib/tender/generators
mkdir -p src/lib/tender/types

# Docs 통합 모듈
mkdir -p src/lib/docs

# 다국어
mkdir -p src/lib/i18n/translations

# 프론트엔드 라우트
mkdir -p "src/app/(dashboard)/tender"
mkdir -p "src/app/(dashboard)/tender/[id]"

# API 라우트
mkdir -p src/app/api/tender/collect
mkdir -p src/app/api/tender/analyze
mkdir -p src/app/api/tender/generate
```

---

## 1.3 기본 타입 정의

### `src/lib/tender/types/index.ts`

```typescript
// ============================================================
// Qetta.Tender - Type Definitions
// ============================================================

// 입찰 소스
export type BidSource = 'g2b' | 'ungm' | 'sam' | 'kz';

// 입찰 상태
export type BidStatus = 
  | 'new' 
  | 'analyzing' 
  | 'interested' 
  | 'applied' 
  | 'won' 
  | 'lost' 
  | 'expired';

// 경쟁 수준
export type CompetitionLevel = 'low' | 'medium' | 'high';

// 문서 타입
export type DocumentType = 'proposal' | 'quotation' | 'presentation' | 'package';

// 문서 포맷
export type DocumentFormat = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'zip';

// ============================================================
// Core Interfaces
// ============================================================

export interface Bid {
  id: string;
  orgId: string;
  source: BidSource;
  externalId: string;
  title: string;
  description?: string;
  budget?: number;
  currency: string;
  deadline?: Date;
  status: BidStatus;
  fitScore?: number;
  rawData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BidAnalysis {
  id: string;
  bidId: string;
  orgId: string;
  qualificationsMet: QualificationCheck[];
  requiredDocuments: RequiredDocument[];
  competitionLevel: CompetitionLevel;
  winProbability: number;
  recommendations: string[];
  analyzedAt: Date;
}

export interface QualificationCheck {
  requirement: string;
  met: boolean;
  note?: string;
}

export interface RequiredDocument {
  name: string;
  required: boolean;
  available: boolean;
  templateId?: string;
}

export interface GeneratedDocument {
  id: string;
  bidId?: string;
  orgId: string;
  docType: DocumentType;
  format: DocumentFormat;
  filePath: string;
  fileSize?: number;
  generatedAt: Date;
}

// ============================================================
// Collector Interfaces
// ============================================================

export interface CollectorConfig {
  source: BidSource;
  apiKey?: string;
  baseUrl: string;
  rateLimit?: number; // requests per minute
}

export interface CollectorResult {
  success: boolean;
  source: BidSource;
  count: number;
  bids: Bid[];
  errors?: string[];
  collectedAt: Date;
}

export interface BidFilter {
  keywords?: string[];
  minBudget?: number;
  maxBudget?: number;
  deadlineAfter?: Date;
  deadlineBefore?: Date;
  categories?: string[];
}

// ============================================================
// Analyzer Interfaces
// ============================================================

export interface AnalyzerConfig {
  orgProfile: OrgProfile;
  enableAI?: boolean; // Claude API 사용 여부
}

export interface OrgProfile {
  id: string;
  name: string;
  revenue?: number;
  employees?: number;
  certifications?: string[];
  pastProjects?: PastProject[];
}

export interface PastProject {
  title: string;
  client: string;
  amount: number;
  year: number;
  category: string;
}

// ============================================================
// Generator Interfaces
// ============================================================

export interface GeneratorConfig {
  template?: string;
  language: 'ko' | 'en' | 'ru' | 'kz';
  includeAppendix?: boolean;
}

export interface ProposalData {
  bid: Bid;
  org: OrgProfile;
  technicalApproach: string;
  timeline: TimelineItem[];
  team: TeamMember[];
  budget: BudgetItem[];
}

export interface TimelineItem {
  phase: string;
  startDate: Date;
  endDate: Date;
  deliverables: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  experience: string;
}

export interface BudgetItem {
  category: string;
  amount: number;
  note?: string;
}
```

---

## 1.4 수집기 베이스 클래스

### `src/lib/tender/collectors/base-collector.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import { 
  CollectorConfig, 
  CollectorResult, 
  Bid, 
  BidFilter,
  BidSource 
} from '../types';

export abstract class BaseCollector {
  protected config: CollectorConfig;
  protected client: AxiosInstance;
  
  constructor(config: CollectorConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'Qetta/4.0',
      },
    });
    
    if (config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = 
        `Bearer ${config.apiKey}`;
    }
  }
  
  abstract get source(): BidSource;
  
  abstract collect(filter?: BidFilter): Promise<CollectorResult>;
  
  abstract parseBid(raw: unknown): Bid;
  
  protected async rateLimitDelay(): Promise<void> {
    if (this.config.rateLimit) {
      const delay = 60000 / this.config.rateLimit;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  protected handleError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return `${error.response?.status}: ${error.message}`;
    }
    return String(error);
  }
}
```

---

## 1.5 문서 빌더 베이스

### `src/lib/docs/index.ts`

```typescript
// Document Builder Exports
export { DocxBuilder } from './docx-builder';
export { XlsxBuilder } from './xlsx-builder';
export { PptxBuilder } from './pptx-builder';
export { PdfBuilder } from './pdf-builder';

// Types
export interface BuilderOptions {
  language?: 'ko' | 'en' | 'ru' | 'kz';
  template?: string;
  outputPath?: string;
}

export interface BuildResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
}
```

### `src/lib/docs/docx-builder.ts`

```typescript
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { BuilderOptions, BuildResult } from './index';

export class DocxBuilder {
  private doc: Document | null = null;
  private options: BuilderOptions;
  
  constructor(options: BuilderOptions = {}) {
    this.options = {
      language: 'ko',
      ...options,
    };
  }
  
  create(title: string, sections: DocxSection[]): this {
    const children = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
    ];
    
    for (const section of sections) {
      children.push(...this.buildSection(section));
    }
    
    this.doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });
    
    return this;
  }
  
  private buildSection(section: DocxSection): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    if (section.heading) {
      paragraphs.push(new Paragraph({
        text: section.heading,
        heading: section.level || HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }));
    }
    
    if (section.content) {
      paragraphs.push(new Paragraph({
        children: [new TextRun(section.content)],
        spacing: { after: 200 },
      }));
    }
    
    if (section.bullets) {
      for (const bullet of section.bullets) {
        paragraphs.push(new Paragraph({
          text: bullet,
          bullet: { level: 0 },
        }));
      }
    }
    
    return paragraphs;
  }
  
  async save(outputPath: string): Promise<BuildResult> {
    if (!this.doc) {
      return { success: false, error: 'Document not created' };
    }
    
    try {
      const buffer = await Packer.toBuffer(this.doc);
      const dir = path.dirname(outputPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
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
}

export interface DocxSection {
  heading?: string;
  level?: HeadingLevel;
  content?: string;
  bullets?: string[];
  table?: DocxTableData;
}

export interface DocxTableData {
  headers: string[];
  rows: string[][];
}
```

---

## 1.6 DB 마이그레이션

### `supabase/migrations/YYYYMMDD_add_tender_tables.sql`

```sql
-- ============================================================
-- Qetta.Tender Tables
-- ============================================================

-- 입찰 공고
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('g2b', 'ungm', 'sam', 'kz')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget BIGINT,
  currency TEXT DEFAULT 'KRW',
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new' 
    CHECK (status IN ('new', 'analyzing', 'interested', 'applied', 'won', 'lost', 'expired')),
  fit_score INT CHECK (fit_score >= 0 AND fit_score <= 100),
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, external_id)
);

-- 입찰 분석 결과
CREATE TABLE IF NOT EXISTS bid_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  qualifications_met JSONB DEFAULT '[]',
  required_documents JSONB DEFAULT '[]',
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  win_probability INT CHECK (win_probability >= 0 AND win_probability <= 100),
  recommendations JSONB DEFAULT '[]',
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 생성된 문서
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('proposal', 'quotation', 'presentation', 'package')),
  format TEXT NOT NULL CHECK (format IN ('docx', 'xlsx', 'pptx', 'pdf', 'zip')),
  file_path TEXT NOT NULL,
  file_size INT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bids_org_id ON bids(org_id);
CREATE INDEX IF NOT EXISTS idx_bids_source ON bids(source);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_deadline ON bids(deadline);
CREATE INDEX IF NOT EXISTS idx_bids_fit_score ON bids(fit_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_bid_analyses_bid_id ON bid_analyses(bid_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_bid_id ON generated_documents(bid_id);

-- RLS 정책
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- 조직별 접근 제한
CREATE POLICY "Users can view their org bids" ON bids
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their org bids" ON bids
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org bids" ON bids
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- bid_analyses, generated_documents에도 동일 정책 적용
CREATE POLICY "Users can view their org analyses" ON bid_analyses
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org documents" ON generated_documents
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 1.7 환경 변수 템플릿

### `.env.local.example` (추가)

```env
# ============================================================
# Qetta v4.0 - Additional Environment Variables
# ============================================================

# 조달 API Keys
G2B_API_KEY=                      # 공공데이터포털에서 발급
G2B_API_URL=https://apis.data.go.kr/1230000/BidPublicInfoService04

UNGM_API_URL=https://www.ungm.org/api/v1
# UNGM은 공개 API, 인증 불필요

SAM_API_KEY=                      # api.sam.gov에서 발급
SAM_API_URL=https://api.sam.gov/opportunities/v2

KZ_GOSZAKUP_API_URL=https://goszakup.gov.kz/api
# 카자흐스탄은 계정 등록 후 토큰 발급

# 한컴독스 API (HWP 변환 백업용)
HANCOM_DOCS_API_KEY=
HANCOM_DOCS_API_URL=https://api.hancomdocs.com/v1

# 번역 API (다국어 지원)
DEEPL_API_KEY=
```

---

## ✅ Phase 1 체크리스트

```
[ ] 패키지 설치 완료
[ ] 디렉토리 구조 생성
[ ] 타입 정의 파일 생성
[ ] BaseCollector 클래스 생성
[ ] DocxBuilder 클래스 생성
[ ] DB 마이그레이션 실행
[ ] 환경 변수 설정
[ ] TypeScript 컴파일 확인
```

---

**다음**: `02_PHASE2_COLLECTORS.md` (나라장터/UNGM 수집기 구현)
