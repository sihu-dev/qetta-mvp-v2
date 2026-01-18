import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { parseJson } from '../parse-json';

// Helper to create a mock NextRequest
function createMockRequest(body: unknown, validJson = true): NextRequest {
  const request = {
    json: validJson
      ? vi.fn().mockResolvedValue(body)
      : vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
  } as unknown as NextRequest;
  return request;
}

describe('parseJson', () => {
  it('successfully parses valid JSON', async () => {
    const mockData = { name: 'test', value: 42 };
    const request = createMockRequest(mockData);

    const result = await parseJson<typeof mockData>(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockData);
    }
  });

  it('returns error response for invalid JSON', async () => {
    const request = createMockRequest(null, false);

    const result = await parseJson(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it('handles empty object', async () => {
    const request = createMockRequest({});

    const result = await parseJson<Record<string, never>>(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('handles array body', async () => {
    const mockData = [1, 2, 3];
    const request = createMockRequest(mockData);

    const result = await parseJson<number[]>(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, 2, 3]);
    }
  });

  it('handles nested objects', async () => {
    const mockData = {
      user: {
        name: 'John',
        address: {
          city: 'Seoul',
        },
      },
    };
    const request = createMockRequest(mockData);

    const result = await parseJson<typeof mockData>(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.address.city).toBe('Seoul');
    }
  });

  it('handles generic parse error', async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new Error('Network error')),
    } as unknown as NextRequest;

    const result = await parseJson(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});
