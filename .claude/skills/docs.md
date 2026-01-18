---
name: docs
description: /docs - 문서 자동 생성 명령어
triggers:
  - /docs
  - docs
  - 문서
  - docx
  - xlsx
  - pptx
---

# 문서 생성 Skill

## 목적
입찰 문서 (제안서, 견적서, 발표자료) 자동 생성

## 문서 스택
```yaml
DOCX: docx npm (제안서)
XLSX: exceljs (견적서)
PPTX: pptxgenjs (발표자료)
PDF: 브라우저 내보내기
```

## 주요 파일
```
src/lib/docs/
├── docx-builder.ts      # 제안서 빌더
├── xlsx-builder.ts      # 견적서 빌더
├── pptx-builder.ts      # 발표자료 빌더
└── bid-document-generator.ts  # 통합 생성기
```

## 문서 템플릿 구조

### 제안서 (DOCX)
1. 표지
2. 목차
3. 회사 소개
4. 기술 제안
5. 가격 제안
6. 프로젝트 일정
7. 품질 보증
8. 결론

### 견적서 (XLSX)
| 항목 | 단가 | 수량 | 금액 |
|------|------|------|------|
| ... | ... | ... | ... |
| **합계** | | | **₩000** |

### 발표자료 (PPTX)
1. 타이틀 슬라이드
2. 회사 소개
3. 솔루션 개요
4. 기술 상세
5. 실적/레퍼런스
6. Q&A

## 작업 시 체크리스트
1. [ ] 입찰 정보 확인 (bids 테이블)
2. [ ] 회사 프로필 확인
3. [ ] 템플릿 선택
4. [ ] 섹션별 콘텐츠 생성
5. [ ] 파일 저장 경로 확인

## API 엔드포인트
- `POST /api/tender/generate` - 문서 생성
  - `doc_type`: proposal | quotation | presentation
  - `format`: docx | xlsx | pptx

## 3단계 AI 활용
- **Layer 1 (95%)**: 템플릿 기반 자동 채우기
- **Layer 2 (4%)**: 키워드 기반 섹션 추천
- **Layer 3 (1%)**: Claude로 창의적 콘텐츠 생성
