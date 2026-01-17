# Qetta MVP v2 - Claude Code Configuration

## 🎯 Brand Identity

- **Name**: Qetta
- **Slogan**: in·ev·it·able
- **Tagline**: Data Flows. Evidence Follows.
- **Primary Color**: #9333ea (Purple)

## 📁 Project Structure

```
qetta-mvp-v2/
├── .claude/                    # Claude Code 설정
│   ├── settings.json           # MCP 서버 및 설정
│   └── commands/               # 커스텀 슬래시 명령어
│       ├── evidence.md         # /evidence
│       ├── proposal.md         # /proposal
│       ├── techstack.md        # /techstack
│       ├── govzip.md           # /govzip
│       └── analyze.md          # /analyze
├── mcp-servers/
│   └── qetta-mcp/              # Qetta MCP 서버
│       └── src/
│           ├── index.ts        # 메인 서버
│           └── tools/          # MCP 도구
│               ├── evidence.ts    # 증빙 도구
│               ├── analysis.ts    # 분석 도구
│               ├── documents.ts   # 문서 생성 도구
│               └── techstack.ts   # 기술조합 도구
├── src/
│   ├── app/                    # Next.js App Router
│   └── lib/
│       ├── agi/                # AGI 모듈
│       │   ├── orchestrator/   # 오케스트레이터
│       │   ├── memory/         # 벡터 메모리
│       │   ├── reasoning/      # 추론 엔진
│       │   ├── prediction/     # 예측 엔진
│       │   ├── ultra-thinking/ # Tech Combiner (핵심!)
│       │   └── types/          # 타입 정의
│       ├── docs/               # 문서 스킬 엔진
│       │   ├── docx-builder.ts # DOCX 생성
│       │   ├── xlsx-builder.ts # XLSX 생성
│       │   └── pptx-builder.ts # PPTX 생성
│       ├── govzip/             # Gov ZIP 모듈
│       │   ├── schema.ts       # MANIFEST v1.2
│       │   ├── manifest.ts     # 매니페스트 빌더
│       │   ├── builder.ts      # ZIP 빌더
│       │   └── verify.ts       # 검증 모듈
│       └── tender/             # 입찰 모듈 (부가)
│           ├── collectors/     # 수집기
│           ├── analyzers/      # 분석기
│           └── generators/     # 생성기
└── supabase/
    └── migrations/             # DB 마이그레이션
```

## 🔧 MCP Tools

### Evidence Tools (증빙)
- `evidence_create_snapshot`: Gov ZIP 스냅샷 생성
- `evidence_verify_package`: 무결성 검증
- `evidence_list_snapshots`: 스냅샷 목록
- `evidence_get_snapshot_details`: 상세 조회

### Analysis Tools (분석)
- `analysis_events_summary`: 이벤트 요약
- `analysis_alarm_statistics`: 알람 통계
- `analysis_pattern_detection`: 패턴 탐지
- `analysis_search_memories`: 메모리 검색
- `analysis_store_insight`: 인사이트 저장

### Document Tools (문서)
- `document_generate_proposal`: 제안서 (DOCX)
- `document_generate_quotation`: 견적서 (XLSX)
- `document_generate_presentation`: 프레젠테이션 (PPTX)
- `document_list_generated`: 문서 목록

### Tech Tools (기술조합)
- `tech_recommend_stack`: 기술 스택 추천
- `tech_validate_stack`: 호환성 검증
- `tech_estimate_cost`: 비용 추정
- `tech_swot_analysis`: SWOT 분석

## 📋 MANIFEST v1.2 Spec

```typescript
interface ManifestV1_2 {
  manifest_version: '1.2';
  org_id: string;
  created_at: string;  // ISO8601
  period: {
    start: string;
    end: string;
  };
  counts: {
    events: number;
    actions: number;
    alarms: number;  // ★ v1.2 필수
  };
  files: Array<{
    name: string;    // MANIFEST.json 제외!
    hash: string;    // sha256:...
    size: number;
  }>;
  package_hash: string;
  retention_hint: {
    years: number;
    note: string;    // ★ v1.2: string 형식
  };
}
```

## 🧠 3-Tier Intelligence

| Tier | 비율 | 방식 | 비용 |
|------|------|------|------|
| 1 | 95% | Rule-based | ₩0 |
| 2 | 4% | ML (pgvector) | ₩500K/년 |
| 3 | 1% | Claude API | ₩6M/년 (cap) |

## ⚠️ 보안 용어

- ✅ 사용: "변조 탐지 가능" (tamper-evident)
- ❌ 금지: "위조 불가능" (tamper-proof)

## 🗄️ Database Tables

### Core
- `organizations`: 조직
- `org_members`: 멤버
- `events`: MVTS 이벤트
- `actions`: B2 조치

### Evidence
- `evidence_snapshots`: Gov ZIP 스냅샷

### AGI
- `memory_entries`: 벡터 메모리 (pgvector)
- `agi_insights`: 인사이트

### Tender (부가)
- `bids`: 입찰 정보
- `bid_analyses`: 분석 결과
- `generated_documents`: 생성 문서

## 🚀 Quick Commands

```bash
# 개발 서버
npm run dev

# 타입 체크
npm run type-check

# 린트
npm run lint

# MCP 서버 빌드
cd mcp-servers/qetta-mcp && npm run build
```

## 📦 Key Dependencies

- Next.js 15 (App Router)
- React 19
- Supabase (PostgreSQL + pgvector)
- Claude API (@anthropic-ai/sdk)
- docx, exceljs, pptxgenjs
- adm-zip, archiver
