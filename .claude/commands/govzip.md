# /govzip - Gov ZIP 검증 및 관리

Gov ZIP 패키지의 무결성을 검증하고 관리합니다.

## 사용법

```
/govzip verify [파일경로]
/govzip list [조직ID]
/govzip download [스냅샷ID]
/govzip status [스냅샷ID]
```

## 명령어

### verify - 무결성 검증

```
/govzip verify ./evidence/QETTA_ORG001_202401_001.zip
```

검증 항목:
1. MANIFEST.json 존재 확인
2. MANIFEST v1.2 버전 확인
3. 파일별 SHA-256 해시 검증
4. package_hash 검증
5. 외부 저장된 해시와 비교 (선택)

### list - 스냅샷 목록

```
/govzip list org_123
/govzip list org_123 --period 2024-01
```

출력:
- 스냅샷 ID
- 생성일
- 기간 (period_start ~ period_end)
- 이벤트/조치/알람 수
- 검증 상태

### download - 다운로드

```
/govzip download snap_abc123
```

Supabase Storage에서 Gov ZIP 파일 다운로드.

### status - 상세 상태

```
/govzip status snap_abc123
```

출력:
- 메타데이터 전체
- 파일 목록
- 해시 정보
- 보존 기한

## MANIFEST v1.2 스펙

```json
{
  "manifest_version": "1.2",
  "org_id": "uuid",
  "created_at": "ISO8601",
  "period": {
    "start": "ISO8601",
    "end": "ISO8601"
  },
  "counts": {
    "events": 1234,
    "actions": 56,
    "alarms": 12  // ★ v1.2 필수
  },
  "files": [
    {
      "name": "events.csv",
      "hash": "sha256:...",
      "size": 12345
    }
    // MANIFEST.json은 files[]에 포함하지 않음!
  ],
  "package_hash": "sha256:...",
  "retention_hint": {
    "years": 5,
    "note": "정부 제출용 증빙 자료"  // ★ v1.2: string 형식
  }
}
```

## 보안 용어

✅ 사용: "변조 탐지 가능" (tamper-evident)
❌ 금지: "위조 불가능" (tamper-proof)

## 검증 결과 형식

```typescript
interface VerificationResult {
  valid: boolean;
  manifestValid: boolean;
  filesValid: boolean;
  packageHashValid: boolean;
  errors: string[];
  details: {
    manifestVersion: string;
    eventCount: number;
    actionCount: number;
    alarmCount: number;
    fileCount: number;
  };
}
```

## 관련 코드

- `src/lib/govzip/verify.ts`
- `src/lib/govzip/schema.ts`
- `src/lib/govzip/manifest.ts`
