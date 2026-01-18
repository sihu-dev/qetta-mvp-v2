-- ============================================================
-- Qetta v4.0 Complete Database Schema
-- MANIFEST v1.2 | Evidence + Tender | AGI 3-Tier
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- CORE TABLES: Organizations & Users
-- ============================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_number TEXT,
  address TEXT,
  representative TEXT,
  phone TEXT,
  email TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ============================================================
-- EVIDENCE TABLES: Events & Actions (SSOT)
-- ============================================================

-- Events (MVTS - Machine Value Time Series)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  asset_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('status', 'alarm', 'measurement')),
  machine_state TEXT NOT NULL CHECK (machine_state IN ('running', 'idle', 'stopped', 'error')),
  alarm_active BOOLEAN DEFAULT FALSE,
  alarm_code TEXT,
  source TEXT NOT NULL CHECK (source IN ('sensor', 'plc', 'manual', 'csv_import')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actions (B2 - Business to Operations)
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'deferred')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  note TEXT,
  photo_paths TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVIDENCE REGISTRY: Gov ZIP Snapshots
-- ============================================================

-- Evidence Snapshots (Immutable)
CREATE TABLE IF NOT EXISTS evidence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gov_zip_hash TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  package_hash TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  event_count INT NOT NULL DEFAULT 0,
  action_count INT NOT NULL DEFAULT 0,
  alarm_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  retention_until TIMESTAMPTZ NOT NULL,
  CONSTRAINT unique_snapshot_path UNIQUE (storage_path)
);

-- ============================================================
-- AGI TABLES: Memory, Insights
-- ============================================================

-- Memory Entries (Vector Search)
CREATE TABLE IF NOT EXISTS memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event', 'action', 'insight', 'learning')),
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}',
  relations JSONB DEFAULT '{}',
  decay JSONB DEFAULT '{"importance": 1.0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGI Insights
CREATE TABLE IF NOT EXISTS agi_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('reasoning', 'prediction', 'anomaly', 'recommendation')),
  content TEXT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  tier TEXT NOT NULL CHECK (tier IN ('rule', 'ml', 'claude')),
  related_event_ids UUID[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TENDER TABLES: Bids & Documents (Secondary)
-- ============================================================

-- Bids (Tender Collection)
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('g2b', 'ungm', 'sam', 'kz')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget BIGINT,
  currency TEXT DEFAULT 'KRW',
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'analyzing', 'interested', 'applied', 'won', 'lost', 'expired')),
  fit_score INT CHECK (fit_score >= 0 AND fit_score <= 100),
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, external_id)
);

-- Bid Analyses
CREATE TABLE IF NOT EXISTS bid_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  qualifications_met JSONB DEFAULT '[]',
  required_documents JSONB DEFAULT '[]',
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  win_probability INT CHECK (win_probability >= 0 AND win_probability <= 100),
  recommendations JSONB DEFAULT '[]',
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Documents
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('proposal', 'quotation', 'presentation', 'package', 'evidence')),
  format TEXT NOT NULL CHECK (format IN ('docx', 'xlsx', 'pptx', 'pdf', 'zip')),
  file_path TEXT NOT NULL,
  file_size INT,
  metadata JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Events indexes
CREATE INDEX idx_events_org_id ON events(org_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at DESC);
CREATE INDEX idx_events_asset_id ON events(asset_id);
CREATE INDEX idx_events_alarm_active ON events(alarm_active) WHERE alarm_active = true;
CREATE INDEX idx_events_metadata ON events USING gin(metadata);

-- Actions indexes
CREATE INDEX idx_actions_org_id ON actions(org_id);
CREATE INDEX idx_actions_event_id ON actions(event_id);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_created_at ON actions(created_at DESC);

-- Evidence snapshots indexes
CREATE INDEX idx_snapshots_org_id ON evidence_snapshots(org_id);
CREATE INDEX idx_snapshots_created_at ON evidence_snapshots(created_at DESC);
CREATE INDEX idx_snapshots_period ON evidence_snapshots(period_start, period_end);

-- Memory indexes (IVFFlat for vector search)
CREATE INDEX idx_memory_embedding ON memory_entries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX idx_memory_org_id ON memory_entries(org_id);
CREATE INDEX idx_memory_type ON memory_entries(type);
CREATE INDEX idx_memory_metadata ON memory_entries USING gin(metadata);

-- Bids indexes
CREATE INDEX idx_bids_org_id ON bids(org_id);
CREATE INDEX idx_bids_source ON bids(source);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_deadline ON bids(deadline);
CREATE INDEX idx_bids_fit_score ON bids(fit_score DESC NULLS LAST);

-- Generated documents indexes
CREATE INDEX idx_docs_org_id ON generated_documents(org_id);
CREATE INDEX idx_docs_bid_id ON generated_documents(bid_id);
CREATE INDEX idx_docs_type ON generated_documents(doc_type);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Helper function: Check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = target_org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check org admin/manager
CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = target_org_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Members can view their org" ON organizations
  FOR SELECT USING (public.is_org_member(id));

-- Org members policies
CREATE POLICY "Members can view org members" ON org_members
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Admins can manage org members" ON org_members
  FOR ALL USING (public.is_org_admin(org_id));

-- Events policies
CREATE POLICY "Members can view org events" ON events
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Members can insert org events" ON events
  FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- Actions policies
CREATE POLICY "Members can view org actions" ON actions
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Members can manage org actions" ON actions
  FOR ALL USING (public.is_org_member(org_id));

-- Evidence snapshots policies (immutable - no delete)
CREATE POLICY "Members can view snapshots" ON evidence_snapshots
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Admins can create snapshots" ON evidence_snapshots
  FOR INSERT WITH CHECK (public.is_org_admin(org_id));

-- Memory entries policies
CREATE POLICY "Members can view memories" ON memory_entries
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Members can manage memories" ON memory_entries
  FOR ALL USING (public.is_org_member(org_id));

-- AGI insights policies
CREATE POLICY "Members can view insights" ON agi_insights
  FOR SELECT USING (public.is_org_member(org_id));

-- Bids policies
CREATE POLICY "Members can view bids" ON bids
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Members can manage bids" ON bids
  FOR ALL USING (public.is_org_member(org_id));

-- Bid analyses policies
CREATE POLICY "Members can view analyses" ON bid_analyses
  FOR SELECT USING (public.is_org_member(org_id));

-- Generated documents policies
CREATE POLICY "Members can view documents" ON generated_documents
  FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Members can create documents" ON generated_documents
  FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER actions_updated_at BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER memory_updated_at BEFORE UPDATE ON memory_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int,
  filter_org_id uuid,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  content TEXT,
  metadata JSONB,
  relations JSONB,
  decay JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.type,
    m.content,
    m.metadata,
    m.relations,
    m.decay,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memory_entries m
  WHERE
    m.org_id = filter_org_id
    AND (filter_type IS NULL OR m.type = filter_type)
    AND 1 - (m.embedding <=> query_embedding) > similarity_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE events IS 'MVTS - Machine Value Time Series (SSOT)';
COMMENT ON TABLE actions IS 'B2 - Business to Operations actions';
COMMENT ON TABLE evidence_snapshots IS 'Immutable Gov ZIP snapshots for evidence registry';
COMMENT ON TABLE memory_entries IS 'AGI Memory System with vector embeddings';
COMMENT ON TABLE bids IS 'Tender bid collection from multiple sources';
