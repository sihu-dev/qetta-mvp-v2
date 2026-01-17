# 🔧 QETTA REBUILD MASTER PLAN

> **For**: Claude Code CLI  
> **Version**: 4.0 (Major Refactoring)  
> **Based on**: FINAL SPEC v1.0 + 기존 Tech Doc v3.0 GAP 분석

---

## 📊 GAP 분석 요약

### 기존 (v3.0) vs 신규 (v4.0)

| 영역 | 기존 v3.0 | 신규 v4.0 | 변경 수준 |
|------|-----------|-----------|-----------|
| **제품 범위** | Evidence Only | Evidence + Tender | 🔴 Major |
| **입찰 수집** | 없음 | API 100% (4개 플랫폼) | 🔴 New |
| **HWP 파싱** | hwpx 직접 생성 | API 백업만 (5%) | 🟡 Change |
| **문서 생성** | adm-zip만 | docx/exceljs/pptxgenjs | 🟡 Add |
| **해외 지원** | 없음 | 4개국 (KR/UN/US/KZ) | 🔴 New |
| **AGI 엔진** | 10개 모듈 | 유지 + 입찰분석 추가 | 🟢 Extend |
| **프론트엔드** | 14개 섹션 | 유지 + Tender 대시보드 | 🟡 Add |

---

## 🏗️ 리빌드 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         QETTA v4.0 Architecture                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Qetta.Tender (NEW)                            │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  Data Collectors         │  Document Generators               │  │   │
│  │  │  ─────────────────────  │  ─────────────────────────────────  │  │   │
│  │  │  • g2b-collector.ts     │  • proposal-docx.ts                 │  │   │
│  │  │  • ungm-collector.ts    │  • quotation-xlsx.ts                │  │   │
│  │  │  • sam-collector.ts     │  • presentation-pptx.ts             │  │   │
│  │  │  • kz-collector.ts      │  • submission-zip.ts                │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Shared AGI Engine (EXTEND)                    │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  기존 모듈 (유지)        │  신규 모듈 (추가)                   │  │   │
│  │  │  ─────────────────────  │  ─────────────────────────────────  │  │   │
│  │  │  • orchestrator         │  • bid-analyzer.ts (NEW)            │  │   │
│  │  │  • memory               │  • fit-scorer.ts (NEW)              │  │   │
│  │  │  • reasoning            │  • competitor-analyzer.ts (NEW)     │  │   │
│  │  │  • prediction           │  • proposal-generator.ts (NEW)      │  │   │
│  │  │  • ultra-thinking       │                                      │  │   │
│  │  │  • sequence-explorer    │                                      │  │   │
│  │  │  • planner              │                                      │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Qetta.Evidence (KEEP)                         │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  • govzip/manifest.ts (v1.2)                                   │  │   │
│  │  │  • govzip/schema.ts                                            │  │   │
│  │  │  • report-generator.ts                                         │  │   │
│  │  │  • evidence-registry.ts                                        │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 디렉토리 구조 변경

### 신규 추가 디렉토리

```
src/
├── lib/
│   ├── agi/                    # (기존 유지)
│   │   ├── orchestrator/
│   │   ├── memory/
│   │   ├── reasoning/
│   │   ├── prediction/
│   │   ├── ultra-thinking/
│   │   ├── sequence-explorer/
│   │   ├── planner/
│   │   └── streaming/
│   │
│   ├── tender/                 # ★ NEW: 입찰 자동화
│   │   ├── collectors/
│   │   │   ├── base-collector.ts
│   │   │   ├── g2b-collector.ts        # 나라장터 API
│   │   │   ├── ungm-collector.ts       # UN 조달
│   │   │   ├── sam-collector.ts        # 미국 SAM.gov
│   │   │   └── kz-collector.ts         # 카자흐스탄
│   │   ├── analyzers/
│   │   │   ├── bid-analyzer.ts         # 공고 분석
│   │   │   ├── fit-scorer.ts           # 적합도 점수
│   │   │   └── competitor-analyzer.ts  # 경쟁 분석
│   │   ├── generators/
│   │   │   ├── proposal-docx.ts        # 제안서 DOCX
│   │   │   ├── quotation-xlsx.ts       # 견적서 XLSX
│   │   │   ├── presentation-pptx.ts    # 발표 PPTX
│   │   │   └── submission-zip.ts       # 제출 패키지
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── docs/                   # ★ NEW: 문서 생성 통합
│   │   ├── docx-builder.ts             # docx npm
│   │   ├── xlsx-builder.ts             # exceljs
│   │   ├── pptx-builder.ts             # pptxgenjs
│   │   ├── pdf-builder.ts              # WeasyPrint 연동
│   │   └── index.ts
│   │
│   ├── govzip/                 # (기존 유지 + 확장)
│   │   ├── manifest.ts
│   │   ├── schema.ts
│   │   ├── report.ts
│   │   └── hwp-api.ts          # ★ NEW: 한컴독스 API 연동
│   │
│   └── i18n/                   # ★ NEW: 다국어 지원
│       ├── translations/
│       │   ├── ko.json
│       │   ├── en.json
│       │   ├── ru.json
│       │   └── kz.json
│       └── index.ts
│
├── app/
│   ├── (dashboard)/
│   │   ├── tender/             # ★ NEW: 입찰 대시보드
│   │   │   ├── page.tsx               # 입찰 목록
│   │   │   ├── [id]/page.tsx          # 상세
│   │   │   ├── analyze/page.tsx       # 분석
│   │   │   └── generate/page.tsx      # 문서 생성
│   │   └── ...                 # (기존 유지)
│   │
│   └── api/
│       ├── tender/             # ★ NEW
│       │   ├── collect/route.ts
│       │   ├── analyze/route.ts
│       │   └── generate/route.ts
│       └── ...                 # (기존 유지)
```

