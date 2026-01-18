---
name: review
description: 코드 리뷰 수행
---

# /review 명령어

## 사용법
```
/review              # 전체 변경사항 리뷰
/review [파일경로]   # 특정 파일 리뷰
/review --staged     # 스테이징된 변경사항만
```

## 동작
1. Reviewer Agent 활성화
2. 변경사항 분석
3. 품질/보안/성능 검사
4. 피드백 생성

## 검사 항목
- **타입 안전성**: any 사용, 타입 가드
- **보안**: SQL Injection, XSS, CSRF
- **성능**: useMemo, useCallback, N+1
- **코드 품질**: 중복, 복잡도, 명명
- **테스트**: 커버리지, Edge case

## 출력 형식
```markdown
## 리뷰 요약
- 심각도: Critical / High / Medium / Low
- 변경 파일: N개

## 상세 피드백

### 🔴 Critical
- src/file.ts:42 - 설명

### 🟠 High
- src/file.ts:100 - 설명

### 🟢 Suggestions
- src/file.ts:55 - 설명
```

## 예시
```
/review
/review src/lib/tender/
/review --staged
```

## 관련 명령어
```bash
pnpm lint
pnpm tsc --noEmit
pnpm test --coverage
```
