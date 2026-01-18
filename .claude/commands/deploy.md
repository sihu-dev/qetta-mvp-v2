---
name: deploy
description: Vercel 배포 실행
---

# /deploy 명령어

## 사용법
```
/deploy              # 프로덕션 배포
/deploy --preview    # 프리뷰 배포
```

## 동작

### 1. Pre-deploy 검증
```bash
pnpm tsc --noEmit    # TypeScript 에러 0
pnpm lint            # ESLint 에러 0
pnpm test            # 테스트 통과
pnpm build           # 빌드 성공
```

### 2. 배포 실행
```bash
git push origin main  # GitHub 푸시
vercel --prod         # Vercel 배포
```

### 3. Post-deploy 확인
- 프로덕션 URL 접속 테스트
- 헬스체크 API 확인
- 주요 기능 스모크 테스트

## Quality Gate
| 검사 | 조건 |
|------|------|
| TypeScript | 에러 0 |
| ESLint | 에러 0 |
| Build | 성공 |
| Test | 100% 통과 |

## 환경
| 환경 | URL |
|------|-----|
| Production | https://qetta-mvp-v2.vercel.app |
| Preview | https://qetta-mvp-v2-*.vercel.app |

## 배포 체크리스트
- [ ] 로컬 빌드 성공
- [ ] 모든 테스트 통과
- [ ] TypeScript 에러 없음
- [ ] ESLint 에러 없음
- [ ] .env 커밋 안됨
- [ ] main 브랜치에 머지됨

## 롤백
```bash
vercel rollback [deployment-url]
```

## 관련 링크
- Vercel Dashboard: https://vercel.com/sihu-devs-projects/qetta-mvp-v2
- GitHub: https://github.com/sihu-dev/qetta-mvp-v2
