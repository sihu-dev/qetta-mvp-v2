/**
 * Qetta GovZIP Module
 * 정부 제출용 증빙 패키지 생성 및 검증
 *
 * "변조 탐지 가능" (tamper-evident) ✅
 *
 * 주요 기능:
 * - MANIFEST v1.2 생성
 * - Events/Actions CSV 생성
 * - Gov ZIP 패키지 생성
 * - 무결성 검증
 */

// Schema
export type { ManifestV1_2, GovZipStructure, EvidenceSnapshot, VerificationResult } from './schema';

// Manifest
export { buildManifest, calculateHash, serializeManifest, parseManifest, verifyPackageHash } from './manifest';

// CSV Builders
export { buildEventsCSV } from './events-csv';
export { buildActionsCSV } from './actions-csv';

// ZIP Builder
export { buildGovZip, generateGovZipFilename, type GovZipOptions, type GovZipResult } from './builder';

// Verification
export { verifyGovZip } from './verify';
