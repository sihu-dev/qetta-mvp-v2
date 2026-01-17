# Qetta Tech Combiner Skill

기술 스택 추천 및 조합 관련 작업 시 자동 활성화됩니다.

## 활성화 키워드

- techstack, 기술스택
- tech combiner, 기술조합
- recommendation, 추천
- architecture, 아키텍처

## 3-Tier Intelligence

### Tier 1: Rule-based (95%)
- 키워드 매칭 기반 추천
- 응답 시간: <100ms
- 비용: ₩0

```typescript
// 키워드-기술 매핑
const KEYWORD_MAPPINGS = {
  실시간: ['Supabase PostgreSQL', 'Redis'],
  센서: ['Supabase Edge Functions', 'pgvector'],
  문서: ['Next.js 15', 'Claude API'],
  // ...
};
```

### Tier 2: ML-based (4%)
- 벡터 유사도 검색
- 응답 시간: <500ms
- 비용: ₩500K/년

### Tier 3: Claude API (1%)
- Ultra-Thinking 분석
- 응답 시간: <10s
- 비용 제한: ₩6M/년

## 기술 카탈로그

### Frontend
- Next.js 15 (★★★★★)
- React 19 (★★★★★)
- Vue 3 (★★★★☆)

### Backend
- Supabase Edge Functions (★★★★★)
- Node.js (★★★★☆)

### Database
- Supabase PostgreSQL + pgvector (★★★★★)
- Redis (★★★★☆)

### AI/ML
- Claude API (★★★★★)
- pgvector (★★★★★)

## 관련 코드

- `src/lib/agi/ultra-thinking/index.ts`
- `mcp-servers/qetta-mcp/src/tools/techstack.ts`

## MCP 도구

- `tech_recommend_stack`
- `tech_validate_stack`
- `tech_estimate_cost`
- `tech_swot_analysis`
