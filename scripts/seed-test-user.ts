/**
 * E2E 테스트용 사용자 생성 스크립트
 *
 * 실행: npx tsx scripts/seed-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const TEST_USER = {
  email: 'test@qetta.dev',
  password: 'TestPassword123',
  display_name: 'E2E Test User',
};

async function seedTestUser() {
  console.log('🔧 Supabase 테스트 사용자 생성 시작...');
  console.log(`   URL: ${SUPABASE_URL}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. 기존 사용자 확인
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ 사용자 목록 조회 실패:', listError.message);
    process.exit(1);
  }

  const existingUser = existingUsers.users.find(u => u.email === TEST_USER.email);

  if (existingUser) {
    console.log('✅ 테스트 사용자가 이미 존재합니다.');
    console.log(`   ID: ${existingUser.id}`);
    console.log(`   Email: ${existingUser.email}`);
    return;
  }

  // 2. 새 사용자 생성
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true, // 이메일 인증 건너뛰기
    user_metadata: {
      display_name: TEST_USER.display_name,
    },
  });

  if (createError) {
    console.error('❌ 사용자 생성 실패:', createError.message);
    process.exit(1);
  }

  console.log('✅ 테스트 사용자 생성 완료!');
  console.log(`   ID: ${newUser.user.id}`);
  console.log(`   Email: ${newUser.user.email}`);
  console.log(`   Password: ${TEST_USER.password}`);
}

seedTestUser().catch(console.error);
