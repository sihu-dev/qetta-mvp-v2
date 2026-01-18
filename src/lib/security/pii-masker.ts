/**
 * PII Masker
 * 개인식별정보 자동 마스킹
 * GDPR/PIPA 준수
 */

// =============================================================================
// 타입 정의
// =============================================================================

export type PIIType =
  | 'email'
  | 'phone'
  | 'resident_number'      // 주민등록번호
  | 'passport'             // 여권번호
  | 'driver_license'       // 운전면허번호
  | 'credit_card'          // 신용카드번호
  | 'bank_account'         // 계좌번호
  | 'ip_address'
  | 'name'
  | 'address';

export interface MaskingRule {
  type: PIIType;
  pattern: RegExp;
  mask: (match: string) => string;
  enabled: boolean;
}

export interface MaskingResult {
  original: string;
  masked: string;
  detectedPII: {
    type: PIIType;
    count: number;
    positions: { start: number; end: number }[];
  }[];
}

export interface MaskingConfig {
  enabledTypes?: PIIType[];
  preserveLength?: boolean;
  maskChar?: string;
  detectOnly?: boolean;
}

// =============================================================================
// 기본 마스킹 규칙
// =============================================================================

const DEFAULT_RULES: MaskingRule[] = [
  {
    type: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: (match) => {
      const [local, domain] = match.split('@');
      const maskedLocal = local.slice(0, 2) + '***';
      return `${maskedLocal}@${domain}`;
    },
    enabled: true,
  },
  {
    type: 'phone',
    pattern: /(?:010|011|016|017|018|019)[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
    mask: (match) => {
      const digits = match.replace(/[-.\s]/g, '');
      return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
    },
    enabled: true,
  },
  {
    type: 'resident_number',
    pattern: /\d{6}[-\s]?[1-4]\d{6}/g,
    mask: (match) => {
      const clean = match.replace(/[-\s]/g, '');
      return `${clean.slice(0, 6)}-*******`;
    },
    enabled: true,
  },
  {
    type: 'passport',
    pattern: /[A-Z]{1,2}\d{7,8}/g,
    mask: (match) => `${match.slice(0, 2)}*****${match.slice(-2)}`,
    enabled: true,
  },
  {
    type: 'driver_license',
    pattern: /\d{2}-\d{2}-\d{6}-\d{2}/g,
    mask: (match) => {
      const parts = match.split('-');
      return `${parts[0]}-${parts[1]}-******-${parts[3]}`;
    },
    enabled: true,
  },
  {
    type: 'credit_card',
    pattern: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
    mask: (match) => {
      const digits = match.replace(/[-\s]/g, '');
      return `${digits.slice(0, 4)}-****-****-${digits.slice(-4)}`;
    },
    enabled: true,
  },
  {
    type: 'bank_account',
    pattern: /\d{3,4}[-\s]?\d{2,4}[-\s]?\d{4,6}/g,
    mask: (match) => {
      const digits = match.replace(/[-\s]/g, '');
      if (digits.length < 10) return match; // 계좌번호가 아닐 수 있음
      return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
    },
    enabled: true,
  },
  {
    type: 'ip_address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    mask: (match) => {
      const parts = match.split('.');
      return `${parts[0]}.${parts[1]}.***.***`;
    },
    enabled: true,
  },
];

// =============================================================================
// PII Masker
// =============================================================================

export class PIIMasker {
  private rules: MaskingRule[];
  private config: MaskingConfig;

  constructor(config: MaskingConfig = {}) {
    this.config = {
      enabledTypes: config.enabledTypes,
      preserveLength: config.preserveLength ?? false,
      maskChar: config.maskChar ?? '*',
      detectOnly: config.detectOnly ?? false,
    };

    this.rules = DEFAULT_RULES.map((rule) => ({
      ...rule,
      enabled: this.config.enabledTypes
        ? this.config.enabledTypes.includes(rule.type)
        : rule.enabled,
    }));
  }

  /**
   * 텍스트에서 PII 마스킹
   */
  mask(text: string): MaskingResult {
    const detectedPII: MaskingResult['detectedPII'] = [];
    let masked = text;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const matches: { start: number; end: number }[] = [];
      let match;

      // 패턴 리셋
      rule.pattern.lastIndex = 0;

      // 탐지
      while ((match = rule.pattern.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
        });
      }

