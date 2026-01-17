# /evidence - 증빙 패키지 생성

증빙 데이터를 수집하고 Gov ZIP 패키지를 생성합니다.

## 사용법

```
/evidence [기간] [조직ID]
```

## 예시

```
/evidence 2024-01 org_123
/evidence last-month
/evidence today
```

## 수행 작업

1. **데이터 수집**
   - Events 테이블에서 기간 내 데이터 조회
   - Actions 테이블에서 관련 조치 데이터 조회
   - 알람 이벤트 집계

2. **CSV 생성**
   - events.csv: 이벤트 타임시리즈
   - actions.csv: 조치 기록

3. **MANIFEST v1.2 생성**
   ```json
   {
     "manifest_version": "1.2",
     "counts": {
       "events": number,
       "actions": number,
       "alarms": number  // ★ v1.2 필수
     },
     "files": [...],
     "package_hash": "sha256:...",
     "retention_hint": {
       "note": "string"
     }
   }
   ```

4. **Gov ZIP 패키징**
   - 파일별 SHA-256 해시
   - 패키지 해시 계산
   - Supabase Storage 업로드

5. **DB 기록**
   - evidence_snapshots 테이블에 스냅샷 메타데이터 저장

## 출력

- Gov ZIP 파일 경로
- 검증 결과
- 스냅샷 ID

## 관련 코드

- `src/lib/govzip/builder.ts`
- `src/lib/govzip/manifest.ts`
- `src/lib/govzip/verify.ts`
