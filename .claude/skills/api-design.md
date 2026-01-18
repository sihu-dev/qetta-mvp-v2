---
name: api-design
description: REST API 또는 GraphQL API 설계 및 구현 작업 시 자동 활성화. OpenAPI 스펙 준수
triggers:
  - api
  - endpoint
  - route
  - REST
  - GraphQL
---

# API 설계 Skill

## 목적
Qetta API 엔드포인트 설계 및 구현

## 핵심 원칙
- **Next.js App Router** API Routes 사용
- **TypeScript strict mode** 필수
- **Zod** 스키마 검증
- **표준 응답 형식** 준수

## 표준 응답 형식
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    executionTime: number;
  };
}
```

## 파일 구조
```
src/app/api/
├── evidence/        # 증빙 API
│   ├── route.ts
│   └── verify/route.ts
├── tender/          # 입찰 API
│   ├── collect/route.ts
│   ├── analyze/route.ts
│   └── generate/route.ts
├── agi/             # 필연 엔진 API
│   ├── memory/route.ts
│   ├── orchestrate/route.ts
│   ├── prediction/route.ts
│   └── reasoning/route.ts
└── health/route.ts  # 헬스체크
```

## 작업 시 체크리스트
1. [ ] Zod 스키마 정의
2. [ ] 에러 핸들링 (try-catch)
3. [ ] 입력 검증 (validateInput)
4. [ ] RLS 정책 확인
5. [ ] 응답 형식 통일

## 보안
- **CSRF 토큰** 검증
- **Rate Limiting** 적용
- **입력 Sanitization**
- **SQL Injection 방지** (파라미터화 쿼리)

## 참조
- `src/lib/api/validators.ts` - 검증 유틸
- `src/lib/api/types.ts` - 타입 정의
- `src/lib/api-security.ts` - 보안 미들웨어
