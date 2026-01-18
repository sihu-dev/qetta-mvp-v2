import { describe, it, expect } from 'vitest';
import {
  safeParseInt,
  parseLimit,
  parseOffset,
  validateRequired,
  validateEnum,
  validateDateString,
  validatePositiveNumber,
  PAGINATION,
} from '../validators';

describe('safeParseInt', () => {
  it('returns default value for null', () => {
    expect(safeParseInt(null, { defaultValue: 10 })).toBe(10);
  });

  it('returns default value for undefined', () => {
    expect(safeParseInt(undefined, { defaultValue: 10 })).toBe(10);
  });

  it('returns default value for empty string', () => {
    expect(safeParseInt('', { defaultValue: 10 })).toBe(10);
  });

  it('returns default value for non-numeric string', () => {
    expect(safeParseInt('abc', { defaultValue: 10 })).toBe(10);
  });

  it('parses valid integer string', () => {
    expect(safeParseInt('42', { defaultValue: 10 })).toBe(42);
  });

  it('returns default value when below min', () => {
    expect(safeParseInt('5', { defaultValue: 10, min: 10 })).toBe(10);
  });

  it('returns max value when above max', () => {
    expect(safeParseInt('150', { defaultValue: 10, max: 100 })).toBe(100);
  });

  it('returns parsed value when within bounds', () => {
    expect(safeParseInt('50', { defaultValue: 10, min: 1, max: 100 })).toBe(50);
  });
});

describe('parseLimit', () => {
  it('returns default limit for null', () => {
    expect(parseLimit(null)).toBe(PAGINATION.DEFAULT_LIMIT);
  });

  it('returns default limit for undefined', () => {
    expect(parseLimit(undefined)).toBe(PAGINATION.DEFAULT_LIMIT);
  });

  it('returns custom default limit', () => {
    expect(parseLimit(null, { defaultLimit: 50 })).toBe(50);
  });

  it('caps at max limit', () => {
    expect(parseLimit('200')).toBe(PAGINATION.MAX_LIMIT);
  });

  it('caps at custom max limit', () => {
    expect(parseLimit('200', { maxLimit: 50 })).toBe(50);
  });

  it('returns parsed value within bounds', () => {
    expect(parseLimit('30')).toBe(30);
  });

  it('returns default for values below min', () => {
    expect(parseLimit('0')).toBe(PAGINATION.DEFAULT_LIMIT);
  });
});

describe('parseOffset', () => {
  it('returns 0 for null', () => {
    expect(parseOffset(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(parseOffset(undefined)).toBe(0);
  });

  it('returns 0 for negative values', () => {
    expect(parseOffset('-5')).toBe(0);
  });

  it('returns parsed value for valid offset', () => {
    expect(parseOffset('10')).toBe(10);
  });
});

describe('validateRequired', () => {
  it('returns error for null', () => {
    const result = validateRequired(null, 'name');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('name');
    }
  });

  it('returns error for undefined', () => {
    const result = validateRequired(undefined, 'name');
    expect(result.valid).toBe(false);
  });

  it('returns error for empty string', () => {
    const result = validateRequired('', 'name');
    expect(result.valid).toBe(false);
  });

  it('returns error for whitespace only', () => {
    const result = validateRequired('   ', 'name');
    expect(result.valid).toBe(false);
  });

  it('returns trimmed value for valid string', () => {
    const result = validateRequired('  hello  ', 'name');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe('hello');
    }
  });
});

describe('validateEnum', () => {
  const colors = ['red', 'green', 'blue'] as const;

  it('returns error for null', () => {
    const result = validateEnum(null, colors, 'color');
    expect(result.valid).toBe(false);
  });

  it('returns error for undefined', () => {
    const result = validateEnum(undefined, colors, 'color');
    expect(result.valid).toBe(false);
  });

  it('returns error for invalid value', () => {
    const result = validateEnum('yellow', colors, 'color');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('color');
      expect(result.error).toContain('red, green, blue');
    }
  });

  it('returns value for valid enum', () => {
    const result = validateEnum('red', colors, 'color');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe('red');
    }
  });
});

describe('validateDateString', () => {
  it('returns error for null', () => {
    const result = validateDateString(null, 'date');
    expect(result.valid).toBe(false);
  });

  it('returns error for undefined', () => {
    const result = validateDateString(undefined, 'date');
    expect(result.valid).toBe(false);
  });

  it('returns error for empty string', () => {
    const result = validateDateString('', 'date');
    expect(result.valid).toBe(false);
  });

  it('returns error for invalid date', () => {
    const result = validateDateString('not-a-date', 'date');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Invalid date');
    }
  });

  it('returns value for valid ISO date', () => {
    const result = validateDateString('2024-01-15T10:30:00Z', 'date');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe('2024-01-15T10:30:00Z');
    }
  });

  it('returns value for valid date string', () => {
    const result = validateDateString('2024-01-15', 'date');
    expect(result.valid).toBe(true);
  });
});

describe('validatePositiveNumber', () => {
  it('returns error for null', () => {
    const result = validatePositiveNumber(null, 'amount');
    expect(result.valid).toBe(false);
  });

  it('returns error for undefined', () => {
    const result = validatePositiveNumber(undefined, 'amount');
    expect(result.valid).toBe(false);
  });

  it('returns error for zero', () => {
    const result = validatePositiveNumber(0, 'amount');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('positive');
    }
  });

  it('returns error for negative number', () => {
    const result = validatePositiveNumber(-5, 'amount');
    expect(result.valid).toBe(false);
  });

  it('returns error for NaN', () => {
    const result = validatePositiveNumber(NaN, 'amount');
    expect(result.valid).toBe(false);
  });

  it('returns value for positive number', () => {
    const result = validatePositiveNumber(42, 'amount');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(42);
    }
  });

  it('returns value for positive decimal', () => {
    const result = validatePositiveNumber(3.14, 'amount');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toBe(3.14);
    }
  });
});

describe('PAGINATION constants', () => {
  it('has expected default values', () => {
    expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
    expect(PAGINATION.MAX_LIMIT).toBe(100);
    expect(PAGINATION.MIN_LIMIT).toBe(1);
  });
});
