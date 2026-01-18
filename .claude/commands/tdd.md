---
name: tdd
description: TDD 방식으로 기능 구현
---

# /tdd 명령어

## 사용법
```
/tdd [기능명]
```

## 동작 (Red-Green-Refactor)

### 1. Red (테스트 작성)
- 실패하는 테스트 먼저 작성
- Edge case 포함
- Error case 포함

### 2. Green (구현)
- 테스트 통과하는 최소 코드
- 하드코딩 허용

### 3. Refactor (개선)
- 중복 제거
- 타입 개선
- 성능 최적화

## 출력
```bash
# 1. 테스트 작성
pnpm test [파일명] --watch

# 2. 구현
# ... 코드 작성 ...

# 3. 검증
pnpm test --coverage
```

## 예시
```
/tdd FitScore 계산 함수
/tdd MANIFEST 해시 검증
/tdd 입찰 필터링 로직
```

## 테스트 템플릿
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('[모듈명]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('[함수명]', () => {
    it('should [예상 동작] when [조건]', () => {
      // Arrange
      const input = ...;
      
      // Act
      const result = fn(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```
