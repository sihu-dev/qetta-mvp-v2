/**
 * RFPAnalyzer Component
 * 4-Layer RFP 분석 메인 UI
 */

'use client';

import { useState } from 'react';
import { useRFPAnalysis } from '@/lib/hooks';
import { AnalysisProgress } from './AnalysisProgress';
import { HiddenNeedsCard } from './HiddenNeedsCard';
import { StrategyPanel } from './StrategyPanel';
import { ClientTypeSelector } from './ClientTypeSelector';
import type { RFPDocument, ClientType, RFPAnalysisResult } from '@/lib/bizsupport/types';

// =============================================================================
// 타입 정의
// =============================================================================

interface RFPAnalyzerProps {
  rfpDocument?: RFPDocument;
  onAnalysisComplete?: (result: RFPAnalysisResult) => void;
}

// =============================================================================
// 컴포넌트
// =============================================================================

export function RFPAnalyzer({ rfpDocument, onAnalysisComplete }: RFPAnalyzerProps) {
  const { state, analyze, reset, getPhaseLabel } = useRFPAnalysis();
  const [clientType, setClientType] = useState<ClientType>('SME_MANUFACTURER');
  const [rfpText, setRfpText] = useState('');

  const handleAnalyze = async () => {
    const doc: RFPDocument = rfpDocument || {
      id: `rfp-${Date.now()}`,
      title: '분석 대상 RFP',
      content: rfpText,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    const result = await analyze(doc, clientType);
    if (result && onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">4-Layer RFP 분석</h2>
          <p className="text-sm text-slate-500">발주자의 은닉 니즈를 추론합니다</p>
        </div>
        {state.result && (
          <button
            onClick={reset}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            새로 분석
          </button>
        )}
      </div>

      {/* 입력 영역 */}
      {!state.isAnalyzing && !state.result && (
        <div className="space-y-4">
          {/* ClientType 선택 */}
          <ClientTypeSelector
            value={clientType}
            onChange={setClientType}
          />

          {/* RFP 텍스트 입력 */}
          {!rfpDocument && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                공고문 내용
              </label>
              <textarea
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                placeholder="분석할 RFP 공고문을 붙여넣으세요..."
                className="w-full h-48 rounded-lg border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          )}

          {/* 분석 버튼 */}
          <button
            onClick={handleAnalyze}
            disabled={!rfpDocument && !rfpText.trim()}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium
              hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed
              transition-colors"
          >
            분석 시작
          </button>
        </div>
      )}

      {/* 분석 진행 상황 */}
      {state.isAnalyzing && (
        <AnalysisProgress
          phase={state.phase}
          progress={state.progress}
          getPhaseLabel={getPhaseLabel}
        />
      )}

      {/* 분석 결과 */}
      {state.result && (
        <div className="space-y-6">
          {/* 탭 네비게이션 */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {['메타데이터', '키워드', '은닉 니즈', '전략'].map((tab, idx) => (
                <button
                  key={tab}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    idx === 2
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {idx === 2 && state.result && (
                    <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                      {state.result.hiddenNeeds.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* 은닉 니즈 카드 */}
          <HiddenNeedsCard hiddenNeeds={state.result.hiddenNeeds} />

          {/* 전략 패널 */}
          <StrategyPanel strategy={state.result.strategy} />

          {/* 처리 시간 */}
          <div className="text-xs text-slate-400 text-right">
            총 처리 시간: {state.result.processingTime.total}ms
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{state.error}</p>
          <button
            onClick={reset}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

export default RFPAnalyzer;
