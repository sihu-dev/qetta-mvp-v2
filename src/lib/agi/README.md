# AGI Modules

## 구현 완료
- `types/` - AGI 타입 정의
- `ultra-thinking/` - Claude Ultra Thinking (Tech Combiner)

## 구현 예정
아래 디렉토리는 향후 구현 예정입니다:

| 디렉토리 | 용도 | 관련 API |
|----------|------|----------|
| `memory/` | Vector memory (pgvector) | `/api/agi/memory` |
| `orchestrator/` | Multi-agent orchestration | `/api/agi/orchestrate` |
| `prediction/` | 예측 엔진 (품질/유지보수/이상) | `/api/agi/prediction` |
| `reasoning/` | 추론 엔진 (3-Tier Intelligence) | `/api/agi/reasoning` |
| `streaming/` | SSE 스트리밍 응답 | - |
| `utils/` | 공용 유틸리티 | - |

## 관련 GitHub Issues
- #6: Vector Embedding 생성 기능 구현
- #7: pgvector 유사도 검색 구현
