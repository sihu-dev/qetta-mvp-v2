-- ============================================================
-- Qetta v4.1 Auth Profiles & API Logs
-- Phase 1: Authentication System
-- ============================================================

-- ============================================================
-- USER PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  system_role TEXT NOT NULL DEFAULT 'user'
    CHECK (system_role IN ('user', 'developer', 'admin')),
  display_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{
    "language": "ko",
    "timezone": "Asia/Seoul",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  }'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- API LOGS TABLE (Developer Dashboard)
-- ============================================================

CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  path TEXT NOT NULL,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  request_body JSONB,
  response_summary JSONB,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_user_profiles_role ON user_profiles(system_role);
CREATE INDEX idx_user_profiles_updated ON user_profiles(updated_at DESC);

CREATE INDEX idx_api_logs_user ON api_logs(user_id);
CREATE INDEX idx_api_logs_org ON api_logs(org_id);
CREATE INDEX idx_api_logs_path ON api_logs(path);
CREATE INDEX idx_api_logs_status ON api_logs(status_code);
CREATE INDEX idx_api_logs_created ON api_logs(created_at DESC);

-- Partial index for errors only
CREATE INDEX idx_api_logs_errors ON api_logs(created_at DESC)
  WHERE status_code >= 400;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- User can read/update own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND system_role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND system_role = 'admin'
    )
  );

-- Users can view own API logs
CREATE POLICY "Users can view own API logs"
  ON api_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Developers/Admins can view all API logs
CREATE POLICY "Developers can view all API logs"
  ON api_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND system_role IN ('developer', 'admin')
    )
  );

-- Service role can insert API logs
CREATE POLICY "Service can insert API logs"
  ON api_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update last login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Get user role
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT system_role FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Check if user is developer or admin
CREATE OR REPLACE FUNCTION auth.is_developer_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT system_role IN ('developer', 'admin')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT system_role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
