/**
 * HiddenNeedsCard Component
 * Layer 3 은닉 니즈 표시
 */

'use client';

import type { HiddenNeed } from '@/lib/bizsupport/types';

// =============================================================================
// 타입 정의
// =============================================================================

interface HiddenNeedsCardProps {
  hiddenNeeds: HiddenNeed[];
}

// =============================================================================
// 헬퍼 함수
// =============================================================================

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-700';
  if (confidence >= 0.6) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return '높음';
  if (confidence >= 0.6) return '중간';
  return '낮음';
}

// =============================================================================
// 컴포넌트
// =============================================================================

export function HiddenNeedsCard({ hiddenNeeds }: HiddenNeedsCardProps) {
  if (hiddenNeeds.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 p-6 text-center">
        <p className="text-slate-500">추론된 은닉 니즈가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-medium text-purple-900">심사위원이 기대하는 것</h3>
        </div>
        <p className="text-sm text-purple-600 mt-1">
          공고에 명시되지 않았지만, 높은 확률로 평가에 반영되는 요소입니다.
        </p>
      </div>

      {/* 은닉 니즈 목록 */}
      <div className="divide-y divide-slate-100">
        {hiddenNeeds.map((need, index) => (
          <div key={index} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* 번호 및 니즈 */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h4 className="font-medium text-slate-900">{need.need}</h4>
                </div>

                {/* 추론 근거 */}
                <p className="text-sm text-slate-600 pl-9">{need.reasoning}</p>

                {/* 관련 키워드 */}
                {need.relatedKeywords && need.relatedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pl-9">
                    {need.relatedKeywords.map((keyword, kidx) => (
                      <span
                        key={kidx}
                        className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 신뢰도 배지 */}
              <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(need.confidence)}`}>
                {getConfidenceLabel(need.confidence)} ({(need.confidence * 100).toFixed(0)}%)
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          ★ 은닉 니즈를 제안서 섹션 1 &quot;이해도&quot;에서 먼저 언급하면 승률이 높아집니다.
        </p>
      </div>
    </div>
  );
}

export default HiddenNeedsCard;