---

## 📦 패키지 의존성 변경

### 추가 패키지

```json
{
  "dependencies": {
    // 문서 생성 (NEW)
    "docx": "^8.5.0",
    "exceljs": "^4.4.0",
    "pptxgenjs": "^3.12.0",
    
    // PDF (신규 방식)
    "puppeteer": "^22.0.0",
    
    // 압축 (기존 adm-zip 교체)
    "archiver": "^7.0.0",
    
    // 해시
    "crypto": "내장",
    
    // HTTP 클라이언트 (API 수집용)
    "axios": "^1.6.0",
    
    // XML 파싱 (RSS)
    "xml2js": "^0.6.2",
    
    // 스케줄링
    "node-cron": "^3.0.3"
  }
}
```

### 제거 패키지

```json
{
  "remove": {
    // HWP 직접 생성 관련 (API로 대체)
    "hwp.js": "제거",
    "olefile": "제거"
  }
}
```

---

## 🗄️ DB 스키마 변경

### 신규 테이블

```sql
-- ★ NEW: 입찰 공고
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  source TEXT NOT NULL,  -- 'g2b' | 'ungm' | 'sam' | 'kz'
  external_id TEXT NOT NULL,  -- 원본 공고번호
  title TEXT NOT NULL,
  description TEXT,
  budget BIGINT,
  currency TEXT DEFAULT 'KRW',
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL,  -- 'new' | 'analyzing' | 'interested' | 'applied' | 'won' | 'lost' | 'expired'
  fit_score INT,  -- 0-100
  raw_data JSONB,  -- 원본 API 응답
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, external_id)
);

-- ★ NEW: 입찰 분석 결과
CREATE TABLE bid_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id),
  org_id UUID NOT NULL REFERENCES orgs(id),
  qualifications_met JSONB,  -- 자격요건 충족 여부
  required_documents JSONB,  -- 필수 서류 목록
  competition_level TEXT,  -- 'low' | 'medium' | 'high'
  win_probability INT,  -- 0-100
  recommendations JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ★ NEW: 생성된 문서
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES bids(id),
  org_id UUID NOT NULL REFERENCES orgs(id),
  doc_type TEXT NOT NULL,  -- 'proposal' | 'quotation' | 'presentation' | 'package'
  format TEXT NOT NULL,  -- 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'zip'
  file_path TEXT NOT NULL,
  file_size INT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_bids_source ON bids(source);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_deadline ON bids(deadline);
CREATE INDEX idx_bids_fit_score ON bids(fit_score DESC);
```

---

## 🔌 API 엔드포인트 추가

### Tender API Routes

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/tender/collect` | POST | 입찰 공고 수집 트리거 |
| `/api/tender/list` | GET | 입찰 목록 조회 |
| `/api/tender/[id]` | GET | 입찰 상세 |
| `/api/tender/[id]/analyze` | POST | 입찰 분석 실행 |
| `/api/tender/[id]/generate` | POST | 문서 생성 |
| `/api/tender/[id]/documents` | GET | 생성된 문서 목록 |

---

## ⚙️ 환경 변수 추가

```env
# 기존 유지
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# ★ NEW: 조달 API
G2B_API_KEY=                  # 나라장터 (공공데이터포털)
UNGM_API_KEY=                 # UN Global Marketplace
SAM_API_KEY=                  # SAM.gov
KZ_GOSZAKUP_API_KEY=          # 카자흐스탄

# ★ NEW: 한컴독스 API (백업용)
HANCOM_DOCS_API_KEY=
HANCOM_DOCS_API_URL=

# ★ NEW: 다국어 번역 (백업)
DEEPL_API_KEY=
```

---

## 🚀 실행 순서 (Phase)

### Phase 1: 기반 구축 (1-2주)

```bash
# 1.1 패키지 설치
pnpm add docx exceljs pptxgenjs archiver axios xml2js node-cron

# 1.2 디렉토리 생성
mkdir -p src/lib/tender/{collectors,analyzers,generators,types}
mkdir -p src/lib/docs
mkdir -p src/lib/i18n/translations
mkdir -p src/app/\(dashboard\)/tender

# 1.3 DB 마이그레이션
supabase migration new add_tender_tables
```

### Phase 2: 수집기 구현 (2-3주)

```
우선순위:
1. g2b-collector.ts (나라장터) - P0
2. ungm-collector.ts (UN) - P1
3. sam-collector.ts (미국) - P2
4. kz-collector.ts (카자흐) - P2
```

### Phase 3: 분석기 구현 (2주)

```
1. bid-analyzer.ts - 공고문 파싱/분석
2. fit-scorer.ts - 자격요건 매칭
3. competitor-analyzer.ts - 경쟁 강도
```

### Phase 4: 문서 생성기 (2주)

```
1. docx-builder.ts - 기본 DOCX
2. proposal-docx.ts - 제안서 템플릿
3. quotation-xlsx.ts - 견적서
4. presentation-pptx.ts - 발표자료
```

### Phase 5: 통합 테스트 (1주)

```
1. E2E 테스트 추가
2. 실제 공고 파일럿
3. 성능 최적화
```

---

**다음 파일**: `REBUILD_PHASE1_COMMANDS.md` (Claude Code CLI 직접 실행 명령)
