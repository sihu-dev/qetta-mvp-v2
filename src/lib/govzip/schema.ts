/**
 * Gov ZIP Schema - MANIFEST v1.2
 * 정부 제출용 증빙 패키지 스키마 정의
 *
 * "변조 탐지 가능" (tamper-evident) ✅
 * "위조 불가능" ❌ (사용 금지 표현)
 */

/**
 * MANIFEST v1.2 스키마
 *
 * v1.2 변경 사항:
 * - counts.alarms: 필수 (알람 건수 별도 집계)
 * - retention_hint.note: 문자열 형식으로 변경
 * - files[]: MANIFEST.json 제외 (self-hash 문제 방지)
 */
export interface ManifestV1_2 {
  manifest_version: '1.2';
  generator: string; // "Qetta v1.0.0"
  generated_at: string; // ISO 8601

  period: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };

  org_id: string;

  counts: {
    events: number;
    actions: number;
    alarms: number; // ★ v1.2 필수
  };

  files: Array<{
    name: string; // MANIFEST.json 제외!
    hash: string; // SHA-256 (lowercase hex)
    size: number; // bytes
  }>;

  package_hash: string; // 전체 패키지 해시

  retention_hint: {
    min_days: number;
    regulation: string;
    note: string; // ★ v1.2: 문자열 형식
  };
}

/**
 * Gov ZIP 파일 구조
 */
export interface GovZipStructure {
  manifest: ManifestV1_2;
  events_csv: string;
  actions_csv: string;
  report_pdf: Buffer;
  photos: Map<string, Buffer>;
}

/**
 * Evidence Snapshot 메타데이터
 */
export interface EvidenceSnapshot {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  gov_zip_hash: string;
  manifest_hash: string;
  package_hash: string;
  storage_path: string;
  created_at: string;
  created_by: string;
  retention_until: string;
}

/**
 * 검증 결과
 */
export interface VerificationResult {
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
