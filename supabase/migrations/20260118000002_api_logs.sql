-- Migration: Create api_logs table for developer dashboard
-- Created: 2026-01-18

-- api_logs 테이블 (개발자 대시보드용)
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  request_body JSONB,
  response_summary TEXT,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs" ON public.api_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Developers can view all logs
CREATE POLICY "Developers can view all logs" ON public.api_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND system_role IN ('developer', 'admin')
    )
  );

-- Policy: System can insert logs (via service role)
CREATE POLICY "System can insert logs" ON public.api_logs
  FOR INSERT WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_path ON public.api_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON public.api_logs(status_code);

-- Partial index for errors only
CREATE INDEX IF NOT EXISTS idx_api_logs_errors ON public.api_logs(created_at DESC)
  WHERE status_code >= 400;

-- Auto-cleanup old logs (keep 90 days)
-- This can be run as a scheduled job via pg_cron or n8n
CREATE OR REPLACE FUNCTION public.cleanup_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE public.api_logs IS 'API request logs for developer dashboard analytics';
