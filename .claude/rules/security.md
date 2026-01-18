---
name: security
description: 보안 규칙 (필수 준수)
priority: critical
---

# 보안 규칙

## NEVER (절대 금지)

### 파일 접근
```
❌ .env 파일 읽기/수정/커밋
❌ credentials, secrets 파일 접근
❌ /etc/passwd, /etc/shadow 접근
❌ ~/.ssh/ 접근
```

### 위험한 명령어
```bash
❌ rm -rf /
❌ rm -rf ~/*
❌ sudo *
❌ *--force* (push --force 등)
❌ chmod 777
❌ eval()
```

### 코드 패턴
```typescript
❌ eval(userInput)
❌ element.innerHTML = userInput
❌ new Function(userInput)
❌ document.write(userInput)
❌ exec(userInput)
```

### SQL
```typescript
❌ query(`SELECT * FROM users WHERE id = ${userId}`)
❌ 문자열 결합으로 쿼리 생성
```

## ALWAYS (필수 준수)

### 입력 검증
```typescript
✅ Zod 스키마 검증
✅ 타입 체크
✅ 길이 제한
✅ 특수문자 필터링
```

### 데이터베이스
```typescript
✅ 파라미터화된 쿼리
✅ Supabase RLS 활성화
✅ 최소 권한 원칙
```

### 인증/인가
```typescript
✅ Supabase Auth 사용
✅ 세션 검증
✅ CSRF 토큰 확인
```

### API
```typescript
✅ Rate Limiting
✅ 에러 메시지 최소화
✅ HTTPS only
```

## 검증 명령어
```bash
pnpm lint              # ESLint 보안 규칙
pnpm audit             # npm 취약점
pnpm tsc --noEmit      # 타입 검사
```
