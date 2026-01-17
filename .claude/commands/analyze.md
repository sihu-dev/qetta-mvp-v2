# /analyze - AGI 데이터 분석

이벤트 데이터를 분석하여 인사이트를 도출합니다.

## 사용법

```
/analyze events [기간] [자산ID]
/analyze alarms [기간]
/analyze patterns [기간]
/analyze predict [자산ID]
```

## 명령어

### events - 이벤트 분석

```
/analyze events 2024-01 ASSET_001
/analyze events last-7-days
```

분석 내용:
- 이벤트 유형별 분포
- 시간대별 패턴
- 상태 변화 추이

### alarms - 알람 분석

```
/analyze alarms 2024-01
/analyze alarms last-month --severity high
```

분석 내용:
- 알람 빈도
- 알람 코드별 통계
- MTTR (Mean Time To Repair)

### patterns - 패턴 탐지

```
/analyze patterns 2024-Q1
```

분석 내용:
- 반복 패턴 탐지
- 이상 징후 감지
- 계절성/주기성 분석

### predict - 예측 분석

```
/analyze predict ASSET_001
```

분석 내용:
- 다음 알람 예측
- 유지보수 필요 시점
- 장애 위험도

## 3-Tier Intelligence 적용

### Tier 1: Rule-based (95%)
```typescript
// 규칙 기반 분석
if (alarmCount > threshold) {
  return { type: 'warning', message: '알람 빈도 증가' };
}
```

### Tier 2: ML-based (4%)
```typescript
// 벡터 유사도 검색
const similar = await searchMemories(embedding, 0.8, 10);
return inferFromSimilar(similar);
```

### Tier 3: Claude API (1%)
```typescript
// Ultra-Thinking 분석 (복잡한 케이스)
const insight = await ultraThinking.analyze(context);
return insight;
```

## 출력 형식

```markdown
## 📊 분석 결과

### 요약
- 총 이벤트: 1,234건
- 알람: 12건 (0.97%)
- 평균 가동률: 94.5%

### 주요 인사이트
1. **패턴 감지**: 월요일 오전 9-10시 알람 집중 발생
2. **이상 징후**: ASSET_003 idle 시간 증가 추세
3. **예측**: ASSET_001 주말 이전 점검 권장

### 권장 조치
- [ ] ASSET_003 센서 점검
- [ ] 월요일 오전 모니터링 강화

### 신뢰도
- Tier: Rule-based
- Confidence: 85%
```

## 인사이트 유형

```typescript
type InsightType =
  | 'reasoning'      // 추론 결과
  | 'prediction'     // 예측
  | 'anomaly'        // 이상 감지
  | 'recommendation' // 권장 사항
```

## 메모리 저장

분석 결과는 `memory_entries` 테이블에 저장되어 향후 유사 분석에 활용됩니다.

```typescript
await storeMemory({
  type: 'insight',
  content: insightText,
  embedding: await generateEmbedding(insightText),
  metadata: { analysisType, period, assetId }
});
```

## 관련 코드

- `src/lib/agi/reasoning/index.ts`
- `src/lib/agi/prediction/index.ts`
- `src/lib/agi/memory/index.ts`
- `src/lib/agi/orchestrator/index.ts`
