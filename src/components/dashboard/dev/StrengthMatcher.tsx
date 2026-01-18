/**
 * StrengthMatcher Component
 * 13개 강점 매칭 시각화
 */

'use client';

import { QETTA_STRENGTHS, getStrengthsByCategory } from '@/lib/bizsupport/data/qetta-strengths';
import type { StrengthMatch } from '@/lib/bizsupport/types';

// =============================================================================
// 타입 정의
// =============================================================================

interface StrengthMatcherProps {
  matches: StrengthMatch[];
  selectedStrengths: string[];
  onStrengthToggle: (id: string) => void;
  maxSelections?: number;
}

// =============================================================================
// 상수
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  COST: '비용',
  SPEED: '속도',
  TECH: '기술',
  TRUST: '신뢰',
  SUPPORT: '지원',
};

const CATEGORY_COLORS: Record<string, string> = {
  COST: 'bg-green-100 text-green-700 border-green-200',
  SPEED: 'bg-blue-100 text-blue-700 border-blue-200',
  TECH: 'bg-purple-100 text-purple-700 border-purple-200',
  TRUST: 'bg-amber-100 text-amber-700 border-amber-200',
  SUPPORT: 'bg-slate-100 text-slate-700 border-slate-200',
};

// =============================================================================
// 헬퍼 함수
// =============================================================================

function getMatchScore(matches: StrengthMatch[], strengthId: string): number | null {
  const match = matches.find((m) => m.strengthId === strengthId);
  return match ? match.score : null;
}

function formatScore(score: number): string {
  return (score * 100).toFixed(0);
}

// =============================================================================
// 컴포넌트
// =============================================================================

export function StrengthMatcher({
  matches,
  selectedStrengths,
  onStrengthToggle,
  maxSelections = 4,
}: StrengthMatcherProps) {
  const categories = getStrengthsByCategory();
  const isMaxSelected = selectedStrengths.length >= maxSelections;

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-900">강점 매칭</h3>
            <p className="text-sm text-slate-500 mt-1">
              제안서에 포함할 강점을 선택하세요 (최대 {maxSelections}개)
            </p>
          </div>
          <div className="text-sm text-purple-600 font-medium">
            {selectedStrengths.length} / {maxSelections} 선택됨
          </div>
        </div>
      </div>

      {/* 카테고리별 강점 */}
      <div className="p-6 space-y-6">
        {Object.entries(categories).map(([category, strengths]) => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${CATEGORY_COLORS[category]}`}>
                {CATEGORY_LABELS[category]}
              </span>
              <span className="text-xs text-slate-400">
                {strengths.length}개 강점
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strengths.map((strength) => {
                const matchScore = getMatchScore(matches, strength.id);
                const isSelected = selectedStrengths.includes(strength.id);
                const isDisabled = !isSelected && isMaxSelected;

                return (
                  <button
                    key={strength.id}
                    onClick={() => !isDisabled && onStrengthToggle(strength.id)}
                    disabled={isDisabled}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : isDisabled
                        ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{strength.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{strength.metric}</div>
                      </div>

                      {/* 매칭 점수 */}
                      {matchScore !== null && (
                        <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                          matchScore >= 0.7
                            ? 'bg-green-100 text-green-700'
                            : matchScore >= 0.4
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {formatScore(matchScore)}%
                        </div>
                      )}
                    </div>

                    {/* 선택 체크 */}
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-purple-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium">선택됨</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 강점 요약 */}
      {selectedStrengths.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="text-sm font-medium text-slate-700 mb-2">선택된 강점:</div>
          <div className="flex flex-wrap gap-2">
            {selectedStrengths.map((id) => {
              const strength = QETTA_STRENGTHS.find((s) => s.id === id);
              return strength ? (
                <span
                  key={id}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                >
                  {strength.title}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StrengthMatcher;
