---
name: commit
description: Conventional Commits 형식으로 커밋 생성
---

# /commit 명령어

## 사용법
```
/commit              # 변경사항 분석 후 커밋
/commit -m "메시지"  # 직접 메시지 지정
```

## 동작
1. `git status` - 변경사항 확인
2. `git diff` - 상세 변경 분석
3. 커밋 메시지 생성 (Conventional Commits)
4. `git commit` 실행

## Conventional Commits 형식
```
<type>(<scope>): <description>

[optional body]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Type 종류
| Type | 설명 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 포맷팅 |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드/설정 변경 |

## Scope (QETTA)
| Scope | 설명 |
|-------|------|
| `evidence` | 증빙 관련 |
| `tender` | 입찰 관련 |
| `agi` | 필연 엔진 |
| `api` | API 엔드포인트 |
| `ui` | UI 컴포넌트 |
| `db` | 데이터베이스 |

## 예시
```
feat(tender): add UNGM collector

- Implement UNGM API integration
- Add bid parsing logic
- Add tests for collector

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## 주의사항
- .env 파일 커밋 금지
- 테스트 실패 시 커밋 금지
- --force 사용 금지
