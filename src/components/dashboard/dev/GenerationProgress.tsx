/**
 * GenerationProgress Component
 * 문서 생성 진행 상태
 */

'use client';

// =============================================================================
// 타입 정의
// =============================================================================

export type GenerationStep =
  | 'preparing'
  | 'analyzing'
  | 'generating_proposal'
  | 'generating_quotation'
  | 'generating_presentation'
  | 'finalizing'
  | 'complete'
  | 'error';

interface GenerationProgressProps {
  currentStep: GenerationStep;
  progress: number;
  error?: string | null;
}

// =============================================================================
// 상수
// =============================================================================

const STEPS: { step: GenerationStep; label: string }[] = [
  { step: 'preparing', label: '준비 중...' },
  { step: 'analyzing', label: '데이터 분석' },
  { step: 'generating_proposal', label: '제안서 생성' },
  { step: 'generating_quotation', label: '견적서 생성' },
  { step: 'generating_presentation', label: '발표자료 생성' },
  { step: 'finalizing', label: '마무리' },
  { step: 'complete', label: '완료' },
];

function getStepIndex(step: GenerationStep): number {
  const index = STEPS.findIndex((s) => s.step === step);
  return index >= 0 ? index : 0;
}

// =============================================================================
// 컴포넌트
// =============================================================================

export function GenerationProgress({ currentStep, progress, error }: GenerationProgressProps) {
  const currentIndex = getStepIndex(currentStep);
  const isComplete = currentStep === 'complete';
  const isError = currentStep === 'error';

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div className={`px-6 py-4 ${
        isComplete
          ? 'bg-green-50 border-b border-green-100'
          : isError
          ? 'bg-red-50 border-b border-red-100'
          : 'bg-purple-50 border-b border-purple-100'
      }`}>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : isError ? (
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          )}
          <div>
            <h3 className={`font-medium ${
              isComplete ? 'text-green-900' : isError ? 'text-red-900' : 'text-purple-900'
            }`}>
              {isComplete ? '문서 생성 완료' : isError ? '문서 생성 실패' : '문서 생성 중...'}
            </h3>
            <p className={`text-sm ${
              isComplete ? 'text-green-600' : isError ? 'text-red-600' : 'text-purple-600'
            }`}>
              {isComplete
                ? '모든 문서가 성공적으로 생성되었습니다.'
                : isError
                ? error || '알 수 없는 오류가 발생했습니다.'
                : STEPS[currentIndex]?.label}
            </p>
          </div>
        </div>
      </div>

      {/* 진행 바 */}
      {!isComplete && !isError && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">전체 진행률</span>
            <span className="text-purple-600 font-medium">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 단계별 진행 상황 */}
      <div className="px-6 py-4 border-t border-slate-100">
        <div className="space-y-3">
          {STEPS.slice(0, -1).map(({ step, label }, index) => {
            const isCurrentStep = index === currentIndex;
            const isPastStep = index < currentIndex;

            return (
              <div key={step} className="flex items-center gap-3">
                {/* 상태 아이콘 */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isPastStep || isComplete
                    ? 'bg-green-100 text-green-600'
                    : isCurrentStep && !isError
                    ? 'bg-purple-100 text-purple-600'
                    : isError && isCurrentStep
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {isPastStep || isComplete ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : isCurrentStep && !isError ? (
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                  ) : isError && isCurrentStep ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                {/* 라벨 */}
                <span className={`text-sm ${
                  isPastStep || isComplete
                    ? 'text-green-700'
                    : isCurrentStep
                    ? isError ? 'text-red-700' : 'text-purple-700 font-medium'
                    : 'text-slate-400'
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GenerationProgress;
