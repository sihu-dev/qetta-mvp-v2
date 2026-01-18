import { test as setup } from '@playwright/test';
import path from 'path';

/**
 * E2E 테스트 인증 셋업
 *
 * E2E 테스트는 X-E2E-Test-Token 헤더를 통해 인증을 우회합니다.
 * 이 셋업은 빈 storageState만 생성합니다.
 */

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ context }) => {
  console.log('[Auth Setup] Creating storage state for E2E tests...');
  console.log('[Auth Setup] Authentication will be bypassed via X-E2E-Test-Token header');

  // 빈 storage state 저장 (헤더 기반 인증 우회 사용)
  await context.storageState({ path: authFile });

  console.log('[Auth Setup] Storage state saved to:', authFile);
});

setup.describe.configure({ mode: 'serial' });
