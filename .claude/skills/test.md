---
name: test
description: /test - 테스트 생성 명령어
triggers:
  - /test
  - test
  - 테스트
  - vitest
  - playwright
---

# 테스트 생성 Skill

## 목적
Vitest 유닛 테스트 및 Playwright E2E 테스트 작성

## 테스트 스택
```yaml
Unit Test: Vitest
E2E Test: Playwright
Coverage: V8
```

## 명령어
```bash
pnpm test              # Vitest 유닛 테스트
pnpm test:e2e          # Playwright E2E
pnpm test --coverage   # 커버리지 리포트
```

## 파일 구조
```
src/lib/
├── api/__tests__/
│   ├── parse-json.test.ts
│   ├── response.test.ts
│   └── validators.test.ts
├── tender/analyzers/__tests__/
│   └── fit-scorer.test.ts
└── docs/__tests__/

tests/e2e/
├── dashboard.spec.ts
├── evidence.spec.ts
├── tender.spec.ts
└── auth.spec.ts
```

## 테스트 작성 원칙
1. **AAA 패턴**: Arrange → Act → Assert
2. **독립성**: 테스트 간 의존성 없음
3. **명확한 이름**: `describe('함수명', () => it('조건_결과'))`
4. **Mocking**: 외부 의존성 모킹

## 작업 시 체크리스트
1. [ ] 테스트 파일 위치 확인 (`__tests__/` 또는 `.test.ts`)
2. [ ] describe/it 블록 구조화
3. [ ] Edge case 포함
4. [ ] Error case 포함
5. [ ] 커버리지 확인

## 예시
```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculateFitScore } from '../fit-scorer';

describe('calculateFitScore', () => {
  it('should return 0 for empty bid', () => {
    expect(calculateFitScore(null, {})).toBe(0);
  });
  
  it('should calculate score based on keywords', () => {
    const bid = { title: 'IT 솔루션', description: '소프트웨어' };
    const profile = { specializations: ['IT', '소프트웨어'] };
    expect(calculateFitScore(bid, profile)).toBeGreaterThan(50);
  });
});
```

## 현재 커버리지 목표
| 모듈 | 현재 | 목표 |
|------|------|------|
| src/lib/api/ | 60% | 90%+ |
| src/lib/tender/ | 30% | 80%+ |
| src/lib/docs/ | 0% | 50%+ |
| **전체** | ~3% | 30%+ |
