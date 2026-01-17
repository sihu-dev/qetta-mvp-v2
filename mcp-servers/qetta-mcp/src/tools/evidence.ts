/**
 * Evidence Tools
 * Gov ZIP 증빙 패키지 관련 도구
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import AdmZip from 'adm-zip';
import * as crypto from 'crypto';

export const evidenceTools: Tool[] = [
  {
    name: 'evidence_create_snapshot',
    description: '증빙 스냅샷 생성 - 지정된 기간의 이벤트/조치 데이터를 수집하여 Gov ZIP 패키지 생성',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        period_start: {
          type: 'string',
          description: '시작일 (ISO8601)',
        },
        period_end: {
          type: 'string',
          description: '종료일 (ISO8601)',
        },
      },
      required: ['org_id', 'period_start', 'period_end'],
    },
  },
  {
    name: 'evidence_verify_package',
    description: 'Gov ZIP 패키지 무결성 검증 - MANIFEST v1.2 및 파일 해시 검증',
    inputSchema: {
      type: 'object',
      properties: {
        storage_path: {
          type: 'string',
          description: 'Supabase Storage 경로',
        },
        expected_hash: {
          type: 'string',
          description: '예상 패키지 해시 (선택)',
        },
      },
      required: ['storage_path'],
    },
  },
  {
    name: 'evidence_list_snapshots',
    description: '조직의 증빙 스냅샷 목록 조회',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        limit: {
          type: 'number',
          description: '최대 결과 수 (기본값: 20)',
        },
      },
      required: ['org_id'],
    },
  },
  {
    name: 'evidence_get_snapshot_details',
    description: '증빙 스냅샷 상세 정보 조회',
    inputSchema: {
      type: 'object',
      properties: {
        snapshot_id: {
          type: 'string',
          description: '스냅샷 ID',
        },
      },
      required: ['snapshot_id'],
    },
  },
];

export async function handleEvidenceTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  switch (name) {
    case 'evidence_create_snapshot':
      return await createSnapshot(args, supabase);
    case 'evidence_verify_package':
      return await verifyPackage(args, supabase);
    case 'evidence_list_snapshots':
      return await listSnapshots(args, supabase);
    case 'evidence_get_snapshot_details':
      return await getSnapshotDetails(args, supabase);
    default:
      throw new Error(`Unknown evidence tool: ${name}`);
  }
}

async function createSnapshot(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, period_start, period_end } = args as {
    org_id: string;
    period_start: string;
    period_end: string;
  };

  // 1. 이벤트 데이터 조회
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', org_id)
    .gte('occurred_at', period_start)
    .lte('occurred_at', period_end)
    .order('occurred_at', { ascending: true });

  if (eventsError) throw new Error(`Events query failed: ${eventsError.message}`);

  // 2. 조치 데이터 조회
  const { data: actions, error: actionsError } = await supabase
    .from('actions')
    .select('*')
    .eq('org_id', org_id)
    .gte('created_at', period_start)
    .lte('created_at', period_end);

  if (actionsError) throw new Error(`Actions query failed: ${actionsError.message}`);

  // 3. 알람 수 집계
  const alarmCount = events?.filter((e) => e.alarm_active).length || 0;

  // 4. CSV 생성
  const eventsCSV = buildEventsCSV(events || []);
  const actionsCSV = buildActionsCSV(actions || []);

  // 5. 파일 해시 계산
  const eventsHash = calculateHash(Buffer.from(eventsCSV));
  const actionsHash = calculateHash(Buffer.from(actionsCSV));

  // 6. MANIFEST v1.2 생성
  const files = [
    { name: 'events.csv', hash: eventsHash, size: Buffer.byteLength(eventsCSV) },
    { name: 'actions.csv', hash: actionsHash, size: Buffer.byteLength(actionsCSV) },
  ];

  const packageHash = calculateHash(
    Buffer.from(files.map((f) => f.hash).sort().join(''))
  );

  const manifest = {
    manifest_version: '1.2',
    org_id,
    created_at: new Date().toISOString(),
    period: {
      start: period_start,
      end: period_end,
    },
    counts: {
      events: events?.length || 0,
      actions: actions?.length || 0,
      alarms: alarmCount,
    },
    files,
    package_hash: packageHash,
    retention_hint: {
      years: 5,
      note: '정부 제출용 증빙 자료',
    },
  };

  // 7. ZIP 패키지 생성
  const zip = new AdmZip();
  zip.addFile('MANIFEST.json', Buffer.from(JSON.stringify(manifest, null, 2)));
  zip.addFile('events.csv', Buffer.from(eventsCSV));
  zip.addFile('actions.csv', Buffer.from(actionsCSV));

  const zipBuffer = zip.toBuffer();
  const govZipHash = calculateHash(zipBuffer);

  // 8. Storage 업로드
  const filename = `QETTA_${org_id.slice(0, 8)}_${period_start.slice(0, 7).replace('-', '')}_${Date.now()}.zip`;
  const storagePath = `evidence/${org_id}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(storagePath, zipBuffer, {
      contentType: 'application/zip',
    });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // 9. 스냅샷 메타데이터 저장
  const { data: snapshot, error: snapshotError } = await supabase
    .from('evidence_snapshots')
    .insert({
      org_id,
      period_start,
      period_end,
      gov_zip_hash: govZipHash,
      manifest_hash: calculateHash(Buffer.from(JSON.stringify(manifest))),
      package_hash: packageHash,
      storage_path: storagePath,
      event_count: events?.length || 0,
      action_count: actions?.length || 0,
      alarm_count: alarmCount,
      retention_until: new Date(
        Date.now() + 5 * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .select()
    .single();

  if (snapshotError) throw new Error(`Snapshot insert failed: ${snapshotError.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            snapshot_id: snapshot.id,
            storage_path: storagePath,
            package_hash: packageHash,
            counts: manifest.counts,
            message: '증빙 스냅샷이 성공적으로 생성되었습니다.',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function verifyPackage(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { storage_path, expected_hash } = args as {
    storage_path: string;
    expected_hash?: string;
  };

  // 1. Storage에서 ZIP 다운로드
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('evidence')
    .download(storage_path);

  if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);

  const zipBuffer = Buffer.from(await fileData.arrayBuffer());
  const errors: string[] = [];

  // 2. ZIP 열기 및 검증
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // 3. MANIFEST.json 확인
  const manifestEntry = entries.find((e) => e.entryName === 'MANIFEST.json');
  if (!manifestEntry) {
    return createVerificationResult(false, ['MANIFEST.json not found']);
  }

  // 4. MANIFEST 파싱
  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
  } catch {
    return createVerificationResult(false, ['Invalid MANIFEST.json']);
  }

  // 5. 버전 확인
  const manifestValid = manifest.manifest_version === '1.2';
  if (!manifestValid) {
    errors.push(`Invalid manifest version: ${manifest.manifest_version}`);
  }

  // 6. 파일별 해시 검증
  let filesValid = true;
  const files = manifest.files as Array<{ name: string; hash: string }>;

  for (const fileInfo of files) {
    const entry = entries.find((e) => e.entryName === fileInfo.name);
    if (!entry) {
      errors.push(`File missing: ${fileInfo.name}`);
      filesValid = false;
      continue;
    }

    const actualHash = calculateHash(entry.getData());
    if (actualHash !== fileInfo.hash) {
      errors.push(`Hash mismatch: ${fileInfo.name}`);
      filesValid = false;
    }
  }

  // 7. 패키지 해시 검증
  const allHashes = files.map((f) => f.hash).sort().join('');
  const calculatedPackageHash = calculateHash(Buffer.from(allHashes));
  const packageHashValid = calculatedPackageHash === manifest.package_hash;

  if (!packageHashValid) {
    errors.push('Package hash mismatch');
  }

  // 8. 외부 해시와 비교
  if (expected_hash && expected_hash !== manifest.package_hash) {
    errors.push('External hash mismatch - 변조 가능성 감지');
  }

  const counts = manifest.counts as { events: number; actions: number; alarms: number };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            valid: errors.length === 0,
            manifestValid,
            filesValid,
            packageHashValid,
            errors,
            details: {
              manifestVersion: manifest.manifest_version,
              eventCount: counts.events,
              actionCount: counts.actions,
              alarmCount: counts.alarms,
              fileCount: files.length,
            },
            message: errors.length === 0
              ? '✅ 무결성 검증 성공 - 변조 탐지 없음'
              : '❌ 무결성 검증 실패 - 변조 가능성 있음',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function listSnapshots(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, limit = 20 } = args as { org_id: string; limit?: number };

  const { data, error } = await supabase
    .from('evidence_snapshots')
    .select('id, period_start, period_end, event_count, action_count, alarm_count, created_at, storage_path')
    .eq('org_id', org_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Query failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: data?.length || 0,
            snapshots: data,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function getSnapshotDetails(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { snapshot_id } = args as { snapshot_id: string };

  const { data, error } = await supabase
    .from('evidence_snapshots')
    .select('*')
    .eq('id', snapshot_id)
    .single();

  if (error) throw new Error(`Query failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

// Helper functions
function calculateHash(buffer: Buffer): string {
  return 'sha256:' + crypto.createHash('sha256').update(buffer).digest('hex');
}

function buildEventsCSV(events: Record<string, unknown>[]): string {
  const headers = ['id', 'occurred_at', 'asset_id', 'event_type', 'machine_state', 'alarm_active', 'alarm_code', 'source'];
  const rows = events.map((e) => [
    e.id,
    e.occurred_at,
    e.asset_id,
    e.event_type,
    e.machine_state,
    e.alarm_active ? 'true' : 'false',
    e.alarm_code || '',
    e.source,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function buildActionsCSV(actions: Record<string, unknown>[]): string {
  const headers = ['id', 'event_id', 'status', 'priority', 'note', 'created_at', 'created_by'];
  const rows = actions.map((a) => [
    a.id,
    a.event_id || '',
    a.status,
    a.priority,
    a.note || '',
    a.created_at,
    a.created_by,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function createVerificationResult(valid: boolean, errors: string[]) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            valid,
            manifestValid: false,
            filesValid: false,
            packageHashValid: false,
            errors,
          },
          null,
          2
        ),
      },
    ],
  };
}
