/**
 * Gov ZIP Verification
 * 증빙 패키지 무결성 검증
 */

import AdmZip from 'adm-zip';
import { calculateHash, parseManifest } from './manifest';
import type { ManifestV1_2, VerificationResult } from './schema';

/**
 * Gov ZIP 무결성 검증
 *
 * @param zipBuffer - ZIP 파일 버퍼
 * @param expectedPackageHash - 외부에서 저장된 패키지 해시 (선택)
 * @returns 검증 결과
 */
export async function verifyGovZip(
  zipBuffer: Buffer,
  expectedPackageHash?: string
): Promise<VerificationResult> {
  const errors: string[] = [];

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // 1. MANIFEST.json 확인
    const manifestEntry = entries.find((e) => e.entryName === 'MANIFEST.json');
    if (!manifestEntry) {
      return createFailedResult(['MANIFEST.json not found in ZIP']);
    }

    // 2. MANIFEST 파싱
    let manifest: ManifestV1_2;
    try {
      manifest = parseManifest(manifestEntry.getData().toString('utf-8'));
    } catch (e) {
      return createFailedResult([`Invalid MANIFEST.json: ${e}`]);
    }

    // 3. 버전 확인
    const manifestValid = manifest.manifest_version === '1.2';
    if (!manifestValid) {
      errors.push(`Invalid manifest version: ${manifest.manifest_version}`);
    }

    // 4. 파일별 해시 검증
    let filesValid = true;
    for (const fileInfo of manifest.files) {
      const entry = entries.find((e) => e.entryName === fileInfo.name);
      if (!entry) {
        errors.push(`File missing: ${fileInfo.name}`);
        filesValid = false;
        continue;
      }

      const actualHash = calculateHash(entry.getData());
      if (actualHash !== fileInfo.hash) {
        errors.push(
          `Hash mismatch for ${fileInfo.name}: expected ${fileInfo.hash.slice(0, 16)}..., got ${actualHash.slice(0, 16)}...`
        );
        filesValid = false;
      }
    }

    // 5. 패키지 해시 검증
    const allHashes = manifest.files
      .map((f) => f.hash)
      .sort()
      .join('');
    const calculatedPackageHash = calculateHash(Buffer.from(allHashes));
    const packageHashValid = calculatedPackageHash === manifest.package_hash;

    if (!packageHashValid) {
      errors.push(`Package hash mismatch`);
    }

    // 6. 외부 해시와 비교 (선택)
    if (expectedPackageHash && expectedPackageHash !== manifest.package_hash) {
      errors.push(`External package hash mismatch - possible tampering detected`);
    }

    return {
      valid: errors.length === 0,
      manifestValid,
      filesValid,
      packageHashValid,
      errors,
      details: {
        manifestVersion: manifest.manifest_version,
        eventCount: manifest.counts.events,
        actionCount: manifest.counts.actions,
        alarmCount: manifest.counts.alarms,
        fileCount: manifest.files.length,
      },
    };
  } catch (error) {
    return createFailedResult([
      `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    ]);
  }
}

function createFailedResult(errors: string[]): VerificationResult {
  return {
    valid: false,
    manifestValid: false,
    filesValid: false,
    packageHashValid: false,
    errors,
    details: {
      manifestVersion: '',
      eventCount: 0,
      actionCount: 0,
      alarmCount: 0,
      fileCount: 0,
    },
  };
}
