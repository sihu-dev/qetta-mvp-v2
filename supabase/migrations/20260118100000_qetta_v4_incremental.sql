-- ============================================================
-- Qetta v4.0 Incremental Migration
-- Adds new tables while preserving existing schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add new columns to orgs (don't rename to preserve references)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'business_number') THEN
    ALTER TABLE orgs ADD COLUMN business_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'address') THEN
    ALTER TABLE orgs ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'representative') THEN
    ALTER TABLE orgs ADD COLUMN representative TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'phone') THEN
    ALTER TABLE orgs ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'email') THEN
    ALTER TABLE orgs ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orgs' AND column_name = 'settings') THEN
    ALTER TABLE orgs ADD COLUMN settings JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add new columns to events
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'source') THEN
    ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'sensor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'metadata') THEN
    ALTER TABLE events ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add new columns to actions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'actions' AND column_name = 'priority') THEN
    ALTER TABLE actions ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'actions' AND column_name = 'created_by') THEN
    ALTER TABLE actions ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add role column to org_members if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'org_members' AND column_name = 'role') THEN
    ALTER TABLE org_members ADD COLUMN role TEXT DEFAULT 'member';
  END IF;
END $$;

-- ============================================================
-- CREATE NEW TABLES: Evidence Registry
-- ============================================================

-- Evidence Snapshots (Immutable)
CREATE TABLE IF NOT EXISTS evidence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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
  created_by UUID REFERENCES auth.users(id),
  retention_until TIMESTAMPTZ NOT NULL,
  CONSTRAINT unique_snapshot_path UNIQUE (storage_path)
);

-- ============================================================
-- CREATE NEW TABLES: AGI Memory System
-- ============================================================

-- Memory Entries (Vector Search)
CREATE TABLE IF NOT EXISTS memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event', 'action', 'insight', 'learning')),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  relations JSONB DEFAULT '{}',
  decay JSONB DEFAULT '{"importance": 1.0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGI Insights
CREATE TABLE IF NOT EXISTS agi_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('reasoning', 'prediction', 'anomaly', 'recommendation')),
  content TEXT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  tier TEXT NOT NULL CHECK (tier IN ('rule', 'ml', 'claude')),
  related_event_ids UUID[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CREATE NEW TABLES: Tender Module (Secondary)
-- ============================================================

-- Bids (Tender Collection)
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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

-- Evidence snapshots indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_org_id ON evidence_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON evidence_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_period ON evidence_snapshots(period_start, period_end);

-- Memory indexes (IVFFlat for vector search) - only if data exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memory_org_id') THEN
    CREATE INDEX idx_memory_org_id ON memory_entries(org_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memory_type') THEN
    CREATE INDEX idx_memory_type ON memory_entries(type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memory_metadata') THEN
    CREATE INDEX idx_memory_metadata ON memory_entries USING gin(metadata);
  END IF;
END $$;

-- Bids indexes
CREATE INDEX IF NOT EXISTS idx_bids_org_id ON bids(org_id);
CREATE INDEX IF NOT EXISTS idx_bids_source ON bids(source);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_deadline ON bids(deadline);
CREATE INDEX IF NOT EXISTS idx_bids_fit_score ON bids(fit_score DESC NULLS LAST);

-- Generated documents indexes
CREATE INDEX IF NOT EXISTS idx_docs_org_id ON generated_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_docs_bid_id ON generated_documents(bid_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON generated_documents(doc_type);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE evidence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agi_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Evidence snapshots policies (immutable - no delete)
DROP POLICY IF EXISTS "Members can view snapshots" ON evidence_snapshots;
CREATE POLICY "Members can view snapshots" ON evidence_snapshots
  FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "Admins can create snapshots" ON evidence_snapshots;
CREATE POLICY "Admins can create snapshots" ON evidence_snapshots
  FOR INSERT WITH CHECK (is_org_admin(org_id));

-- Memory entries policies
DROP POLICY IF EXISTS "Members can view memories" ON memory_entries;
CREATE POLICY "Members can view memories" ON memory_entries
  FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "Members can manage memories" ON memory_entries;
CREATE POLICY "Members can manage memories" ON memory_entries
  FOR ALL USING (is_org_member(org_id));

-- AGI insights policies
DROP POLICY IF EXISTS "Members can view insights" ON agi_insights;
CREATE POLICY "Members can view insights" ON agi_insights
  FOR SELECT USING (is_org_member(org_id));

-- Bids policies
DROP POLICY IF EXISTS "Members can view bids" ON bids;
CREATE POLICY "Members can view bids" ON bids
  FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "Members can manage bids" ON bids;
CREATE POLICY "Members can manage bids" ON bids
  FOR ALL USING (is_org_member(org_id));

-- Bid analyses policies
DROP POLICY IF EXISTS "Members can view analyses" ON bid_analyses;
CREATE POLICY "Members can view analyses" ON bid_analyses
  FOR SELECT USING (is_org_member(org_id));

-- Generated documents policies
DROP POLICY IF EXISTS "Members can view documents" ON generated_documents;
CREATE POLICY "Members can view documents" ON generated_documents
  FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "Members can create documents" ON generated_documents;
CREATE POLICY "Members can create documents" ON generated_documents
  FOR INSERT WITH CHECK (is_org_member(org_id));

-- ============================================================
-- FUNCTIONS
-- ============================================================

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
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > similarity_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger for memory_entries updated_at
DROP TRIGGER IF EXISTS memory_updated_at ON memory_entries;
CREATE TRIGGER memory_updated_at BEFORE UPDATE ON memory_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger for bids updated_at
DROP TRIGGER IF EXISTS bids_updated_at ON bids;
CREATE TRIGGER bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE evidence_snapshots IS 'Immutable Gov ZIP snapshots for evidence registry (MANIFEST v1.2)';
COMMENT ON TABLE memory_entries IS 'AGI Memory System with vector embeddings for semantic search';
COMMENT ON TABLE agi_insights IS 'AGI-generated insights using 3-tier intelligence';
COMMENT ON TABLE bids IS 'Tender bid collection from multiple sources (g2b, ungm, sam, kz)';
COMMENT ON TABLE bid_analyses IS 'AI-powered bid analysis results';
COMMENT ON TABLE generated_documents IS 'Generated documents (DOCX, XLSX, PPTX, PDF, ZIP)';

-- ============================================================
-- CREATE VIEW: organizations (alias for orgs)
-- ============================================================

CREATE OR REPLACE VIEW organizations AS
SELECT
  id,
  name,
  slug,
  business_number,
  address,
  representative,
  phone,
  email,
  settings,
  created_at,
  updated_at
FROM orgs;

-- Grant permissions on view
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON organizations TO anon;
