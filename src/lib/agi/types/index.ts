/**
 * Qetta AGI Module Types
 * Core type definitions for the 3-Tier Intelligence System
 */

// ═══════════════════════════════════════════════════════════
// 기본 타입
// ═══════════════════════════════════════════════════════════

export interface AGIModule {
  name: string;
  version: string;
  execute(context: ExecutionContext): Promise<ModuleResult>;
}

/**
 * Execution Configuration - AGI 모듈 실행 설정
 */
export interface ExecutionConfig {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  retryCount?: number;
  confidenceThreshold?: number;
  enableCaching?: boolean;
  model?: string;
  tierOverride?: Tier;
}

export interface ExecutionContext {
  orgId: string;
  userId: string;
  input: unknown;
  config?: ExecutionConfig;
}

/**
 * Module Result Metadata - AGI 모듈 실행 결과 메타데이터
 */
export interface ModuleResultMetadata {
  executionTime: number;
  tokensUsed?: number;
  tier: Tier;
  cached?: boolean;
  modelUsed?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalCost?: number;
}

export interface ModuleResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: ModuleResultMetadata;
}

export type Tier = 'rule' | 'ml' | 'claude';

// ═══════════════════════════════════════════════════════════
// Event & Action 타입 (SSOT)
// ═══════════════════════════════════════════════════════════

/**
 * Event Metadata - 이벤트 관련 추가 정보
 */
export interface EventMetadata {
  sensorId?: string;
  sensorType?: string;
  measurementValue?: number;
  measurementUnit?: string;
  threshold?: {
    min?: number;
    max?: number;
    warning?: number;
    critical?: number;
  };
  location?: {
    zone?: string;
    line?: string;
    station?: string;
  };
  correlatedEvents?: string[];
  tags?: string[];
  [key: string]: unknown;
}

export interface Event {
  id: string;
  occurred_at: string;
  asset_id: string;
  event_type: 'status' | 'alarm' | 'measurement';
  machine_state: 'running' | 'idle' | 'stopped' | 'error';
  alarm_active: boolean;
  alarm_code: string | null;
  source: 'sensor' | 'plc' | 'manual' | 'csv_import';
  metadata?: EventMetadata;
}

export interface Action {
  id: string;
  event_id: string;
  status: 'open' | 'in_progress' | 'completed' | 'deferred';
  priority: 'low' | 'medium' | 'high' | 'critical';
  note: string;
  photo_paths: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════
// Memory 타입
// ═══════════════════════════════════════════════════════════

export type MemoryType = 'event' | 'action' | 'insight' | 'learning';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  embedding: number[]; // 1536 dimensions
  metadata: {
    assetId?: string;
    eventId?: string;
    timestamp: string;
    tags?: string[];
  };
  relations?: {
    causes?: string[];
    follows?: string[];
    similar?: string[];
  };
  decay: {
    importance: number; // 0-1
    lastAccessed: string;
  };
}

// ═══════════════════════════════════════════════════════════
// Reasoning 타입
// ═══════════════════════════════════════════════════════════

export type ReasoningMode = 'deductive' | 'inductive' | 'abductive' | 'analogical';

export interface ReasoningChain {
  mode: ReasoningMode;
  steps: ReasoningStep[];
  conclusion: string;
  confidence: number;
  evidence: string[];
}

export interface ReasoningStep {
  premise: string;
  inference: string;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════
// Prediction 타입
// ═══════════════════════════════════════════════════════════

export type PredictionTarget =
  | 'uptime'
  | 'quality'
  | 'throughput'
  | 'energy'
  | 'defect'
  | 'maintenance';

export interface Prediction {
  target: PredictionTarget;
  horizon: string;
  value: number;
  confidence: number;
  bounds: {
    lower: number;
    upper: number;
  };
}

export type AnomalyType = 'point' | 'contextual' | 'collective' | 'trend' | 'seasonal';

export interface Anomaly {
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  relatedEvents: string[];
}

// ═══════════════════════════════════════════════════════════
// Tech Combiner 타입 (핵심!)
// ═══════════════════════════════════════════════════════════

export interface BusinessRequirement {
  projectType: string;
  budget: number;
  timeline: string;
  teamExperience: {
    frontend?: number;
    backend?: number;
    devops?: number;
    ai?: number;
  };
  constraints: string[];
  priorities: ('cost' | 'speed' | 'scalability' | 'security')[];
}

export interface TechCombination {
  id: string;
  name: string;
  technologies: {
    frontend: string[];
    backend: string[];
    database: string[];
    infra: string[];
    ai?: string[];
  };
  scores: {
    businessFit: number;
    technicalExcellence: number;
    costEfficiency: number;
    risk: number;
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  costAnalysis: {
    initial: number;
    monthly: number;
    annual: number;
  };
  risks: Array<{
    description: string;
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  implementationRoadmap: Array<{
    phase: number;
    weeks: number;
    tasks: string[];
  }>;
}

export interface TechRecommendation {
  combinations: TechCombination[];
  bestChoice: string;
  reasoning: string;
}

// ═══════════════════════════════════════════════════════════
// Escalation 타입
// ═══════════════════════════════════════════════════════════

export interface EscalationResult {
  tier: Tier;
  confidence: number;
  result: unknown;
}

export const CONFIDENCE_THRESHOLD = 0.7;
export const API_COST_LIMIT_ANNUAL = 6_000_000; // ₩6M/년
export const API_COST_LIMIT_MONTHLY = 500_000; // ₩500K/월
