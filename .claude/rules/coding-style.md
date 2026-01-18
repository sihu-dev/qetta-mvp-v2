---
name: coding-style
description: 코딩 스타일 규칙
priority: high
---

# 코딩 스타일 규칙

## TypeScript

### 필수
```typescript
✅ strict mode 사용
✅ 명시적 타입 선언 (매개변수, 반환값)
✅ interface > type (확장 필요시)
✅ const > let (가능한 경우)
✅ async/await > .then()
```

### 금지
```typescript
❌ any 타입
❌ @ts-ignore
❌ non-null assertion (!) 남용
❌ == (=== 사용)
```

### 타입 정의
```typescript
// ✅ 구체적 타입
interface BidRawData {
  source: 'g2b' | 'ungm' | 'sam' | 'kz';
  externalId: string;
  fetchedAt: Date;
}

// ❌ 느슨한 타입
type BidRawData = Record<string, unknown>;
```

## React

### 컴포넌트
```typescript
// ✅ 함수형 컴포넌트 + TypeScript
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  return <div>{title}</div>;
}

// ❌ 클래스 컴포넌트
class MyComponent extends React.Component { ... }
```

### 훅 사용
```typescript
// ✅ 의존성 배열 명시
useEffect(() => {
  fetchData();
}, [userId]);

// ✅ 불필요한 리렌더링 방지
const memoizedValue = useMemo(() => compute(data), [data]);
const memoizedFn = useCallback(() => handle(id), [id]);
```

## 파일 구조

### 명명 규칙
```
components/       # PascalCase: MyComponent.tsx
lib/             # kebab-case: my-module.ts
hooks/           # camelCase: useMyHook.ts
types/           # PascalCase: MyTypes.ts
__tests__/       # 원본명.test.ts
```

### 폴더 구조
```
src/
├── app/              # Next.js App Router
├── components/       # UI 컴포넌트
├── lib/             # 비즈니스 로직
│   ├── tender/      # 입찰 모듈
│   ├── govzip/      # 증빙 모듈
│   └── agi/         # 필연 엔진
└── types/           # 공통 타입
```

## Import 순서
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. 외부 라이브러리
import { z } from 'zod';
import { format } from 'date-fns';

// 3. 내부 모듈
import { calculateFitScore } from '@/lib/tender';
import { Button } from '@/components/ui';

// 4. 타입
import type { Bid, Analysis } from '@/types';

// 5. 스타일/상수
import styles from './styles.module.css';
```

## 주석
```typescript
// ✅ 복잡한 로직 설명
// Layer 1: 규칙 기반 처리 (95%)
// Layer 2: 확률 예측 (4%)
// Layer 3: Claude API (1%)

// ❌ 자명한 코드 주석
// 변수 선언
const x = 1;
```
