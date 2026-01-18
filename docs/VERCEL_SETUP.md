# Vercel 환경 변수 설정 가이드

## 1. Supabase API 키 확인

1. [Supabase Dashboard](https://supabase.com/dashboard/project/lryxykhbaisdkqhrkbpm/settings/api) 접속
2. **Project URL** 및 **API Keys** 섹션 확인

## 2. Vercel 환경 변수 설정

[Vercel Dashboard](https://vercel.com/sihu-devs-projects/qetta-mvp-v2/settings/environment-variables) 접속 후 아래 변수 추가:

### 필수 변수 (Supabase)

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lryxykhbaisdkqhrkbpm.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (Supabase Dashboard에서 복사) | 공개 익명 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (Supabase Dashboard에서 복사) | 서비스 역할 키 (서버 전용) |

### 필수 변수 (AI)

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API 키 |

### 선택 변수 (정부 API)

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `G2B_API_KEY` | 나라장터 API 키 | 입찰 공고 수집 |
| `KSTARTUP_API_KEY` | K-Startup API 키 | 창업지원사업 공고 |
| `BIZINFO_API_KEY` | 기업마당 API 키 | 중기부 지원사업 |
| `N8N_API_KEY` | n8n API 키 | 워크플로우 자동화 |
| `N8N_BASE_URL` | n8n 인스턴스 URL | 워크플로우 자동화 |

## 3. 환경별 설정

Vercel에서 각 변수에 대해 환경 선택:
- **Production**: 프로덕션 배포용
- **Preview**: PR 미리보기용
- **Development**: 로컬 개발용 (선택)

권장 설정:
- `NEXT_PUBLIC_*` 변수: 모든 환경
- `SUPABASE_SERVICE_ROLE_KEY`: Production, Preview만
- `ANTHROPIC_API_KEY`: Production, Preview만

## 4. Supabase 마이그레이션 실행

마이그레이션 파일이 준비되어 있습니다:
- `supabase/migrations/20260118000001_user_profiles.sql`
- `supabase/migrations/20260118000002_api_logs.sql`

### 방법 1: Supabase CLI

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref lryxykhbaisdkqhrkbpm

# 마이그레이션 실행
supabase db push
```

### 방법 2: SQL Editor (수동)

1. [Supabase SQL Editor](https://supabase.com/dashboard/project/lryxykhbaisdkqhrkbpm/sql) 접속
2. `20260118000001_user_profiles.sql` 내용 복사 → 실행
3. `20260118000002_api_logs.sql` 내용 복사 → 실행

## 5. 배포 확인

1. Vercel Dashboard에서 **Redeploy** 클릭
2. 빌드 로그에서 환경 변수 로드 확인
3. 배포 완료 후 https://qetta-mvp-v2.vercel.app 접속 테스트

## 트러블슈팅

### 빌드 실패: "Missing Supabase environment variables"
→ `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인

### 런타임 오류: "Invalid API key"
→ Supabase Dashboard에서 키 재확인, 복사 시 공백 제거

### 인증 오류: "No session"
→ 마이그레이션 실행 여부 확인, `user_profiles` 테이블 존재 확인

---

*Updated: 2026-01-18*
