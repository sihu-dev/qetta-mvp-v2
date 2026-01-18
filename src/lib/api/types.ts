/**
 * API Response Types
 * Shared type definitions for API responses
 */

// ============================================================
// Evidence Types
// ============================================================

export interface EvidenceRecord {
  id: string;
  org_id: string;
  package_id: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  manifest_version: string;
  metadata: {
    project_id?: string;
    project_name?: string;
    created_by?: string;
    tags?: string[];
  };
  status: 'pending' | 'verified' | 'failed';
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EvidencePackage {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  manifest: {
    version: string;
    files: Array<{
      name: string;
      hash: string;
      size: number;
    }>;
    signature?: string;
  };
  status: 'draft' | 'sealed' | 'submitted';
  created_at: string;
  sealed_at?: string;
}

export interface EvidenceListResponse {
  records: EvidenceRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EvidenceVerifyResponse {
  valid: boolean;
  hash: string;
  timestamp: string;
  details?: {
    manifest_check: boolean;
    hash_check: boolean;
    signature_check?: boolean;
  };
}

// ============================================================
// Tender Types
// ============================================================

export type TenderSource = 'g2b' | 'ungm' | 'sam' | 'kz';
export type TenderStatus = 'open' | 'closed' | 'cancelled' | 'awarded';

export interface TenderRecord {
  id: string;
  org_id: string;
  source: TenderSource;
  external_id: string;
  title: string;
  description?: string;
  buyer: {
    name: string;
    country?: string;
    agency?: string;
  };
  budget?: {
    amount: number;
    currency: string;
  };
  deadline: string;
  published_at: string;
  status: TenderStatus;
  category?: string;
  keywords?: string[];
  url?: string;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  fit_score?: number;
  fit_grade?: string;
  created_at: string;
  updated_at: string;
}

export interface QualificationCheck {
  requirement: string;
  met: boolean;
  note?: string;
}

export interface RequiredDocument {
  name: string;
  format: string[];
  mandatory: boolean;
  deadline?: string;
}

export type CompetitionLevel = 'low' | 'medium' | 'high';

export interface TenderAnalysis {
  id: string;
  tender_id: string;
  fit_score: number;
  fit_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  scores: {
    qualification: number;
    financial: number;
    experience: number;
    expertise: number;
    timing: number;
    competition: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  qualifications_met?: QualificationCheck[];
  required_documents?: RequiredDocument[];
  competition_level?: CompetitionLevel;
  win_probability?: number;
  competitor_count?: number;
  market_insights?: string[];
  created_at: string;
}

export interface TenderListResponse {
  tenders: TenderRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TenderCollectRequest {
  sources: TenderSource[];
  keywords?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  budgetRange?: {
    min?: number;
    max?: number;
  };
}

export interface TenderCollectResponse {
  collected: number;
  bySource: Record<TenderSource, number>;
  newRecords: number;
  updatedRecords: number;
}

export interface TenderAnalyzeRequest {
  tenderId: string;
  companyProfile?: {
    name: string;
    expertise?: string[];
    experience?: string[];
    certifications?: string[];
  };
}

// ============================================================
// AGI Types (3-Tier Intelligence)
// ============================================================

export type AGITier = 1 | 2 | 3;

export interface AGIPrediction {
  id: string;
  type: 'quality' | 'maintenance' | 'anomaly';
  tier_used: AGITier;
  confidence: number;
  prediction: {
    value: unknown;
    timestamp: string;
    horizon?: string;
  };
  explanation?: string;
  factors?: Array<{
    name: string;
    weight: number;
    value: unknown;
  }>;
  created_at: string;
}

export interface AGIReasoningRequest {
  context: string;
  query: string;
  tier?: AGITier;
  max_tokens?: number;
}

export interface AGIReasoningResponse {
  response: string;
  tier_used: AGITier;
  tokens_used?: number;
  reasoning_time_ms: number;
}

export interface AGIPredictionRequest {
  equipment_id: string;
  prediction_type: 'quality' | 'maintenance' | 'anomaly';
  horizon_hours?: number;
  include_factors?: boolean;
}

export interface AGIStatsResponse {
  total_predictions: number;
  by_tier: Record<AGITier, number>;
  by_type: {
    quality: number;
    maintenance: number;
    anomaly: number;
  };
  accuracy: {
    overall: number;
    by_type: {
      quality: number;
      maintenance: number;
      anomaly: number;
    };
  };
  cost_savings: {
    tier1_vs_tier3: number;
    estimated_monthly: number;
  };
}

// ============================================================
// Dashboard/Metrics Types
// ============================================================

export interface DashboardMetrics {
  evidence: {
    total: number;
    verified: number;
    pending: number;
    storage_used_mb: number;
  };
  tender: {
    total: number;
    active: number;
    analyzed: number;
    won: number;
    avg_fit_score: number;
  };
  agi: {
    predictions_today: number;
    accuracy_rate: number;
    cost_today: number;
    tier_distribution: Record<AGITier, number>;
  };
  activity: {
    recent_uploads: number;
    recent_analyses: number;
    recent_predictions: number;
  };
  // Additional metrics for developer dashboard
  health_status?: 'healthy' | 'degraded' | 'unhealthy';
  active_connections?: number;
  total_tenders?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    storage: 'up' | 'down';
    ai: 'up' | 'down';
  };
  latency_ms: number;
}

// ============================================================
// Common Types
// ============================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListParams extends PaginationParams, FilterParams {}
