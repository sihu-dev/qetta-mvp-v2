# Qetta MVP v2 - Claude Code Configuration

> **GitHub Claude App / Mobile 호환 버전**
> 이 파일은 Claude Code, GitHub Claude App, Mobile에서 동일하게 작동합니다.

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

**'공정의 전 범위를 AI 지능으로 구현한다'**

- Qetta OS = 스마트공장 + 로봇셀 통합 OS
- OTT칩으로 레거시 설비를 스마트하게 업그레이드
- Pool SI 로봇셀 10,432개사가 타겟

### 주력 서비스 (CORE)
1. **OTT칩**: 10분 설치, 50만원, 플러그앤플레이
2. **AI 예지보전**: 고장/불량 72시간 전 예측
3. **실시간 알림**: 온도/진동/전류 임계값 초과 시 카카오/슬랙/이메일

### Hero 카피
- **메인**: '설비가 멈추기 전에 알려주는 AI'
- **서브**: '모든 설비를 하나로. OTT칩 50만원으로 품질 AI 연결.'
- **스탯**: 불량 -30% | 정지 -80% | ROI 0.7개월

---

## Trigger System

### 'ㄱ' 트리거 (Autonomous Self-Healing Growth Mode)

사용자가 'ㄱ'만 입력하면 자동으로 최적 작업 선택 및 실행

**자동 활성화 순서:**
1. 메모리 MCP 자동 로드
2. 현재 상태 분석 (git, build, test)
3. TODO 리스트 동기화
4. 최적 작업 자동 선택
5. 병렬 작업 실행 (가능 시)
6. 품질 게이트 자동 실행
7. 성공 시 자동 커밋
8. 다음 작업 자동 제안

**품질 게이트 파이프라인:**
```bash
pnpm tsc --noEmit          # TypeScript strict
npx eslint src --max-warnings=0
pnpm build                 # Next.js 프로덕션 빌드
```

**권한:**
- 자율: code/file/package/test/commit
- 승인 필요: push/deploy

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Database**: Supabase PostgreSQL + pgvector
- **AI**: Claude API (@anthropic-ai/sdk)
- **Documents**: docx, exceljs, pptxgenjs
- **Package Manager**: pnpm

---

## Project Structure

```
qetta-mvp-v2/
├── .claude/                    # Claude Code 설정
│   ├── settings.json           # MCP 서버 및 설정
│   └── commands/               # 커스텀 슬래시 명령어
├── mcp-servers/
│   └── qetta-mcp/              # Qetta MCP 서버 (17개 도구)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   └── dashboard/          # 대시보드 페이지
│   └── lib/
│       ├── agi/                # AGI 모듈
│       │   ├── orchestrator/   # 오케스트레이터
│       │   ├── memory/         # 벡터 메모리
│       │   ├── reasoning/      # 추론 엔진
│       │   ├── prediction/     # 예측 엔진
│       │   └── ultra-thinking/ # Tech Combiner (핵심!)
│       ├── docs/               # 문서 스킬 엔진
│       ├── govzip/             # Gov ZIP 모듈
│       └── tender/             # 입찰 모듈 (부가)
└── supabase/
    └── migrations/             # DB 마이그레이션
```

---

## MCP Tools (17개)

### Evidence Tools (4개)
- `evidence_create_snapshot`: Gov ZIP 스냅샷 생성
- `evidence_verify_package`: 무결성 검증
- `evidence_list_snapshots`: 스냅샷 목록
- `evidence_get_snapshot_details`: 상세 조회

### Analysis Tools (5개)
- `analysis_events_summary`: 이벤트 요약
- `analysis_alarm_statistics`: 알람 통계
- `analysis_pattern_detection`: 패턴 탐지
- `analysis_search_memories`: 메모리 검색
- `analysis_store_insight`: 인사이트 저장

### Document Tools (4개)
- `document_generate_proposal`: 제안서 (DOCX)
- `document_generate_quotation`: 견적서 (XLSX)
- `document_generate_presentation`: 프레젠테이션 (PPTX)
- `document_list_generated`: 문서 목록

### Tech Tools (4개)
- `tech_recommend_stack`: 기술 스택 추천
- `tech_validate_stack`: 호환성 검증
- `tech_estimate_cost`: 비용 추정
- `tech_swot_analysis`: SWOT 분석

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

---

## MANIFEST v1.2 Spec

```typescript
interface ManifestV1_2 {
  manifest_version: '1.2';
  org_id: string;
  created_at: string;  // ISO8601
  period: { start: string; end: string; };
  counts: {
    events: number;
    actions: number;
    alarms: number;  // v1.2 필수
  };
  files: Array<{
    name: string;    // MANIFEST.json 제외!
    hash: string;    // sha256:...
    size: number;
  }>;
  package_hash: string;
  retention_hint: { years: number; note: string; };
}
```

---

## Security Notes

- **사용**: "변조 탐지 가능" (tamper-evident)
- **금지**: "위조 불가능" (tamper-proof)

---

## Quick Commands

```bash
# 개발 서버
pnpm dev

# 타입 체크
pnpm tsc --noEmit

# 린트
pnpm lint

# 빌드
pnpm build

# MCP 서버 빌드
cd mcp-servers/qetta-mcp && pnpm build
```

---

## Design Guidelines

### 벤치마크: Linear.app
- 미니멀리즘 + 기능성
- 다크모드 기본
- 키보드 우선 UX

### 컨셉: 엑셀시트 + 스마트공장 OS
- 엑셀시트: 취장님 친숙함 (UI 패턴)
- OS 컨셉: 설비가 '앱'처럼 보이는 대시보드

### 디자인 원칙
1. 품질 지표 우선 표시 (60%+ 화면 점유)
2. 설비 상태를 'OS 앱'처럼 시각화
3. AI 예측 결과 명확하게
4. Progressive Disclosure (불필요 기능 숨기기)

---

## Dashboard Navigation

### Core 5 (품질 AI)
- dashboard, equipment, sensors, alerts, reports

### Add-on 4 (대표님 전용, 접이식)
- bids, gov-support, finance, customers

### System
- settings

---

## Current Status

- **완성도**: 72% (MVP → Production 전환 단계)
- **빌드**: SUCCESS
- **Vercel**: 배포 완료

---

## Work Principles

1. **Sequential Thinking**: 모든 작업 시작 전 분석/계획 설계 필수
2. **Plan Mode**: 복잡한 구현 전 EnterPlanMode로 진입
3. **Ultra Thinking**: 다단계 검증, 교차검수, 백트래킹 허용
4. **품질 우선**: 품질 게이트 통과 전까지 커밋 금지

---

## API Keys (Production)

> 실제 키는 `.env.production.local`에 저장

- `ANTHROPIC_API_KEY`: Claude API
- `SOLAPI_API_KEY`: 알림톡
- `SUPABASE_URL`: Supabase
- `SUPABASE_ANON_KEY`: Supabase 익명 키

---

## Long-term Vision

1. **Phase 1**: OTT Chip으로 데이터 수집 (inevitable)
2. **Phase 2**: 클라우드에 위변조 불가능 데이터 보관
3. **Phase 3**: 이해관계인 셀프 증빙화 API 제공
4. **Phase 4**: 정부 통합 데이터레이크 연결

---

*Last Updated: 2026-01-18*
