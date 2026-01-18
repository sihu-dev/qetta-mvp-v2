# ⚡ QETTA REBUILD - QUICK REFERENCE

> **Claude Code CLI 빠른 참조 카드**  
> **Version**: 4.0

---

## 🎯 핵심 원칙

```
"문서를 파싱하려 하지 말고, 데이터 소스를 바꿔라"

HWP/PDF 파싱 ❌ → API 수집 ✅
```

---

## 📦 패키지 설치 (복붙)

```bash
pnpm add docx@^8.5.0 exceljs@^4.4.0 pptxgenjs@^3.12.0 archiver@^7.0.0 axios@^1.6.0 xml2js@^0.6.2
pnpm add -D @types/archiver @types/xml2js
```

---

## 📁 디렉토리 생성 (복붙)

```bash
mkdir -p src/lib/tender/{collectors,analyzers,generators,types}
mkdir -p src/lib/docs
mkdir -p src/lib/i18n/translations
mkdir -p "src/app/(dashboard)/tender/[id]"
mkdir -p src/app/api/tender/{collect,analyze,generate}
```

---

## 🗂️ 파일 구조

```
src/lib/
├── tender/                     # 입찰 모듈
│   ├── types/index.ts          # 타입 정의
│   ├── collectors/
│   │   ├── base-collector.ts   # 베이스 클래스
│   │   ├── g2b-collector.ts    # 나라장터
│   │   ├── ungm-collector.ts   # UN
│   │   ├── sam-collector.ts    # 미국
│   │   └── kz-collector.ts     # 카자흐
│   ├── analyzers/
│   │   └── bid-analyzer.ts     # 3-Tier 분석
│   └── generators/
│       └── submission-zip.ts   # 제출 패키지
├── docs/                       # 문서 생성
│   ├── docx-builder.ts
│   ├── xlsx-builder.ts
│   └── pptx-builder.ts
└── agi/                        # 기존 유지
```

---

## 🔧 핵심 타입

```typescript
type BidSource = 'g2b' | 'ungm' | 'sam' | 'kz';
type BidStatus = 'new' | 'analyzing' | 'interested' | 'applied' | 'won' | 'lost' | 'expired';
type DocumentType = 'proposal' | 'quotation' | 'presentation' | 'package';
type DocumentFormat = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'zip';
```

---

## 🌐 환경 변수

```env
# 조달 API
G2B_API_KEY=          # 공공데이터포털
G2B_API_URL=https://apis.data.go.kr/1230000/BidPublicInfoService04

UNGM_API_URL=https://www.ungm.org/Public  # 인증 불필요

SAM_API_KEY=          # api.sam.gov
SAM_API_URL=https://api.sam.gov/opportunities/v2

KZ_GOSZAKUP_API_URL=https://goszakup.gov.kz/ru/api

# 한컴독스 (백업)
HANCOM_DOCS_API_KEY=
```

---

## 🗄️ DB 테이블 (핵심)

```sql
-- 입찰 공고
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  source TEXT NOT NULL,      -- g2b|ungm|sam|kz
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  budget BIGINT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'new',
  fit_score INT,
  raw_data JSONB,
  UNIQUE(source, external_id)
);

-- 분석 결과
CREATE TABLE bid_analyses (
  id UUID PRIMARY KEY,
  bid_id UUID REFERENCES bids(id),
  qualifications_met JSONB,
  competition_level TEXT,
  win_probability INT,
  recommendations JSONB
);

-- 생성 문서
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY,
  bid_id UUID REFERENCES bids(id),
  doc_type TEXT,
  format TEXT,
  file_path TEXT
);
```

---

## 🔌 API 엔드포인트

| 경로 | 메서드 | 기능 |
|------|--------|------|
| `/api/tender/collect` | POST | 입찰 수집 |
| `/api/tender/list` | GET | 목록 조회 |
| `/api/tender/[id]/analyze` | POST | 분석 실행 |
| `/api/tender/[id]/generate` | POST | 문서 생성 |

---

## ⚡ 3-Tier Intelligence

| Tier | 비율 | 처리 | 비용 |
|------|------|------|------|
| 1 | 95% | Rule Engine | ₩0 |
| 2 | 4% | ML/StoFo | 최소 |
| 3 | 1% | Claude API | ₩6M/년 |

---

## 📋 Phase 체크리스트

```
Phase 1 (1-2주): 기반 구축
[ ] 패키지 설치
[ ] 디렉토리 생성
[ ] 타입 정의
[ ] DB 마이그레이션

Phase 2 (2-3주): 수집기
[ ] G2B (나라장터) - P0
[ ] UNGM - P1
[ ] SAM.gov - P2
[ ] 카자흐 - P2

Phase 3 (2주): 분석기
[ ] BidAnalyzer
[ ] FitScorer

Phase 4 (2주): 문서 생성
[ ] DOCX Builder
[ ] XLSX Builder
[ ] PPTX Builder
[ ] ZIP Packager

Phase 5 (1주): 통합
[ ] E2E 테스트
[ ] 파일럿 실행
```

---

## 🚨 주의사항

1. **HWP 파싱 금지** - API 우선
2. **Claude API 최소화** - Tier 3는 1%만
3. **RLS 정책 필수** - 조직별 데이터 격리
4. **Rate Limit 준수** - 나라장터 100/분

---

## 📚 참조 파일

| 파일 | 내용 |
|------|------|
| `00_MASTER_PLAN.md` | 전체 아키텍처 |
| `01_PHASE1_FOUNDATION.md` | 기반 구축 코드 |
| `02_PHASE2_COLLECTORS.md` | 수집기 구현 |
| `03_PHASE3_4_ANALYZERS_GENERATORS.md` | 분석/생성기 |

---

**Last Updated**: 2026-01-18
