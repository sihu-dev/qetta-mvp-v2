/**
 * Actions CSV Builder
 * 조치 데이터를 CSV 형식으로 변환
 */

import type { Action } from '../agi/types';

const CSV_HEADERS = [
  'id',
  'event_id',
  'status',
  'priority',
  'note',
  'photo_count',
  'created_at',
  'created_by',
  'updated_at',
];

/**
 * 조치 배열을 CSV 문자열로 변환
 */
export function buildActionsCSV(actions: Action[]): string {
  const rows = actions.map((a) => [
    a.id,
    a.event_id,
    a.status,
    a.priority,
    a.note,
    String(a.photo_paths.length),
    a.created_at,
    a.created_by,
    a.updated_at,
  ]);

  return [CSV_HEADERS.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
}

/**
 * CSV 값 이스케이프
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
