/**
 * AnalysisProgress Component
 * Layer별 진행 상황 표시
 */

'use client';

import type { AnalysisPhase, LayerProgress } from '@/lib/hooks';

// =============================================================================
// 타입 정의
// =============================================================================

interface AnalysisProgressProps {
  phase: AnalysisPhase;
  progress: LayerProgress;
  getPhaseLabel: (phase: AnalysisPhase) => string;
}

// =============================================================================
// 상수
// =============================================================================

const LAYERS = [
  { key: 'layer1', label: 'Layer 1: 메타데이터 추출', desc: '발주기관, 예산, 마감일 확인' },
  { key: 'layer2a', label: 'Layer 2a: 키워드 분석', desc: 'TF-IDF 핵심 키워드 추출' },
  { key: 'layer2b', label: 'Layer 2b: 유사 검색', desc: 'pgvector 의미적 매칭' },
  { key: 'layer3', label: 'Layer 3: 은닉 니즈', desc: 'Claude API 심층 추론' },
  { key: 'layer4', label: 'Layer 4: 전략 수립', desc: '제안 전략 도출' },
] as const;

// =============================================================================
// 컴포넌트
// =============================================================================

export function AnalysisProgress({ phase, progress, getPhaseLabel }: AnalysisProgressProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-slate-900">분석 진행 중...</h3>
        <p className="text-sm text-slate-500">{getPhaseLabel(phase)}</p>
      </div>

      <div className="space-y-4">
        {LAYERS.map(({ key, label, desc }) => {
          const layerKey = key as keyof LayerProgress;
          const layerProgress = progress[layerKey];
          const isActive = phase === key;
          const isComplete = layerProgress === 100;

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 상태 아이콘 */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isComplete
                      ? 'bg-green-100 text-green-600'
                      : isActive
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isComplete ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 bg-slate-300 rounded-full" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isComplete
                      ? 'text-green-700'
                      : isActive
                      ? 'text-purple-700'
                      : 'text-slate-400'
                  }`}>
                    {label}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {isComplete ? '완료' : isActive ? `${layerProgress}%` : '대기'}
                </span>
              </div>

              {/* 진행 바 */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    isComplete
                      ? 'bg-green-500'
                      : isActive
                      ? 'bg-purple-500'
                      : 'bg-slate-200'
                  }`}
                  style={{ width: `${layerProgress}%` }}
                />
              </div>

              {/* 설명 */}
              {isActive && (
                <p className="text-xs text-slate-500 pl-7">{desc}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Layer 3 강조 */}
      {phase === 'layer3' && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700">
            ★ 은닉 니즈 추론 중... (약 3-5초 소요)
          </p>
          <p className="text-xs text-purple-500 mt-1">
            발주자가 말하지 못한 고민을 AI가 분석합니다.
          </p>
        </div>
      )}
    </div>
  );
}

export default AnalysisProgress;