      if (matches.length > 0) {
        detectedPII.push({
          type: rule.type,
          count: matches.length,
          positions: matches,
        });

        // 마스킹 (detectOnly가 아닌 경우)
        if (!this.config.detectOnly) {
          rule.pattern.lastIndex = 0;
          masked = masked.replace(rule.pattern, (m) => {
            if (this.config.preserveLength) {
              return this.config.maskChar!.repeat(m.length);
            }
            return rule.mask(m);
          });
        }
      }
    }

    return {
      original: text,
      masked: this.config.detectOnly ? text : masked,
      detectedPII,
    };
  }

  /**
   * JSON 객체 내 PII 마스킹 (재귀)
   */
  maskObject<T extends Record<string, unknown>>(obj: T): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.mask(value).masked;
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) => {
          if (typeof item === 'string') {
            return this.mask(item).masked;
          } else if (typeof item === 'object' && item !== null) {
            return this.maskObject(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.maskObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  /**
   * PII 탐지만 수행
   */
  detect(text: string): MaskingResult['detectedPII'] {
    const masker = new PIIMasker({ ...this.config, detectOnly: true });
    return masker.mask(text).detectedPII;
  }

  /**
   * 특정 PII 타입만 마스킹
   */
  maskType(text: string, type: PIIType): string {
    const rule = this.rules.find((r) => r.type === type);
    if (!rule) return text;

    rule.pattern.lastIndex = 0;
    return text.replace(rule.pattern, rule.mask);
  }

  /**
   * 커스텀 규칙 추가
   */
  addRule(rule: MaskingRule): void {
    this.rules.push(rule);
  }

  /**
   * 규칙 활성화/비활성화
   */
  setRuleEnabled(type: PIIType, enabled: boolean): void {
    const rule = this.rules.find((r) => r.type === type);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * PII 탐지 보고서 생성
   */
  generateReport(text: string): string {
    const result = this.mask(text);

    if (result.detectedPII.length === 0) {
      return '✅ PII가 탐지되지 않았습니다.';
    }

    const totalCount = result.detectedPII.reduce((sum, p) => sum + p.count, 0);

    return `
# PII 탐지 보고서

## 요약
- **총 탐지 수**: ${totalCount}건
- **탐지 유형**: ${result.detectedPII.length}종

## 상세 내역
${result.detectedPII
  .map((p) => `### ${p.type}
- 탐지 수: ${p.count}건
- 위치: ${p.positions.map((pos) => `[${pos.start}-${pos.end}]`).join(', ')}`)
  .join('\n\n')}

## 권장 조치
${result.detectedPII.some((p) => ['resident_number', 'credit_card'].includes(p.type))
  ? '⚠️ 민감한 개인정보가 포함되어 있습니다. 즉시 마스킹 또는 삭제를 권장합니다.'
  : 'ℹ️ 일반적인 개인정보가 포함되어 있습니다. 필요에 따라 마스킹을 적용하세요.'}

---
*Generated by Qetta PII Masker*
*PIPA (개인정보보호법) 준수*
    `.trim();
  }
}

// =============================================================================
// Factory & Helper
// =============================================================================

let defaultInstance: PIIMasker | null = null;

export function getPIIMasker(config?: MaskingConfig): PIIMasker {
  if (!config && defaultInstance) {
    return defaultInstance;
  }

  const instance = new PIIMasker(config);

  if (!config) {
    defaultInstance = instance;
  }

  return instance;
}

/**
 * 간편 마스킹 함수
 */
export function maskPII(text: string, config?: MaskingConfig): string {
  return getPIIMasker(config).mask(text).masked;
}

/**
 * 간편 탐지 함수
 */
export function detectPII(text: string): MaskingResult['detectedPII'] {
  return getPIIMasker().detect(text);
}

/**
 * 이메일 마스킹
 */
export function maskEmail(email: string): string {
  return getPIIMasker().maskType(email, 'email');
}

/**
 * 전화번호 마스킹
 */
export function maskPhone(phone: string): string {
  return getPIIMasker().maskType(phone, 'phone');
}
