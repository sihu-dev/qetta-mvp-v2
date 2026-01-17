/**
 * MANIFEST v1.2 Builder
 * Gov ZIP 패키지 메타데이터 생성
 *
 * 핵심 규칙:
 * 1. counts.alarms: 필수 (v1.2)
 * 2. files[]: MANIFEST.json 제외 (v1.2)
 * 3. retention_hint.note: 문자열 형식 (v1.2)
 */

import crypto from 'crypto';
import type { ManifestV1_2 } from './schema';

const QETTA_VERSION = '1.0.0';
const DEFAULT_RETENTION_DAYS = 365 * 5; // 5년
const DEFAULT_REGULATION = '스마트공장 보급사업 관리지침';
const DEFAULT_NOTE = '정부사업 증빙 자료 - 5년 보관 권장';

export interface FileEntry {
  name: string;
  content: Buffer;
}

/**
 * SHA-256 해시 계산
 */
export function calculateHash(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * MANIFEST v1.2 생성
 *
 * @param orgId - 조직 ID
 * @param periodStart - 기간 시작 (ISO 8601)
 * @param periodEnd - 기간 종료 (ISO 8601)
 * @param files - 파일 목록 (MANIFEST.json 자동 제외)
 * @param eventCount - 이벤트 수
 * @param actionCount - 조치 수
 * @param alarmCount - 알람 수 (★ v1.2 필수)
 * @returns MANIFEST v1.2 객체
 */
export function buildManifest(
  orgId: string,
  periodStart: string,
  periodEnd: string,
  files: FileEntry[],
  eventCount: number,
  actionCount: number,
  alarmCount: number
): ManifestV1_2 {
  // 파일별 해시 계산 (★ MANIFEST.json 제외!)
  const fileEntries = files
    .filter((f) => f.name !== 'MANIFEST.json')
    .map((f) => ({
      name: f.name,
      hash: calculateHash(f.content),
      size: f.content.length,
    }));

  // 패키지 전체 해시 (모든 파일 해시를 연결)
  const allHashes = fileEntries
    .map((f) => f.hash)
    .sort()
    .join('');
  const packageHash = calculateHash(Buffer.from(allHashes));

  return {
    manifest_version: '1.2',
    generator: `Qetta v${QETTA_VERSION}`,
    generated_at: new Date().toISOString(),
    period: {
      start: periodStart,
      end: periodEnd,
    },
    org_id: orgId,
    counts: {
      events: eventCount,
      actions: actionCount,
      alarms: alarmCount, // ★ v1.2 필수
    },
    files: fileEntries,
    package_hash: packageHash,
    retention_hint: {
      min_days: DEFAULT_RETENTION_DAYS,
      regulation: DEFAULT_REGULATION,
      note: DEFAULT_NOTE, // ★ v1.2: 문자열
    },
  };
}

/**
 * MANIFEST JSON 문자열 생성
 */
export function serializeManifest(manifest: ManifestV1_2): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * MANIFEST 파싱
 */
export function parseManifest(json: string): ManifestV1_2 {
  const manifest = JSON.parse(json) as ManifestV1_2;

  // v1.2 필수 필드 검증
  if (manifest.manifest_version !== '1.2') {
    throw new Error(`Invalid manifest version: ${manifest.manifest_version}`);
  }

  if (typeof manifest.counts.alarms !== 'number') {
    throw new Error('Missing required field: counts.alarms');
  }

  if (typeof manifest.retention_hint.note !== 'string') {
    throw new Error('retention_hint.note must be a string');
  }

  return manifest;
}

/**
 * 패키지 해시 검증
 */
export function verifyPackageHash(manifest: ManifestV1_2): boolean {
  const allHashes = manifest.files
    .map((f) => f.hash)
    .sort()
    .join('');
  const calculatedHash = calculateHash(Buffer.from(allHashes));

  return calculatedHash === manifest.package_hash;
}
