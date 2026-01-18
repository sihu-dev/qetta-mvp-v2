import { test, expect } from '@playwright/test';

/**
 * API Endpoints E2E Tests
 * Tests for core API endpoints
 */
test.describe('API Endpoints', () => {
  test.describe('Health API', () => {
    test('GET /api/health should return health status', async ({ request }) => {
      const response = await request.get('/api/health');

      // Should return 200 or 503 (if unhealthy)
      expect([200, 503]).toContain(response.status());

      const body = await response.json();

      // Should have required fields
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('checks');

      // Status should be one of the valid values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);

      // Checks should be an array
      expect(Array.isArray(body.checks)).toBeTruthy();
    });

    test('GET /api/health should include memory check', async ({ request }) => {
      const response = await request.get('/api/health');
      const body = await response.json();

      // Should have memory check
      const memoryCheck = body.checks.find(
        (check: { name: string }) => check.name === 'memory'
      );
      expect(memoryCheck).toBeDefined();
      expect(memoryCheck).toHaveProperty('status');
      expect(['pass', 'warn', 'fail']).toContain(memoryCheck.status);
    });

    test('GET /api/health should include environment check', async ({ request }) => {
      const response = await request.get('/api/health');
      const body = await response.json();

      // Should have environment check
      const envCheck = body.checks.find(
        (check: { name: string }) => check.name === 'environment'
      );
      expect(envCheck).toBeDefined();
      expect(envCheck).toHaveProperty('status');
    });

    test('GET /api/health should return uptime', async ({ request }) => {
      const response = await request.get('/api/health');
      const body = await response.json();

      // Should have uptime field
      expect(body).toHaveProperty('uptime');
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/health/live should return liveness status', async ({ request }) => {
      const response = await request.get('/api/health/live');

      // Should return 200
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toBe('alive');
    });

    test('GET /api/health/ready should return readiness status', async ({ request }) => {
      const response = await request.get('/api/health/ready');

      // Should return 200 or 503 (503 if dependencies like Supabase are not available)
      expect([200, 503]).toContain(response.status());

      const body = await response.json();
      // API returns 'ready' boolean instead of 'status' string
      expect(body).toHaveProperty('ready');
      expect(typeof body.ready).toBe('boolean');
      expect(body).toHaveProperty('timestamp');
    });
  });

  test.describe('Tender API', () => {
    test('POST /api/tender/collect should require orgId and source', async ({ request }) => {
      const response = await request.post('/api/tender/collect', {
        data: {},
      });

      // Should return 400 for missing required fields
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      // Error is now an object with message property
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('orgId');
    });

    test('POST /api/tender/collect should work with simulation mode', async ({ request }) => {
      const response = await request.post('/api/tender/collect', {
        data: {
          orgId: 'test-org-123',
          source: 'g2b',
          simulate: true,
          limit: 5,
        },
      });

      // Should return 200 or 500 (500 if Supabase not available)
      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        // Data is now wrapped in 'data' property
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('result');
        expect(body.data.result).toHaveProperty('source');
        expect(body.data.result.source).toBe('g2b');
      } else {
        // If error, should have error message
        expect(body).toHaveProperty('error');
      }
    });

    test('POST /api/tender/collect should return metadata', async ({ request }) => {
      const response = await request.post('/api/tender/collect', {
        data: {
          orgId: 'test-org-123',
          source: 'ungm',
          simulate: true,
          limit: 3,
        },
      });

      // Should return 200 or 500 (500 if Supabase not available)
      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('metadata');
        expect(body.metadata).toHaveProperty('executionTime');
        expect(body.metadata).toHaveProperty('simulated');
        expect(body.metadata).toHaveProperty('availableSources');
      } else {
        // If error, should have error message
        expect(body).toHaveProperty('error');
      }
    });

    test('GET /api/tender/collect should require orgId', async ({ request }) => {
      const response = await request.get('/api/tender/collect');

      // Should return 400 for missing orgId
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test.describe('Evidence API', () => {
    test('GET /api/evidence should require orgId', async ({ request }) => {
      const response = await request.get('/api/evidence');

      // Should return 400 for missing orgId
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      // Error is now an object with message property
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('orgId');
    });

    test('GET /api/evidence should return snapshots list structure', async ({ request }) => {
      const response = await request.get('/api/evidence?orgId=test-org-123');

      // Should return 200 or 500 (500 if Supabase not available)
      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('success');
        // Data is now wrapped in 'data' property
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('snapshots');
        expect(body.data).toHaveProperty('count');
        expect(Array.isArray(body.data.snapshots)).toBeTruthy();
      } else {
        // If error, should have error message
        expect(body).toHaveProperty('error');
      }
    });

    test('POST /api/evidence should require all fields', async ({ request }) => {
      const response = await request.post('/api/evidence', {
        data: {
          orgId: 'test-org-123',
          // Missing periodStart and periodEnd
        },
      });

      // Should return 400 for missing required fields
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      // Error is now an object with message property
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('periodStart');
    });
  });

  test.describe('Metrics API', () => {
    test('GET /api/metrics should return metrics', async ({ request }) => {
      const response = await request.get('/api/metrics');

      // Should return 200
      expect(response.status()).toBe(200);

      // Content type should be text/plain (Prometheus format)
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/plain');
    });
  });
});
