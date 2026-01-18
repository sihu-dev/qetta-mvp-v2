---
name: plan
description: 기능 구현 계획 수립
---

# /plan 명령어

## 사용법
```
/plan [기능명]
```

## 동작
1. Planner Agent 활성화
2. 기존 코드베이스 탐색
3. 상세 구현 계획 수립
4. 작업 목록 생성

## 출력
- 아키텍처 다이어그램
- 파일 변경 목록
- 단계별 작업 계획
- 위험 요소 분석

## 예시
```
/plan 다크모드 토글 기능
/plan 입찰 알림 시스템
/plan Gov ZIP 검증 API
```

## 관련 파일
- `.claude/agents/planner.md`
