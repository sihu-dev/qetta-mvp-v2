/**
 * CSV Builders Tests
 *
 * Tests for events-csv.ts and actions-csv.ts
 */
import { describe, it, expect } from 'vitest';
import { buildEventsCSV } from '../events-csv';
import { buildActionsCSV } from '../actions-csv';
import type { Event, Action } from '../../agi/types';

describe('csv-builders', () => {
  // Test fixtures
  const createMockEvent = (overrides?: Partial<Event>): Event => ({
    id: 'evt-001',
    occurred_at: '2024-01-15T10:30:00.000Z',
    asset_id: 'asset-001',
    event_type: 'alarm',
    machine_state: 'running',
    alarm_active: true,
    alarm_code: 'E001',
    source: 'sensor',
    ...overrides,
  });

  const createMockAction = (overrides?: Partial<Action>): Action => ({
    id: 'act-001',
    event_id: 'evt-001',
    status: 'completed',
    priority: 'high',
    note: 'Issue resolved',
    photo_paths: ['/photos/img1.jpg', '/photos/img2.jpg'],
    created_at: '2024-01-15T10:35:00.000Z',
    created_by: 'user-001',
    updated_at: '2024-01-15T11:00:00.000Z',
    ...overrides,
  });

  describe('buildEventsCSV', () => {
    it('creates CSV with correct headers', () => {
      const csv = buildEventsCSV([]);
      const headers = csv.split('\n')[0];

      expect(headers).toBe(
        'id,occurred_at,asset_id,event_type,machine_state,alarm_active,alarm_code,source'
      );
    });

    it('includes data row for single event', () => {
      const event = createMockEvent();
      const csv = buildEventsCSV([event]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('evt-001');
      expect(lines[1]).toContain('2024-01-15T10:30:00.000Z');
      expect(lines[1]).toContain('asset-001');
    });

    it('includes multiple events', () => {
      const events: Event[] = [
        createMockEvent({ id: 'evt-001' }),
        createMockEvent({ id: 'evt-002' }),
        createMockEvent({ id: 'evt-003' }),
      ];
      const csv = buildEventsCSV(events);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(4); // header + 3 data rows
    });

    it('converts alarm_active boolean to string', () => {
      const eventTrue = createMockEvent({ alarm_active: true });
      const eventFalse = createMockEvent({ alarm_active: false });

      const csvTrue = buildEventsCSV([eventTrue]);
      const csvFalse = buildEventsCSV([eventFalse]);

      expect(csvTrue).toContain(',true,');
      expect(csvFalse).toContain(',false,');
    });

    it('handles null alarm_code', () => {
      const event = createMockEvent({ alarm_code: null });
      const csv = buildEventsCSV([event]);

      // Should have empty value for alarm_code, not "null"
      expect(csv).not.toContain('null');
    });

    it('escapes values containing commas', () => {
      const event = createMockEvent({
        id: 'evt,with,commas',
      });
      const csv = buildEventsCSV([event]);

      expect(csv).toContain('"evt,with,commas"');
    });

    it('escapes values containing quotes', () => {
      const event = createMockEvent({
        id: 'evt"with"quotes',
      });
      const csv = buildEventsCSV([event]);

      // Quotes should be doubled
      expect(csv).toContain('"evt""with""quotes"');
    });

    it('escapes values containing newlines', () => {
      const event = createMockEvent({
        id: 'evt\nwith\nnewlines',
      });
      const csv = buildEventsCSV([event]);

      expect(csv).toContain('"evt\nwith\nnewlines"');
    });

    it('handles all event types', () => {
      const events: Event[] = [
        createMockEvent({ event_type: 'status' }),
        createMockEvent({ event_type: 'alarm' }),
        createMockEvent({ event_type: 'measurement' }),
      ];
      const csv = buildEventsCSV(events);

      expect(csv).toContain('status');
      expect(csv).toContain('alarm');
      expect(csv).toContain('measurement');
    });

    it('handles all machine states', () => {
      const events: Event[] = [
        createMockEvent({ machine_state: 'running' }),
        createMockEvent({ machine_state: 'idle' }),
        createMockEvent({ machine_state: 'stopped' }),
        createMockEvent({ machine_state: 'error' }),
      ];
      const csv = buildEventsCSV(events);

      expect(csv).toContain('running');
      expect(csv).toContain('idle');
      expect(csv).toContain('stopped');
      expect(csv).toContain('error');
    });

    it('handles all source types', () => {
      const events: Event[] = [
        createMockEvent({ source: 'sensor' }),
        createMockEvent({ source: 'plc' }),
        createMockEvent({ source: 'manual' }),
        createMockEvent({ source: 'csv_import' }),
      ];
      const csv = buildEventsCSV(events);

      expect(csv).toContain('sensor');
      expect(csv).toContain('plc');
      expect(csv).toContain('manual');
      expect(csv).toContain('csv_import');
    });

    it('handles empty events array', () => {
      const csv = buildEventsCSV([]);

      expect(csv.split('\n')).toHaveLength(1); // Only header
    });

    it('handles Korean characters', () => {
      const event = createMockEvent({
        id: '이벤트-001',
        asset_id: '설비-A01',
      });
      const csv = buildEventsCSV([event]);

      expect(csv).toContain('이벤트-001');
      expect(csv).toContain('설비-A01');
    });
  });

  describe('buildActionsCSV', () => {
    it('creates CSV with correct headers', () => {
      const csv = buildActionsCSV([]);
      const headers = csv.split('\n')[0];

      expect(headers).toBe(
        'id,event_id,status,priority,note,photo_count,created_at,created_by,updated_at'
      );
    });

    it('includes data row for single action', () => {
      const action = createMockAction();
      const csv = buildActionsCSV([action]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2); // header + 1 data row
      expect(lines[1]).toContain('act-001');
      expect(lines[1]).toContain('evt-001');
      expect(lines[1]).toContain('Issue resolved');
    });

    it('includes multiple actions', () => {
      const actions: Action[] = [
        createMockAction({ id: 'act-001' }),
        createMockAction({ id: 'act-002' }),
        createMockAction({ id: 'act-003' }),
      ];
      const csv = buildActionsCSV(actions);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(4); // header + 3 data rows
    });

    it('calculates photo_count correctly', () => {
      const actionNoPhotos = createMockAction({ photo_paths: [] });
      const actionOnePhoto = createMockAction({ photo_paths: ['/photo1.jpg'] });
      const actionManyPhotos = createMockAction({
        photo_paths: ['/photo1.jpg', '/photo2.jpg', '/photo3.jpg', '/photo4.jpg'],
      });

      const csvNo = buildActionsCSV([actionNoPhotos]);
      const csvOne = buildActionsCSV([actionOnePhoto]);
      const csvMany = buildActionsCSV([actionManyPhotos]);

      // Photo count is the 6th column (index 5)
      expect(csvNo.split('\n')[1].split(',')[5]).toBe('0');
      expect(csvOne.split('\n')[1].split(',')[5]).toBe('1');
      expect(csvMany.split('\n')[1].split(',')[5]).toBe('4');
    });

    it('handles all status types', () => {
      const actions: Action[] = [
        createMockAction({ status: 'open' }),
        createMockAction({ status: 'in_progress' }),
        createMockAction({ status: 'completed' }),
        createMockAction({ status: 'deferred' }),
      ];
      const csv = buildActionsCSV(actions);

      expect(csv).toContain('open');
      expect(csv).toContain('in_progress');
      expect(csv).toContain('completed');
      expect(csv).toContain('deferred');
    });

    it('handles all priority levels', () => {
      const actions: Action[] = [
        createMockAction({ priority: 'low' }),
        createMockAction({ priority: 'medium' }),
        createMockAction({ priority: 'high' }),
        createMockAction({ priority: 'critical' }),
      ];
      const csv = buildActionsCSV(actions);

      expect(csv).toContain('low');
      expect(csv).toContain('medium');
      expect(csv).toContain('high');
      expect(csv).toContain('critical');
    });

    it('escapes values containing commas', () => {
      const action = createMockAction({
        note: 'Issue resolved, all tests passed',
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toContain('"Issue resolved, all tests passed"');
    });

    it('escapes values containing quotes', () => {
      const action = createMockAction({
        note: 'User said "fix it now"',
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toContain('"User said ""fix it now"""');
    });

    it('escapes values containing newlines', () => {
      const action = createMockAction({
        note: 'Line 1\nLine 2\nLine 3',
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toContain('"Line 1\nLine 2\nLine 3"');
    });

    it('handles empty actions array', () => {
      const csv = buildActionsCSV([]);

      expect(csv.split('\n')).toHaveLength(1); // Only header
    });

    it('handles Korean characters in notes', () => {
      const action = createMockAction({
        note: '문제 해결 완료. 센서 교체함.',
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toContain('문제 해결 완료. 센서 교체함.');
    });

    it('handles special characters', () => {
      const action = createMockAction({
        note: 'Fixed issue: sensor #123 @ zone A-1 (urgent!)',
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toContain('Fixed issue: sensor #123 @ zone A-1 (urgent!)');
    });
  });

  describe('CSV Format Compliance', () => {
    it('events CSV can be parsed as valid CSV', () => {
      const events: Event[] = [
        createMockEvent({ id: 'evt-001' }),
        createMockEvent({ id: 'evt,002' }), // with comma
        createMockEvent({ id: 'evt"003' }), // with quote
      ];
      const csv = buildEventsCSV(events);

      // Parse CSV manually
      const lines = csv.split('\n');
      expect(lines.length).toBe(4);

      // First line is headers
      const headers = lines[0].split(',');
      expect(headers).toHaveLength(8);
    });

    it('actions CSV can be parsed as valid CSV', () => {
      const actions: Action[] = [
        createMockAction({ id: 'act-001' }),
        createMockAction({ note: 'note,with,commas' }),
        createMockAction({ note: 'note "with" quotes' }),
      ];
      const csv = buildActionsCSV(actions);

      const lines = csv.split('\n');
      expect(lines.length).toBe(4);

      const headers = lines[0].split(',');
      expect(headers).toHaveLength(9);
    });
  });

  describe('Edge Cases', () => {
    it('handles events with empty strings', () => {
      const event = createMockEvent({
        id: '',
        asset_id: '',
        alarm_code: '',
      });
      const csv = buildEventsCSV([event]);

      expect(csv).toBeDefined();
      // Should not throw
    });

    it('handles actions with empty note', () => {
      const action = createMockAction({
        note: '',
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toBeDefined();
    });

    it('handles very long strings', () => {
      const longNote = 'A'.repeat(10000);
      const action = createMockAction({
        note: longNote,
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toContain(longNote);
    });

    it('handles unicode emojis', () => {
      const action = createMockAction({
        note: 'Fixed! 🎉 All good now ✅',
      });
      const csv = buildActionsCSV([action]);

      expect(csv).toContain('🎉');
      expect(csv).toContain('✅');
    });

    it('handles large number of events', () => {
      const events = Array.from({ length: 1000 }, (_, i) =>
        createMockEvent({ id: `evt-${i.toString().padStart(4, '0')}` })
      );
      const csv = buildEventsCSV(events);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(1001); // header + 1000 rows
    });

    it('handles large number of actions', () => {
      const actions = Array.from({ length: 1000 }, (_, i) =>
        createMockAction({ id: `act-${i.toString().padStart(4, '0')}` })
      );
      const csv = buildActionsCSV(actions);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(1001); // header + 1000 rows
    });
  });
});
