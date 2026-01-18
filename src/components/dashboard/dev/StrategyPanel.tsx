/**
 * StrategyPanel Component
 * Layer 4 전략 결과 표시
 */

'use client';

import { memo } from 'react';
import type { ProposalStrategy } from '@/lib/bizsupport/types';

// =============================================================================
// 타입 정의
// =============================================================================

interface StrategyPanelProps {
  strategy: ProposalStrategy;
}

// =============================================================================
// 컴포넌트
// =============================================================================

export const StrategyPanel = memo(function StrategyPanel({ strategy }: StrategyPanelProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-medium text-slate-900">제안 전략</h3>
        <p className="text-sm text-slate-500 mt-1">분석 결과를 바탕으로 도출된 전략입니다.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* 핵심 메시지 */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">핵심 메시지</h4>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-purple-900 font-medium">{strategy.coreMessage}</p>
          </div>
        </div>

        {/* 차별화 포인트 */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">차별화 포인트</h4>
          <ul className="space-y-2">
            {strategy.differentiators.map((diff, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-700">{diff}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 강조 섹션 */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">집중 강조 섹션</h4>
          <div className="flex flex-wrap gap-2">
            {strategy.emphasisSections.map((section, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
              >
                {section}
              </span>
            ))}
          </div>
        </div>

        {/* 위험 요소 */}
        {strategy.riskFactors && strategy.riskFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">위험 요소</h4>
            <ul className="space-y-2">
              {strategy.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-600">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 권장 톤 */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">권장 톤</h4>
          <div className="flex items-center gap-4">
            {(['formal', 'technical', 'persuasive'] as const).map((tone) => (
              <label key={tone} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="tone"
                  checked={strategy.recommendedTone === tone}
                  readOnly
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-600">
                  {tone === 'formal' ? '공식적' : tone === 'technical' ? '기술적' : '설득적'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

StrategyPanel.displayName = 'StrategyPanel';

export default StrategyPanel;
