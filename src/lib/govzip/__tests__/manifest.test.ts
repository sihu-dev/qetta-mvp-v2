/**
 * MANIFEST v1.2 Tests
 *
 * Tests for Gov ZIP MANIFEST generation and validation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateHash,
  buildManifest,
  serializeManifest,
  parseManifest,
  verifyPackageHash,
  type FileEntry,
} from '../manifest';
import type { ManifestV1_2 } from '../schema';

describe('manifest', () => {
  // Test fixtures
  const createMockFiles = (): FileEntry[] => [
    { name: 'events.csv', content: Buffer.from('event1,data1\nevent2,data2') },
    { name: 'actions.csv', content: Buffer.from('action1,result1') },
    { name: 'photos/photo1.jpg', content: Buffer.from('fake-image-data-1') },
    { name: 'photos/photo2.jpg', content: Buffer.from('fake-image-data-2') },
  ];

  const createValidManifest = (overrides?: Partial<ManifestV1_2>): ManifestV1_2 => ({
    manifest_version: '1.2',
    generator: 'Qetta v1.0.0',
    generated_at: '2024-01-15T10:30:00.000Z',
    period: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z',
    },
    org_id: 'test-org-123',
    counts: {
      events: 100,
      actions: 25,
      alarms: 5,
    },
    files: [
      { name: 'events.csv', hash: 'abc123', size: 1024 },
      { name: 'actions.csv', hash: 'def456', size: 512 },
    ],
    package_hash: 'pkg-hash-xyz',
    retention_hint: {
      min_days: 1825,
      regulation: '스마트공장 보급사업 관리지침',
      note: '정부사업 증빙 자료 - 5년 보관 권장',
    },
    ...overrides,
  });

  describe('calculateHash', () => {
    it('calculates SHA-256 hash for a buffer', () => {
      const content = Buffer.from('Hello, World!');
      const hash = calculateHash(content);

      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
      expect(hash).toBe('dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f');
    });

    it('returns different hashes for different content', () => {
      const hash1 = calculateHash(Buffer.from('content1'));
      const hash2 = calculateHash(Buffer.from('content2'));

      expect(hash1).not.toBe(hash2);
    });

    it('returns same hash for same content', () => {
      const content = Buffer.from('same content');
      const hash1 = calculateHash(content);
      const hash2 = calculateHash(content);

      expect(hash1).toBe(hash2);
    });

    it('handles empty buffer', () => {
      const hash = calculateHash(Buffer.from(''));

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      // SHA-256 of empty string
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('handles binary data', () => {
      const binaryData = Buffer.from([0x00, 0xff, 0x7f, 0x80, 0x01]);
      const hash = calculateHash(binaryData);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles large buffers', () => {
      const largeContent = Buffer.alloc(1024 * 1024, 'x'); // 1MB
      const hash = calculateHash(largeContent);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles unicode content', () => {
      const content = Buffer.from('한글 테스트 🎉 Unicode');
      const hash = calculateHash(content);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('buildManifest', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
    });

    it('creates valid MANIFEST v1.2 structure', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        100,
        25,
        5
      );

      expect(manifest.manifest_version).toBe('1.2');
      expect(manifest.generator).toMatch(/^Qetta v/);
      expect(manifest.org_id).toBe('org-123');
      expect(manifest.period.start).toBe('2024-01-01T00:00:00Z');
      expect(manifest.period.end).toBe('2024-01-31T23:59:59Z');
    });

    it('includes all required counts (v1.2)', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        100,
        25,
        5
      );

      expect(manifest.counts.events).toBe(100);
      expect(manifest.counts.actions).toBe(25);
      expect(manifest.counts.alarms).toBe(5); // v1.2 required
    });

    it('excludes MANIFEST.json from files list', () => {
      const files: FileEntry[] = [
        { name: 'events.csv', content: Buffer.from('data') },
        { name: 'MANIFEST.json', content: Buffer.from('{}') }, // Should be excluded
        { name: 'actions.csv', content: Buffer.from('data') },
      ];

      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      const fileNames = manifest.files.map((f) => f.name);
      expect(fileNames).not.toContain('MANIFEST.json');
      expect(fileNames).toContain('events.csv');
      expect(fileNames).toContain('actions.csv');
    });

    it('calculates correct file hashes', () => {
      const files: FileEntry[] = [
        { name: 'test.txt', content: Buffer.from('Hello, World!') },
      ];

      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        1,
        0,
        0
      );

      expect(manifest.files[0].hash).toBe(
        'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f'
      );
    });

    it('calculates correct file sizes', () => {
      const content = 'Test content';
      const files: FileEntry[] = [{ name: 'test.txt', content: Buffer.from(content) }];

      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        1,
        0,
        0
      );

      expect(manifest.files[0].size).toBe(Buffer.from(content).length);
    });

    it('generates package hash from sorted file hashes', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      expect(manifest.package_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('includes default retention hint values', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      expect(manifest.retention_hint.min_days).toBe(365 * 5); // 5 years
      expect(manifest.retention_hint.regulation).toBe('스마트공장 보급사업 관리지침');
      expect(typeof manifest.retention_hint.note).toBe('string'); // v1.2: must be string
    });

    it('handles empty files array', () => {
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        [],
        0,
        0,
        0
      );

      expect(manifest.files).toHaveLength(0);
      expect(manifest.package_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles zero counts', () => {
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        [],
        0,
        0,
        0
      );

      expect(manifest.counts.events).toBe(0);
      expect(manifest.counts.actions).toBe(0);
      expect(manifest.counts.alarms).toBe(0);
    });

    it('handles large counts', () => {
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        [],
        1000000,
        500000,
        10000
      );

      expect(manifest.counts.events).toBe(1000000);
      expect(manifest.counts.actions).toBe(500000);
      expect(manifest.counts.alarms).toBe(10000);
    });

    it('sets generated_at to current time', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      expect(manifest.generated_at).toBe('2024-01-15T10:30:00.000Z');
    });

    vi.useRealTimers();
  });

  describe('serializeManifest', () => {
    it('serializes manifest to JSON string', () => {
      const manifest = createValidManifest();
      const json = serializeManifest(manifest);

      expect(typeof json).toBe('string');
      expect(JSON.parse(json)).toEqual(manifest);
    });

    it('uses pretty formatting (2 spaces)', () => {
      const manifest = createValidManifest();
      const json = serializeManifest(manifest);

      // Check for 2-space indentation
      expect(json).toContain('  "manifest_version"');
    });

    it('preserves all fields', () => {
      const manifest = createValidManifest();
      const json = serializeManifest(manifest);
      const parsed = JSON.parse(json);

      expect(parsed.manifest_version).toBe('1.2');
      expect(parsed.counts.alarms).toBe(5);
      expect(parsed.retention_hint.note).toBe('정부사업 증빙 자료 - 5년 보관 권장');
    });

    it('handles unicode characters', () => {
      const manifest = createValidManifest({
        retention_hint: {
          min_days: 1825,
          regulation: '한글 규정 🎉',
          note: '유니코드 노트 テスト',
        },
      });
      const json = serializeManifest(manifest);
      const parsed = JSON.parse(json);

      expect(parsed.retention_hint.regulation).toBe('한글 규정 🎉');
      expect(parsed.retention_hint.note).toBe('유니코드 노트 テスト');
    });
  });

  describe('parseManifest', () => {
    it('parses valid MANIFEST v1.2 JSON', () => {
      const manifest = createValidManifest();
      const json = JSON.stringify(manifest);
      const parsed = parseManifest(json);

      expect(parsed.manifest_version).toBe('1.2');
      expect(parsed.counts.alarms).toBe(5);
    });

    it('throws error for invalid version', () => {
      const manifest = createValidManifest({ manifest_version: '1.0' as '1.2' });
      const json = JSON.stringify(manifest);

      expect(() => parseManifest(json)).toThrow('Invalid manifest version: 1.0');
    });

    it('throws error when counts.alarms is missing', () => {
      const manifest = createValidManifest();
      // @ts-expect-error - testing invalid data
      delete manifest.counts.alarms;
      const json = JSON.stringify(manifest);

      expect(() => parseManifest(json)).toThrow('Missing required field: counts.alarms');
    });

    it('throws error when counts.alarms is not a number', () => {
      const manifest = createValidManifest();
      // @ts-expect-error - testing invalid data
      manifest.counts.alarms = '5';
      const json = JSON.stringify(manifest);

      expect(() => parseManifest(json)).toThrow('Missing required field: counts.alarms');
    });

    it('throws error when retention_hint.note is not a string', () => {
      const manifest = createValidManifest();
      // @ts-expect-error - testing invalid data
      manifest.retention_hint.note = 123;
      const json = JSON.stringify(manifest);

      expect(() => parseManifest(json)).toThrow('retention_hint.note must be a string');
    });

    it('throws error when retention_hint.note is an array (v1.1 format)', () => {
      const manifest = createValidManifest();
      // @ts-expect-error - testing old v1.1 format
      manifest.retention_hint.note = ['note1', 'note2'];
      const json = JSON.stringify(manifest);

      expect(() => parseManifest(json)).toThrow('retention_hint.note must be a string');
    });

    it('throws error for invalid JSON', () => {
      expect(() => parseManifest('not valid json')).toThrow();
    });

    it('throws error for empty JSON object', () => {
      expect(() => parseManifest('{}')).toThrow();
    });

    it('preserves all fields after parse', () => {
      const original = createValidManifest();
      const json = JSON.stringify(original);
      const parsed = parseManifest(json);

      expect(parsed).toEqual(original);
    });
  });

  describe('verifyPackageHash', () => {
    it('returns true for valid package hash', () => {
      // Create a manifest with correctly calculated package hash
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      expect(verifyPackageHash(manifest)).toBe(true);
    });

    it('returns false for tampered package hash', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      // Tamper with the hash
      manifest.package_hash = 'tampered-hash-value';

      expect(verifyPackageHash(manifest)).toBe(false);
    });

    it('returns false when file hashes are modified', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      // Tamper with a file hash
      if (manifest.files.length > 0) {
        manifest.files[0].hash = 'tampered-file-hash';
      }

      expect(verifyPackageHash(manifest)).toBe(false);
    });

    it('handles empty files array', () => {
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        [],
        0,
        0,
        0
      );

      expect(verifyPackageHash(manifest)).toBe(true);
    });

    it('verifies hash regardless of file order in manifest', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      // Reverse the files array
      manifest.files.reverse();

      // Should still verify because hashes are sorted before hashing
      expect(verifyPackageHash(manifest)).toBe(true);
    });

    it('detects when files are added', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      // Add a new file
      manifest.files.push({
        name: 'new-file.txt',
        hash: 'abc123456',
        size: 100,
      });

      expect(verifyPackageHash(manifest)).toBe(false);
    });

    it('detects when files are removed', () => {
      const files = createMockFiles();
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        10,
        5,
        1
      );

      // Remove a file
      manifest.files.pop();

      expect(verifyPackageHash(manifest)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('full workflow: build -> serialize -> parse -> verify', () => {
      const files = createMockFiles();

      // Build
      const manifest = buildManifest(
        'org-integration-test',
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z',
        files,
        1000,
        250,
        50
      );

      // Serialize
      const json = serializeManifest(manifest);
      expect(typeof json).toBe('string');

      // Parse
      const parsed = parseManifest(json);
      expect(parsed.manifest_version).toBe('1.2');
      expect(parsed.org_id).toBe('org-integration-test');

      // Verify
      expect(verifyPackageHash(parsed)).toBe(true);
    });

    it('tamper detection workflow', () => {
      const files = createMockFiles();

      // Build original manifest
      const manifest = buildManifest(
        'org-123',
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z',
        files,
        100,
        25,
        5
      );

      // Serialize and parse (simulating storage/transmission)
      const json = serializeManifest(manifest);
      const parsed = parseManifest(json);

      // Verify original is valid
      expect(verifyPackageHash(parsed)).toBe(true);

      // Simulate tampering
      parsed.counts.events = 999; // Try to hide events
      // Note: counts aren't part of hash, but file hashes are

      // Tamper with file content (by changing hash)
      if (parsed.files.length > 0) {
        parsed.files[0].hash = 'fake-hash-after-content-change';
      }

      // Tamper detection should catch it
      expect(verifyPackageHash(parsed)).toBe(false);
    });
  });
});
