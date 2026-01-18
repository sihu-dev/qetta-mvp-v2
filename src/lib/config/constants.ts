/**
 * Application Constants
 * Centralized configuration values
 */

import type { CompanyProfile } from '@/lib/tender/analyzers';

// =============================================================================
// Demo/Default Company Profile
// =============================================================================

/**
 * Default company profile for demo and testing
 * Used when no company profile is provided in API requests
 */
export const DEMO_COMPANY_PROFILE: CompanyProfile = {
  business_number: '123-45-67890',
  company_name: 'Demo Company',
  certifications: ['ISO9001', 'ISO27001', '중소기업'],
  experience_years: 5,
  past_wins: 10,
  revenue: 5_000_000_000, // 50억
  employee_count: 30,
  specializations: ['스마트팩토리', 'IoT', '데이터분석'],
} as const;

// =============================================================================
// Budget Ranges (for simulation and categorization)
// =============================================================================

export const BUDGET_RANGES = {
  /** 소규모: 1억 미만 */
  SMALL: {
    min: 0,
    max: 100_000_000,
    label: '소규모',
  },
  /** 중규모: 1억 ~ 5억 */
  MEDIUM: {
    min: 100_000_000,
    max: 500_000_000,
    label: '중규모',
  },
  /** 대규모: 5억 ~ 10억 */
  LARGE: {
    min: 500_000_000,
    max: 1_000_000_000,
    label: '대규모',
  },
  /** 초대규모: 10억 이상 */
  ENTERPRISE: {
    min: 1_000_000_000,
    max: Infinity,
    label: '초대규모',
  },
} as const;

/**
 * Get budget category label from amount
 */
export function getBudgetCategory(amount: number): string {
  if (amount < BUDGET_RANGES.SMALL.max) return BUDGET_RANGES.SMALL.label;
  if (amount < BUDGET_RANGES.MEDIUM.max) return BUDGET_RANGES.MEDIUM.label;
  if (amount < BUDGET_RANGES.LARGE.max) return BUDGET_RANGES.LARGE.label;
  return BUDGET_RANGES.ENTERPRISE.label;
}

// =============================================================================
// Simulation Constants
// =============================================================================

export const SIMULATION = {
  /** 기본 시뮬레이션 예산 범위 */
  DEFAULT_BUDGET_MIN: 100_000_000, // 1억
  DEFAULT_BUDGET_MAX: 1_000_000_000, // 10억
  /** 기본 마감일 범위 (일) */
  DEFAULT_DEADLINE_MIN_DAYS: 7,
  DEFAULT_DEADLINE_MAX_DAYS: 67,
} as const;

// =============================================================================
// API Limits (re-export from validators for convenience)
// =============================================================================

export { PAGINATION } from '@/lib/api/validators';
