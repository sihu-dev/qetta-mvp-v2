# /techstack - AGI 기술조합 추천

비즈니스 요구사항을 분석하여 최적의 기술 스택을 추천합니다.

## 사용법

```
/techstack [요구사항 설명]
```

## 예시

```
/techstack "실시간 센서 데이터 수집 및 알람 시스템"
/techstack "대용량 문서 검색 및 분석 플랫폼"
/techstack "정부 제출용 증빙 자동화 시스템"
```

## 3-Tier Intelligence

### Tier 1: Rule-based (95%)
- 사전 정의된 패턴 매칭
- 비용: ₩0
- 응답 시간: <100ms

### Tier 2: ML-based (4%)
- 벡터 유사도 검색 (pgvector)
- 비용: 연간 ₩500K
- 응답 시간: <500ms

### Tier 3: Claude API (1%)
- Ultra-Thinking 분석
- 비용 제한: 연간 ₩6M
- 응답 시간: <10s

## 수행 작업

1. **요구사항 분석**
   - 키워드 추출
   - 도메인 분류
   - 규모 판단

2. **기술 추천**
   ```typescript
   interface TechRecommendation {
     frontend: TechChoice[];
     backend: TechChoice[];
     database: TechChoice[];
     infrastructure: TechChoice[];
     aiMl: TechChoice[];
   }
   ```

3. **호환성 검증**
   - 라이브러리 충돌 체크
   - 버전 호환성 확인
   - 라이선스 검토

4. **SWOT 분석**
   - 강점 (Strengths)
   - 약점 (Weaknesses)
   - 기회 (Opportunities)
   - 위협 (Threats)

5. **비용 추정**
   - 초기 개발 비용
   - 월간 운영 비용
   - 확장 비용

6. **로드맵 생성**
   - Phase 1: MVP (1-2개월)
   - Phase 2: 기능 확장 (2-3개월)
   - Phase 3: 최적화 (1개월)

## 출력 형식

```markdown
## 🎯 기술 스택 추천

### Frontend
- Next.js 15 (★★★★★) - App Router, RSC 지원

### Backend
- Supabase Edge Functions (★★★★☆) - Serverless

### Database
- PostgreSQL + pgvector (★★★★★) - 벡터 검색

### SWOT 분석
[분석 내용]

### 예상 비용
- 초기: ₩15,000,000
- 월간: ₩500,000
```

## 관련 코드

- `src/lib/agi/ultra-thinking/index.ts`
- `src/lib/agi/reasoning/index.ts`
