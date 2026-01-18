/**
 * Input Validation Utilities
 * Safe parsing and bounds checking for API inputs
 */

// =============================================================================
// Types
// =============================================================================

export interface ParseIntOptions {
  /** Default value if parsing fails or value is out of bounds */
  defaultValue: number;
  /** Minimum allowed value (inclusive) */
  min?: number;
  /** Maximum allowed value (inclusive) */
  max?: number;
}

export interface ParseLimitOptions {
  /** Default limit if not provided or invalid */
  defaultLimit?: number;
  /** Maximum allowed limit */
  maxLimit?: number;
}

// =============================================================================
// Constants
// =============================================================================

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// =============================================================================
// Validators
// =============================================================================

/**
 * Safely parse an integer with bounds checking
 * Returns defaultValue if parsing fails or value is out of bounds
 */
export function safeParseInt(
  value: string | null | undefined,
  options: ParseIntOptions
): number {
  const { defaultValue, min, max } = options;

  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  // Check if parsing failed
  if (isNaN(parsed)) {
    return defaultValue;
  }

  // Check bounds
  if (min !== undefined && parsed < min) {
    return defaultValue;
  }
  if (max !== undefined && parsed > max) {
    return max; // Cap at max instead of returning default
  }

  return parsed;
}

/**
 * Parse and validate a limit parameter for pagination
 * Ensures value is within safe bounds
 */
export function parseLimit(
  value: string | null | undefined,
  options: ParseLimitOptions = {}
): number {
  const {
    defaultLimit = PAGINATION.DEFAULT_LIMIT,
    maxLimit = PAGINATION.MAX_LIMIT,
  } = options;

  return safeParseInt(value, {
    defaultValue: defaultLimit,
    min: PAGINATION.MIN_LIMIT,
    max: maxLimit,
  });
}

/**
 * Parse and validate an offset parameter for pagination
 */
export function parseOffset(value: string | null | undefined): number {
  return safeParseInt(value, {
    defaultValue: 0,
    min: 0,
  });
}

/**
 * Validate that a required string field is present and non-empty
 */
export function validateRequired(
  value: string | null | undefined,
  fieldName: string
): { valid: true; value: string } | { valid: false; error: string } {
  if (value === null || value === undefined || value.trim() === '') {
    return { valid: false, error: `Missing required field: ${fieldName}` };
  }
  return { valid: true, value: value.trim() };
}

/**
 * Validate an enum value
 */
export function validateEnum<T extends string>(
  value: string | null | undefined,
  allowedValues: readonly T[],
  fieldName: string
): { valid: true; value: T } | { valid: false; error: string } {
  if (value === null || value === undefined) {
    return { valid: false, error: `Missing required field: ${fieldName}` };
  }

  if (!allowedValues.includes(value as T)) {
    return {
      valid: false,
      error: `Invalid ${fieldName}: must be one of ${allowedValues.join(', ')}`,
    };
  }

  return { valid: true, value: value as T };
}

/**
 * Validate a date string (ISO 8601 format)
 */
export function validateDateString(
  value: string | null | undefined,
  fieldName: string
): { valid: true; value: string } | { valid: false; error: string } {
  if (value === null || value === undefined || value.trim() === '') {
    return { valid: false, error: `Missing required field: ${fieldName}` };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: `Invalid date format for ${fieldName}` };
  }

  return { valid: true, value: value };
}

/**
 * Validate a positive number
 */
export function validatePositiveNumber(
  value: number | null | undefined,
  fieldName: string
): { valid: true; value: number } | { valid: false; error: string } {
  if (value === null || value === undefined) {
    return { valid: false, error: `Missing required field: ${fieldName}` };
  }

  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }

  return { valid: true, value };
}
