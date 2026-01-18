# Qetta MVP v2

> **Production-Level Web App**
> 스마트공장 + AI바우처 + 제조 설비 공급/수요 Pool 타겟

---

## Brand

| | |
|---|---|
| **Name** | Qetta |
| **Slogan** | in·ev·it·able |
| **Tagline** | Data Flows. Evidence Follows. |
| **Color** | #2563eb (Blue - Salient) |

---

## Target Market

### 타겟 Pool
- **Pool SI** (로봇셀 통합사업자): 10,432개사
- **스마트공장** 수요기업 (기초/고도화)
- **AI바우처** 수요기업
- **디지털트윈** 참여기업

### 고객 페르소나
1. **취장님** - 제조업 대표 (엑셀 친숙)
2. **설비 공급업체** - Pool SI, 설비 제조사
3. **정부 담당자** - 지원사업 심사/관리

### 고객 가치 제안 (CVP)
- OTT칩 **50만원** = MES 대비 99% 비용 절감
- **불량 -30%** | **정지 -80%** | **ROI 0.7개월**
- 정부 제출 증빙 **자동화** (Gov ZIP)

---

## Core Pipeline

```
[OTT칩] → [AI 예지보전] → [Evidence Registry] → [Document Skills] → [정부 제출]
   ↓           ↓                  ↓                    ↓
10분 설치    72h 예측        Gov ZIP 보관      DOCX/XLSX/PPTX
50만원       고장/불량        MANIFEST v1.2     입찰 제안서
```

### 핵심 모듈
| 모듈 | 설명 | 정부사업 연계 |
|------|------|--------------|
| **OTT칩** | 플러그앤플레이 데이터 수집 | 스마트공장 기초 (자동수집) |
| **AI 예지보전** | 72시간 전 고장/불량 예측 | AI바우처 |
| **Evidence Registry** | Gov ZIP (변조 탐지 가능) | 증빙 제출 |
| **Document Skills** | DOCX/XLSX/PPTX 자동생성 | 제안서/보고서 |

### 부가 모듈
- **Tender**: 입찰 수집/분석 (G2B, UNGM, SAM, KZ)
- **Real-time Alert**: 카카오/슬랙/이메일

---

## Tech Stack

| Category | Stack |
|----------|-------|
| Framework | Next.js 15, React 19 |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL + pgvector |
| AI | Claude API |
| Documents | docx, exceljs, pptxgenjs |
| HTTP | axios, xml2js |

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── evidence/    # Gov ZIP UI
│   │   ├── agi/         # Tech Combiner
│   │   └── tender/      # 입찰 관리
│   └── api/
│       ├── evidence/
│       ├── agi/
│       └── tender/
└── lib/
    ├── agi/             # Ultra Thinking
    ├── docs/            # docx/xlsx/pptx
    ├── govzip/          # MANIFEST v1.2
    └── tender/          # collectors/analyzers
```

---

## 3-Tier Intelligence

| Tier | % | Method | Cost |
|------|---|--------|------|
| 1 | 95% | Rule-based | 0원 |
| 2 | 4% | ML (pgvector) | 50만원/년 |
| 3 | 1% | Claude API | 600만원/년 |

---

## Trigger 'ㄱ'

사용자가 'ㄱ'만 입력하면 자동 작업 실행

1. 메모리 로드
2. git/build/test 상태 분석
3. 최적 작업 선택
4. 품질 게이트: `tsc → lint → build`
5. 자동 커밋 (push는 승인 필요)

---

## Quality Gate

```bash
pnpm tsc --noEmit    # TypeScript
pnpm lint            # ESLint
pnpm build           # Next.js
```

---

## Rebuild Phase

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ | 기반 구축 (패키지, 디렉토리, DB) |
| 2 | ✅ | 수집기 (G2B, UNGM, SAM, KZ) |
| 3 | ✅ | 분석기 (BidAnalyzer, FitScorer, CompetitorAnalyzer) |
| 4 | ✅ | 문서 생성 통합 (BidDocumentGenerator) |
| 5 | ⏳ | E2E 테스트 |
| 11 | ✅ | Production Hardening |

---

## Links

- **GitHub**: https://github.com/sihu-dev/qetta-mvp-v2
- **Production**: https://qetta-mvp-v2.vercel.app
- **Docs**: `docs/rebuild-plan/`

---

## Security

- ✅ "변조 탐지 가능" (tamper-evident)
- ❌ "위조 불가능" (tamper-proof) - 사용 금지

---

*Updated: 2026-01-18*
