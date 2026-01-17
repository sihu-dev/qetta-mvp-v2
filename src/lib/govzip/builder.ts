/**
 * Gov ZIP Builder
 * 정부 제출용 증빙 패키지 생성기
 *
 * 패키지 구조:
 * - MANIFEST.json (v1.2)
 * - events.csv
 * - actions.csv
 * - report.pdf
 * - photos/
 */

import AdmZip from 'adm-zip';
import { buildManifest, serializeManifest, type FileEntry } from './manifest';
import { buildEventsCSV } from './events-csv';
import { buildActionsCSV } from './actions-csv';
import type { ManifestV1_2 } from './schema';
import type { Event, Action } from '../agi/types';

export interface GovZipOptions {
  orgId: string;
  periodStart: string;
  periodEnd: string;
  events: Event[];
  actions: Action[];
  photos?: Map<string, Buffer>;
  reportPdf?: Buffer;
}

export interface GovZipResult {
  success: boolean;
  buffer?: Buffer;
  manifest?: ManifestV1_2;
  error?: string;
}

/**
 * Gov ZIP 패키지 생성
 */
export async function buildGovZip(options: GovZipOptions): Promise<GovZipResult> {
  try {
    const { orgId, periodStart, periodEnd, events, actions, photos, reportPdf } = options;

    // 1. CSV 생성
    const eventsCSV = buildEventsCSV(events);
    const actionsCSV = buildActionsCSV(actions);

    // 2. 파일 목록 구성
    const files: FileEntry[] = [
      { name: 'events.csv', content: Buffer.from(eventsCSV, 'utf-8') },
      { name: 'actions.csv', content: Buffer.from(actionsCSV, 'utf-8') },
    ];

    // 3. PDF 리포트 (선택)
    if (reportPdf) {
      files.push({ name: 'report.pdf', content: reportPdf });
    }

    // 4. 사진 추가
    if (photos) {
      for (const [filename, buffer] of photos) {
        files.push({
          name: `photos/${filename}`,
          content: buffer,
        });
      }
    }

    // 5. 알람 수 계산 (★ v1.2 필수)
    const alarmCount = events.filter((e) => e.alarm_active).length;

    // 6. MANIFEST 생성
    const manifest = buildManifest(
      orgId,
      periodStart,
      periodEnd,
      files,
      events.length,
      actions.length,
      alarmCount
    );

    // 7. MANIFEST를 파일에 추가
    const manifestJson = serializeManifest(manifest);
    files.push({
      name: 'MANIFEST.json',
      content: Buffer.from(manifestJson, 'utf-8'),
    });

    // 8. ZIP 생성
    const zip = new AdmZip();

    for (const file of files) {
      if (file.name.includes('/')) {
        // 디렉토리가 있는 경우 (photos/...)
        zip.addFile(file.name, file.content);
      } else {
        zip.addFile(file.name, file.content);
      }
    }

    return {
      success: true,
      buffer: zip.toBuffer(),
      manifest,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 날짜 기반 파일명 생성
 */
export function generateGovZipFilename(periodStart: string, periodEnd: string): string {
  const start = periodStart.slice(0, 10);
  const end = periodEnd.slice(0, 10);
  return `gov-export-${start}-${end}.zip`;
}
