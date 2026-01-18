# QETTA MVP v2

> **in·ev·it·able** — 데이터가 흐르면, 결과가 따라옵니다.

---

## Brand Identity

| Key | Value |
|-----|-------|
| **Name** | QETTA (퀘타) |
| **Slogan** | in·ev·it·able |
| **Tagline** | Data Flows. Results Follow. |
| **Color** | #2563eb |

---

## Core Pipeline

```
📡 데이터 수집 → 🔄 정규화 → 💾 정본 저장 → 🧠 필연 엔진 → 📤 출력
     │                                              │
     │                                    ┌─────────┴─────────┐
     │                                    ▼                   ▼
OTT Chip / CSV / API              📋 Qetta 증빙      📊 Qetta 입찰
                                  (Gov ZIP)          (DOCX/XLSX/PPTX)
```

---

## 3단계 AI (필연 엔진)

| Layer | 비율 | 방식 | 비용 |
|-------|------|------|------|
| **Layer 1** | 95% | 규칙 처리 | ₩0 |
| **Layer 2** | 4% | 확률 예측 | 최소 |
| **Layer 3** | 1% | 언어 AI (Claude) | ₩6M/년 상한 |

**원칙**: "95%는 규칙, AI는 백업"

---

## Tech Stack

```yaml
Framework: Next.js 15, React 19, TypeScript 5.9
Styling: Tailwind CSS 4
Database: Supabase PostgreSQL + pgvector + RLS
AI: Claude API (Layer 3 백업용)
Documents: docx, exceljs, pptxgenjs
Testing: Vitest, Playwright
```

---

## 필수 명령어

```bash
pnpm dev              # 개발 서버 (localhost:3000)
pnpm build            # 프로덕션 빌드
pnpm test             # Vitest 유닛 테스트
pnpm test:e2e         # Playwright E2E
pnpm lint --fix       # ESLint + 자동 수정
pnpm tsc --noEmit     # 타입 체크
```

---

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── evidence/      # 증빙 API
│   │   ├── tender/        # 입찰 API
│   │   └── agi/           # 필연 엔진 API
│   └── dashboard/         # 대시보드 UI
├── components/            # React 컴포넌트
├── lib/                   # 핵심 비즈니스 로직
│   ├── govzip/           # Gov ZIP 생성 (MANIFEST v1.2)
│   ├── docs/             # 문서 생성 (DOCX/XLSX/PPTX)
│   ├── tender/           # 입찰 수집/분석
│   │   ├── collectors/   # G2B, UNGM, SAM, KZ
│   │   └── analyzers/    # FitScorer, BidAnalyzer
│   └── agi/              # 필연 엔진 (3단계 AI)
└── supabase/             # DB 마이그레이션
```

---

## 데이터 테이블 (정본 데이터)

### 증빙 데이터
- `events` — 설비 상태 기록 (MVTS)
- `actions` — 조치 이력
- `evidence_snapshots` — 정부 제출 패키지

### 입찰 데이터
- `bids` — 입찰 공고
- `bid_analyses` — 분석 결과
- `generated_documents` — 생성 문서

---

## 코드 스타일

- **IMPORTANT**: ES modules 사용 (import/export)
- **IMPORTANT**: TypeScript strict mode 필수
- **IMPORTANT**: 함수형 컴포넌트 + React 19 훅
- **YOU MUST**: 새 파일 생성 전 기존 파일 확인
- **YOU MUST**: 테스트 없이 코드 커밋 금지

---

## Git 규칙

```
브랜치: main | feature/* | fix/* | chore/*
커밋: conventional commits (feat:, fix:, chore:, docs:, test:)
Co-Author: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## 보안 규칙

- **NEVER**: .env 파일 읽기/수정/커밋
- **NEVER**: secrets, credentials 파일 접근
- **NEVER**: rm -rf, sudo, --force 명령어
- **NEVER**: eval(), innerHTML 직접 사용
- **ALWAYS**: 사용자 입력 검증
- **ALWAYS**: 파라미터화된 쿼리 사용

---

## 출력물 스펙

### Gov ZIP (정부 제출 패키지)
```
gov_package_YYYY-MM.zip
├── MANIFEST.json      # 무결성 검증 (SHA-256)
├── events.csv         # 설비 상태 기록
├── actions.csv        # 조치 이력
├── report.pdf         # 리포트
└── photos/            # 조치 사진
```

### 입찰 문서
- 제안서: DOCX (docx npm)
- 견적서: XLSX (exceljs)
- 발표자료: PPTX (pptxgenjs)

---

## API 수집 원칙

> "API로 수집, 문서는 파싱하지 않는다"

| 소스 | API | 상태 |
|------|-----|------|
| 나라장터 (G2B) | 조달청 공공데이터 | ✅ |
| UNGM | 공개 REST API | ✅ |
| SAM.gov | api.sam.gov | ✅ |
| 카자흐스탄 | goszakup.gov.kz | ✅ |

---

## Quality Gate

```bash
pnpm tsc --noEmit    # TypeScript 에러 0
pnpm lint            # ESLint 에러 0
pnpm build           # 빌드 성공
pnpm test            # 테스트 통과
```

---

## 참조 문서

- `docs/business-plan/` — 사업계획서
- `docs/recovered-plans/` — v3 마이그레이션 계획
- `supabase/migrations/` — DB 스키마

---

## Links

| 환경 | URL |
|------|-----|
| Production | https://qetta-mvp-v2.vercel.app |
| GitHub | https://github.com/sihu-dev/qetta-mvp-v2 |
| Supabase | https://lryxykhbaisdkqhrkbpm.supabase.co |

---

*Last Updated: 2026-01-19*
