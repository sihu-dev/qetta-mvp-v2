# Qetta Evidence Skill

증빙 패키지 관련 작업 시 자동 활성화됩니다.

## 활성화 키워드

- evidence, 증빙
- govzip, gov zip
- manifest, 매니페스트
- snapshot, 스냅샷

## 컨텍스트

### MANIFEST v1.2 필수 요소

```json
{
  "manifest_version": "1.2",
  "counts": {
    "events": number,
    "actions": number,
    "alarms": number  // ★ v1.2 필수
  },
  "files": [...],  // MANIFEST.json 제외!
  "package_hash": "sha256:..."
}
```

### 파일 구조

- `MANIFEST.json`: 메타데이터
- `events.csv`: 이벤트 데이터
- `actions.csv`: 조치 데이터
- `photos/`: 첨부 사진

### 해시 알고리즘

- 개별 파일: SHA-256
- 패키지: 모든 파일 해시의 정렬된 결합 후 SHA-256

### 보안 용어

- ✅ "변조 탐지 가능" (tamper-evident)
- ❌ "위조 불가능" (tamper-proof)

## 관련 코드

- `src/lib/govzip/schema.ts`
- `src/lib/govzip/manifest.ts`
- `src/lib/govzip/builder.ts`
- `src/lib/govzip/verify.ts`

## MCP 도구

- `evidence_create_snapshot`
- `evidence_verify_package`
- `evidence_list_snapshots`
- `evidence_get_snapshot_details`
