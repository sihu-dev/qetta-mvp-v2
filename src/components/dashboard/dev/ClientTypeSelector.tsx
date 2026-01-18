/**
 * ClientTypeSelector Component
 * ClientType 선택기
 */

'use client';

import type { ClientType } from '@/lib/bizsupport/types';
import { CLIENT_TYPE_LABELS } from '@/lib/bizsupport/data/client-priorities';

// =============================================================================
// 타입 정의
// =============================================================================

interface ClientTypeSelectorProps {
  value: ClientType;
  onChange: (value: ClientType) => void;
  disabled?: boolean;
}

// =============================================================================
// 상수
// =============================================================================

const CLIENT_TYPES: ClientType[] = [
  'SME_MANUFACTURER',
  'LOCAL_GOVERNMENT',
  'PUBLIC_INSTITUTION',
  'STARTUP',
  'SYSTEM_INTEGRATOR',
  'LARGE_ENTERPRISE',
];

const CLIENT_TYPE_DESCRIPTIONS: Record<ClientType, string> = {
  SME_MANUFACTURER: '비용 절감, 빠른 도입, 사용 편의 우선',
  LOCAL_GOVERNMENT: '정부 인증, 데이터 보안, 지역 지원 우선',
  PUBLIC_INSTITUTION: '실적, 안정성, 기술력 우선',
  STARTUP: '속도, 비용, 유연성 우선',
  SYSTEM_INTEGRATOR: '기술 연동, 확장성, 지원 우선',
  LARGE_ENTERPRISE: '보안, 안정성, 스케일 우선',
};

// =============================================================================
// 컴포넌트
// =============================================================================

export function ClientTypeSelector({ value, onChange, disabled }: ClientTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        고객 유형 선택
      </label>
      <p className="text-xs text-slate-500 mb-3">
        고객 유형에 따라 매칭 가중치가 달라집니다.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CLIENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            disabled={disabled}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              value === type
                ? 'border-purple-500 bg-purple-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="font-medium text-sm text-slate-900">
              {CLIENT_TYPE_LABELS[type]}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {CLIENT_TYPE_DESCRIPTIONS[type]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ClientTypeSelector;
