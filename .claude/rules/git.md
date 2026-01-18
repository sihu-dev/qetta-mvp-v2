---
name: git
description: Git 사용 규칙
priority: high
---

# Git 규칙

## 브랜치 전략

### 브랜치 명명
```
main           # 프로덕션
feature/*      # 새 기능 (feature/add-tender-filter)
fix/*          # 버그 수정 (fix/score-calculation)
chore/*        # 설정/빌드 (chore/update-deps)
docs/*         # 문서 (docs/api-guide)
```

### 브랜치 규칙
- `main` 브랜치는 항상 배포 가능 상태
- PR 없이 main 직접 푸시 금지
- feature 브랜치는 main에서 분기

## Conventional Commits

### 형식
```
<type>(<scope>): <description>

[body]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Type
| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새 기능 | feat(tender): add UNGM collector |
| `fix` | 버그 수정 | fix(evidence): correct hash calculation |
| `docs` | 문서 | docs: update API guide |
| `style` | 포맷팅 | style: format imports |
| `refactor` | 리팩토링 | refactor(agi): simplify memory search |
| `test` | 테스트 | test(fit-scorer): add edge cases |
| `chore` | 빌드/설정 | chore: update dependencies |

### Scope (QETTA)
```
evidence    # 증빙 모듈
tender      # 입찰 모듈
agi         # 필연 엔진
api         # API 라우트
ui          # UI 컴포넌트
db          # 데이터베이스
config      # 설정
```

## 금지 명령어

### NEVER
```bash
❌ git push --force
❌ git push --force-with-lease
❌ git reset --hard (원격 영향)
❌ git rebase -i (공유 브랜치)
❌ git commit --amend (푸시 후)
```

### 예외
- 본인 브랜치에서 force push 필요시 팀 확인

## 커밋 전 체크리스트

```bash
# 1. 빌드 확인
pnpm build

# 2. 테스트 통과
pnpm test

# 3. 린트 확인
pnpm lint

# 4. 타입 확인
pnpm tsc --noEmit

# 5. .env 미포함 확인
git diff --cached --name-only | grep -v ".env"
```

## PR 규칙

### 제목
```
[Type] 간단한 설명

예:
[feat] 입찰 알림 시스템 추가
[fix] FitScore 계산 오류 수정
```

### 본문
```markdown
## Summary
- 변경 내용 요약 (1-3줄)

## Changes
- [ ] 변경사항 1
- [ ] 변경사항 2

## Test
- [ ] 테스트 방법
```

## .gitignore 필수 항목
```
.env*
node_modules/
.next/
*.log
.DS_Store
```
