# Qetta Documents Skill

문서 생성 관련 작업 시 자동 활성화됩니다.

## 활성화 키워드

- proposal, 제안서
- quotation, 견적서
- presentation, 프레젠테이션
- document, 문서
- docx, xlsx, pptx

## 문서 유형

### 제안서 (DOCX)
- 표지 (Qetta 브랜딩)
- 목차
- 회사 소개
- 기술 제안
- 수행 계획
- 가격 제안

### 견적서 (XLSX)
- 회사 정보
- 품목 테이블
- VAT 자동 계산
- 합계

### 프레젠테이션 (PPTX)
- 타이틀 슬라이드
- 목차
- 내용 슬라이드
- 차트/그래프
- 마무리 슬라이드

## Qetta 브랜딩

```typescript
const BRAND = {
  name: 'Qetta',
  slogan: 'in·ev·it·able',
  tagline: 'Data Flows. Evidence Follows.',
  colors: {
    primary: '#9333ea',
    secondary: '#a855f7',
    background: '#faf5ff',
  },
};
```

## 관련 코드

- `src/lib/docs/index.ts`
- `src/lib/docs/docx-builder.ts`
- `src/lib/docs/xlsx-builder.ts`
- `src/lib/docs/pptx-builder.ts`

## 패키지

- docx: ^8.5.0
- exceljs: ^4.4.0
- pptxgenjs: ^3.12.0

## MCP 도구

- `document_generate_proposal`
- `document_generate_quotation`
- `document_generate_presentation`
- `document_list_generated`
