# /proposal - 제안서 자동 생성

입찰 분석 결과를 기반으로 맞춤형 제안서를 생성합니다.

## 사용법

```
/proposal [입찰ID] [형식]
```

## 형식 옵션

- `docx` (기본값): Word 문서 제안서
- `pptx`: PowerPoint 프레젠테이션
- `xlsx`: Excel 견적서
- `all`: 모든 형식 생성

## 예시

```
/proposal bid_abc123 docx
/proposal bid_abc123 all
```

## 수행 작업

### 1. 입찰 정보 분석
- 입찰 요구사항 파싱
- 자격 요건 확인
- 경쟁 수준 평가

### 2. 문서 생성 (Document Skills Engine)

#### DOCX 제안서
- 표지 (Qetta 브랜딩)
- 목차
- 회사 소개
- 기술 제안 (AGI Tech Combiner 활용)
- 수행 계획
- 인력 구성
- 가격 제안

#### XLSX 견적서
- 품목별 단가표
- 합계/VAT 자동 계산
- 조건 및 유효기간

#### PPTX 프레젠테이션
- 회사 소개 슬라이드
- 핵심 역량
- 제안 요약
- 차트/그래프

### 3. 파일 저장
- Supabase Storage 업로드
- generated_documents 테이블 기록

## 출력

- 생성된 문서 경로
- 미리보기 링크

## 관련 코드

- `src/lib/docs/docx-builder.ts`
- `src/lib/docs/xlsx-builder.ts`
- `src/lib/docs/pptx-builder.ts`

## Qetta 브랜딩

- 메인 컬러: #9333ea (Purple)
- 슬로건: "in·ev·it·able"
- 태그라인: "Data Flows. Evidence Follows."
