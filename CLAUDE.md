# Qetta MVP v2 - Claude Code Configuration

> **GitHub Claude App / Mobile 호환**
> 통합 플랫폼: OTT칩 → AI 예지보전 → 문서 자동화 → 정부 증빙

---

## Project Info

- **Name**: Qetta
- **Slogan**: in·ev·it·able
- **Tagline**: Data Flows. Evidence Follows.
- **Primary Color**: #9333ea (Purple)
- **Working Directory**: `/home/sihu2/qetta-mvp-v2`
- **GitHub**: https://github.com/sihu-dev/qetta-mvp-v2
- **Production**: https://qetta-mvp-v2.vercel.app

---

## Core Vision

**"in·ev·it·able - Data Flows. Evidence Follows."**

OTT칩으로 설비 데이터 수집 → AI로 예지보전 → 문서 자동 생성 → 정부 증빙 제출

### 통합 파이프라인
```
[OTT칩] → [AI 예지보전] → [Evidence Registry] → [Document Skills] → [정부 제출]
   ↓           ↓                  ↓                    ↓
데이터 수집   고장/불량 예측    Gov ZIP 보관      DOCX/XLSX/PPTX
```

### 핵심 모듈
1. **OTT칩**: 10분 설치, 50만원, 플러그앤플레이 (설비 데이터 수집)
2. **AI 예지보전**: 고장/불량 72시간 전 예측
3. **Evidence Registry**: Gov ZIP 패키지 (MANIFEST v1.2, 변조 탐지 가능)
4. **Document Skills**: DOCX/XLSX/PPTX 자동생성 (docx, exceljs, pptxgenjs)

### 부가 모듈
- **Tender**: 입찰 수집/분석/문서생성 (G2B, UNGM, SAM, KZ)
- **Real-time Alert**: 카카오/슬랙/이메일 알림

---

## Trigger System

### 'ㄱ' 트리거 (Autonomous Self-Healing Growth Mode)

사용자가 'ㄱ'만 입력하면 자동으로 최적 작업 선택 및 실행

**자동 활성화 순서:**
1. 메모리 MCP 자동 로드
2. 현재 상태 분석 (git, build, test)
3. TODO 리스트 동기화
4. 최적 작업 자동 선택
5. 품질 게이트 자동 실행
6. 성공 시 자동 커밋
7. 다음 작업 자동 제안

**품질 게이트:**
```bash
pnpm tsc --noEmit    # TypeScript strict
pnpm lint            # ESLint
pnpm build           # Next.js 빌드
```

**권한:**
- 자율: code/file/package/test/commit
- 승인 필요: push/deploy

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL + pgvector
- **AI**: Claude API (@anthropic-ai/sdk)
- **Documents**: docx, exceljs, pptxgenjs, archiver
- **HTTP**: axios, xml2js
- **Package Manager**: pnpm

---

## Project Structure

```
qetta-mvp-v2/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── evidence/   # Evidence Registry UI
│   │   │   ├── agi/        # Tech Combiner UI
│   │   │   └── tender/     # Tender UI
│   │   └── api/
│   │       ├── evidence/   # Evidence API
│   │       ├── agi/        # AGI API
│   │       └── tender/     # Tender API
│   └── lib/
│       ├── agi/            # AGI 모듈 (Ultra Thinking)
│       ├── docs/           # Document Skills (docx/xlsx/pptx)
│       ├── govzip/         # Evidence Registry (MANIFEST v1.2)
│       ├── tender/         # Tender 모듈
│       │   ├── collectors/ # G2B, UNGM, SAM, KZ
│       │   ├── analyzers/
│       │   └── generators/
│       └── brand/          # 브랜드 상수
├── docs/
│   └── rebuild-plan/       # v4.0 리빌드 계획
└── supabase/
    └── migrations/
```

---

## 3-Tier Intelligence

| Tier | 비율 | 방식 | 비용 |
|------|------|------|------|
| 1 | 95% | Rule-based | 0원 |
| 2 | 4% | ML (pgvector) | 50만원/년 |
| 3 | 1% | Claude API | 600만원/년 (cap) |

---

## Database Tables

### Core
- `organizations`, `org_members`, `events`, `actions`

### Evidence
- `evidence_snapshots`: Gov ZIP 스냅샷

### AGI
- `memory_entries`: 벡터 메모리 (pgvector)
- `agi_insights`: 인사이트

### Tender
- `bids`, `bid_analyses`, `generated_documents`

---

## MANIFEST v1.2 Spec

```typescript
interface ManifestV1_2 {
  manifest_version: '1.2';
  org_id: string;
  created_at: string;
  period: { start: string; end: string; };
  counts: { events: number; actions: number; alarms: number; };
  files: Array<{ name: string; hash: string; size: number; }>;
  package_hash: string;
  retention_hint: { years: number; note: string; };
}
```

---

## Rebuild Plan v4.0

> **docs/rebuild-plan/** 참조

### Phase 진행
- [x] Phase 1: 기반 구축 (패키지, 디렉토리, DB)
- [~] Phase 2: 수집기 (G2B 완료, UNGM/SAM/KZ 진행중)
- [ ] Phase 3: 분석기 (BidAnalyzer, FitScorer)
- [ ] Phase 4: 문서 생성 통합 테스트
- [ ] Phase 5: E2E 테스트

### 핵심 원칙
```
"문서를 파싱하려 하지 말고, 데이터 소스를 바꿔라"
HWP/PDF 파싱 ❌ → API 수집 ✅
```

---

## Security

- **사용**: "변조 탐지 가능" (tamper-evident)
- **금지**: "위조 불가능" (tamper-proof)

---

## Quick Commands

```bash
pnpm dev          # 개발
pnpm tsc --noEmit # 타입 체크
pnpm lint         # 린트
pnpm build        # 빌드
```

---

*Last Updated: 2026-01-18*
