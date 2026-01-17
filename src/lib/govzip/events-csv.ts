/**
 * Events CSV Builder
 * 이벤트 데이터를 CSV 형식으로 변환
 */

import type { Event } from '../agi/types';

const CSV_HEADERS = [
  'id',
  'occurred_at',
  'asset_id',
  'event_type',
  'machine_state',
  'alarm_active',
  'alarm_code',
  'source',
];

/**
 * 이벤트 배열을 CSV 문자열로 변환
 */
export function buildEventsCSV(events: Event[]): string {
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
