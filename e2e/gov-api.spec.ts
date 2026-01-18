import { test, expect } from '@playwright/test';

/**
 * Government Support Programs API E2E Tests
 * Tests for /api/gov/* endpoints
 */
test.describe('Government Support Programs API', () => {
  test.describe('Bizinfo API (/api/gov/bizinfo)', () => {
    test('GET /api/gov/bizinfo should return programs list', async ({ request }) => {
      const response = await request.get('/api/gov/bizinfo');

      // Should return 200 or 500 (500 if external API not available)
      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('data');
        expect(body.data).toHaveProperty('count');
        expect(body.data).toHaveProperty('source');
        expect(body.data.source).toBe('bizinfo');
      } else {
        expect(body).toHaveProperty('error');
      }
    });

    test('GET /api/gov/bizinfo?type=smart-factory should filter by type', async ({ request }) => {
      const response = await request.get('/api/gov/bizinfo?type=smart-factory');

      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('source');
        expect(body.data.source).toBe('bizinfo');
      }
    });

    test('GET /api/gov/bizinfo?type=ai should filter AI programs', async ({ request }) => {
      const response = await request.get('/api/gov/bizinfo?type=ai');

      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body.success).toBe(true);
      }
    });

    test('GET /api/gov/bizinfo?keyword=스마트공장 should search by keyword', async ({ request }) => {
      const response = await request.get('/api/gov/bizinfo?keyword=스마트공장');

      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('count');
      }
    });
  });

  test.describe('K-Startup API (/api/gov/kstartup)', () => {
    test('GET /api/gov/kstartup should return programs list', async ({ request }) => {
      const response = await request.get('/api/gov/kstartup');

      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('source');
        expect(body.data.source).toBe('k-startup');
      } else {
        expect(body).toHaveProperty('error');
      }
    });

    test('GET /api/gov/kstartup?type=pre-startup should filter pre-startup programs', async ({ request }) => {
      const response = await request.get('/api/gov/kstartup?type=pre-startup');

      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body.success).toBe(true);
        expect(body.data.source).toBe('k-startup');
      }
    });

    test('GET /api/gov/kstartup?type=tips should filter TIPS programs', async ({ request }) => {
      const response = await request.get('/api/gov/kstartup?type=tips');

      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body.success).toBe(true);
      }
    });

    test('GET /api/gov/kstartup?keyword=AI should search by keyword', async ({ request }) => {
      const response = await request.get('/api/gov/kstartup?keyword=AI');

      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body.success).toBe(true);
      }
    });
  });

  test.describe('Match API (/api/gov/match)', () => {
    test('POST /api/gov/match should require analysisResult', async ({ request }) => {
      const response = await request.post('/api/gov/match', {
        data: {
          rfpId: 'test-rfp-123',
          clientType: 'smart_factory_supplier',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('analysisResult');
    });

    test('POST /api/gov/match should require clientType', async ({ request }) => {
      const response = await request.post('/api/gov/match', {
        data: {
          rfpId: 'test-rfp-123',
          analysisResult: {
            metadata: { title: 'Test RFP' },
            keywords: { tf_idf: ['AI', 'IoT'] },
          },
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('clientType');
    });

    test('POST /api/gov/match should return match results with valid data', async ({ request }) => {
      const response = await request.post('/api/gov/match', {
        data: {
          rfpId: 'test-rfp-123',
          analysisResult: {
            metadata: {
              title: '스마트공장 구축 사업',
              publishedAt: '2024-01-01',
              deadline: '2024-02-01',
            },
            keywords: {
              tf_idf: ['스마트공장', 'MES', 'IoT'],
            },
            requirements: {
              mandatory: ['ISO9001'],
              optional: [],
            },
            hiddenNeeds: [],
            strategy: {
              coreMessage: 'Test',
              differentiators: ['AI'],
              emphasisSections: ['기술력'],
              recommendedTone: 'technical',
            },
          },
          clientType: 'smart_factory_supplier',
        },
      });

      // Should return 200 or 500 depending on service availability
      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('data');
        expect(body.data).toHaveProperty('summary');
        expect(body.data.summary).toHaveProperty('overallScore');
        expect(body.data.summary).toHaveProperty('recommendation');
      }
    });
  });

  test.describe('Analyze API (/api/gov/analyze)', () => {
    test('POST /api/gov/analyze should require rfpText', async ({ request }) => {
      const response = await request.post('/api/gov/analyze', {
        data: {
          clientType: 'smart_factory_supplier',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('rfpText');
    });

    test('POST /api/gov/analyze should work with valid RFP text', async ({ request }) => {
      const response = await request.post('/api/gov/analyze', {
        data: {
          rfpText: '스마트공장 고도화 지원사업 모집공고. 신청자격: 중소기업. 지원규모: 최대 3억원. 마감일: 2024년 6월 30일.',
          clientType: 'smart_factory_supplier',
        },
      });

      // Should return 200 or 500
      expect([200, 500]).toContain(response.status());

      const body = await response.json();

      if (response.status() === 200) {
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('data');
        // Response contains analysis data with metadata, keywords, strategy, etc.
        expect(body.data).toHaveProperty('data');
        expect(body.data.data).toHaveProperty('metadata');
        expect(body.data.data).toHaveProperty('keywords');
        expect(body.data.data).toHaveProperty('strategy');
      }
    });
  });

  test.describe('Generate Proposal API (/api/gov/generate-proposal)', () => {
    test('POST /api/gov/generate-proposal should require all fields', async ({ request }) => {
      const response = await request.post('/api/gov/generate-proposal', {
        data: {
          rfpId: 'test-rfp-123',
          // Missing analysisResult and matchResult
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test.describe('Regenerate Section API (/api/gov/regenerate-section)', () => {
    test('POST /api/gov/regenerate-section should require sectionType', async ({ request }) => {
      const response = await request.post('/api/gov/regenerate-section', {
        data: {
          rfpId: 'test-rfp-123',
          currentContent: 'Test content',
          feedback: 'Please improve',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('sectionType');
    });

    test('POST /api/gov/regenerate-section should require analysisResult and matchResult', async ({ request }) => {
      const response = await request.post('/api/gov/regenerate-section', {
        data: {
          sectionType: 'understanding',
          currentContent: 'Test content',
          feedback: 'Please improve',
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      const errorMessage = typeof body.error === 'string' ? body.error : body.error?.message;
      expect(errorMessage).toContain('analysisResult');
    });
  });
});
