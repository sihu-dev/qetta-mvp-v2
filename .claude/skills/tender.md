---
name: tender
description: 입찰 수집, 분석, 문서 생성 작업
triggers:
  - tender
  - 입찰
  - bid
  - g2b
  - ungm
  - sam
---

# Qetta 입찰 (Tender) Skill

## 목적
국내외 입찰 공고 수집, FitScore 분석, 입찰 문서 자동 생성

## 핵심 원칙
- **API 수집 원칙**: "API로 수집, 문서는 파싱하지 않는다"
- **3단계 AI (필연 엔진)**: 규칙 95% → 예측 4% → Claude 1%
- **FitScore**: 적합도 점수 (0-100)

## 수집 소스
| 소스 | API | 상태 |
|------|-----|------|
| 나라장터 (G2B) | 조달청 공공데이터 | ✅ |
| UNGM | 공개 REST API | ✅ |
| SAM.gov | api.sam.gov | ✅ |
| 카자흐스탄 | goszakup.gov.kz | ✅ |

## 주요 파일
- `src/lib/tender/collectors/` - 수집기
  - `g2b.ts` - 나라장터
  - `ungm.ts` - UN 조달
  - `sam.ts` - 미국 연방
  - `kz.ts` - 카자흐스탄
- `src/lib/tender/analyzers/` - 분석기
  - `fit-scorer.ts` - FitScore 계산
  - `bid-analyzer.ts` - 입찰 분석
  - `competitor-analyzer.ts` - 경쟁사 분석
- `src/lib/docs/` - 문서 생성기

## 출력 문서
- 제안서: DOCX (docx npm)
- 견적서: XLSX (exceljs)
- 발표자료: PPTX (pptxgenjs)

## 작업 시 체크리스트
1. [ ] 수집 소스 API 키 확인
2. [ ] FitScore 임계값 설정 (기본 60점)
3. [ ] 회사 프로필 매칭
4. [ ] 마감일 검증
5. [ ] 경쟁 수준 분석

## API 엔드포인트
- `POST /api/tender/collect` - 입찰 수집
- `POST /api/tender/analyze` - 입찰 분석
- `POST /api/tender/generate` - 문서 생성

## 관련 테이블
- `bids` - 입찰 공고
- `bid_analyses` - 분석 결과
- `generated_documents` - 생성 문서
