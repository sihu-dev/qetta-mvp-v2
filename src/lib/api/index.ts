/**
 * API Module Exports
 */

export { api, apiRequest } from './client';
export type { APIError, APIResponse } from './client';

export { parseJson } from './parse-json';
export type { ParseJsonResult, ParseJsonError, ParseJsonReturn } from './parse-json';

export {
  safeParseInt,
  parseLimit,
  parseOffset,
  validateRequired,
  validateEnum,
  validateDateString,
  validatePositiveNumber,
  PAGINATION,
} from './validators';
export type { ParseIntOptions, ParseLimitOptions } from './validators';

export type {
  // Evidence
  EvidenceRecord,
  EvidencePackage,
  EvidenceListResponse,
  EvidenceVerifyResponse,
  // Tender
  TenderSource,
  TenderStatus,
  TenderRecord,
  TenderAnalysis,
  TenderListResponse,
  TenderCollectRequest,
  TenderCollectResponse,
  TenderAnalyzeRequest,
  // AGI
  AGITier,
  AGIPrediction,
  AGIReasoningRequest,
  AGIReasoningResponse,
  AGIPredictionRequest,
  AGIStatsResponse,
  // Dashboard
  DashboardMetrics,
  HealthCheckResponse,
  // Common
  PaginationParams,
  FilterParams,
  ListParams,
} from './types';
