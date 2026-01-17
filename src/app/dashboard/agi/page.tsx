'use client';

import { useState } from 'react';

interface Insight {
  id: string;
  type: 'reasoning' | 'prediction' | 'anomaly' | 'recommendation';
  content: string;
  confidence: number;
  tier: 'rule' | 'ml' | 'claude';
  created_at: string;
}

export default function AGIPage() {
  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      type: 'anomaly',
      content: 'CNC-001 설비의 알람 빈도가 지난 주 대비 150% 증가했습니다. 예방 정비를 권장합니다.',
      confidence: 0.87,
      tier: 'ml',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'prediction',
      content: 'PRESS-003 설비의 예상 가동률: 다음 주 92.5% (신뢰도: 85%)',
      confidence: 0.85,
      tier: 'rule',
      created_at: '2024-01-15T09:00:00Z',
    },
    {
      id: '3',
      type: 'recommendation',
      content: '현재 기술 스택으로 Next.js + Supabase + Claude API 조합을 추천합니다. 비용 효율성 95점.',
      confidence: 0.92,
      tier: 'claude',
      created_at: '2024-01-14T15:00:00Z',
    },
    {
      id: '4',
      type: 'reasoning',
      content: '지난 3개월간 알람 패턴 분석 결과, 월요일 오전에 설비 이상이 집중되는 경향이 있습니다.',
      confidence: 0.78,
      tier: 'ml',
      created_at: '2024-01-14T11:00:00Z',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'anomaly' | 'prediction' | 'recommendation'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredInsights = activeTab === 'all'
    ? insights
    : insights.filter(i => i.type === activeTab);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return '⚠️';
      case 'prediction': return '🔮';
      case 'recommendation': return '💡';
      case 'reasoning': return '🧠';
      default: return '📊';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'anomaly': return 'bg-red-100 text-red-700';
      case 'prediction': return 'bg-blue-100 text-blue-700';
      case 'recommendation': return 'bg-green-100 text-green-700';
      case 'reasoning': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'rule': return { label: 'Rule', color: 'bg-green-500' };
      case 'ml': return { label: 'ML', color: 'bg-blue-500' };
      case 'claude': return { label: 'Claude', color: 'bg-purple-500' };
      default: return { label: tier, color: 'bg-gray-500' };
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setInsights(prev => [{
        id: String(Date.now()),
        type: 'reasoning',
        content: '새로운 분석이 완료되었습니다. 전반적인 설비 상태가 양호합니다.',
        confidence: 0.91,
        tier: 'rule',
        created_at: new Date().toISOString(),
      }, ...prev]);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AGI 인사이트</h1>
          <p className="text-gray-500 mt-1">3-Tier Intelligence 분석 결과</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              분석 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              새 분석 실행
            </>
          )}
        </button>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tier 1: Rule-based</p>
              <p className="text-2xl font-bold text-gray-900">95%</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">비용: ₩0/월</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tier 2: ML/pgvector</p>
              <p className="text-2xl font-bold text-gray-900">4%</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">비용: ~₩42K/월</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tier 3: Claude API</p>
              <p className="text-2xl font-bold text-gray-900">1%</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">비용: ~₩500K/월 (cap)</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: 'all', label: '전체' },
          { key: 'anomaly', label: '이상 탐지' },
          { key: 'prediction', label: '예측' },
          { key: 'recommendation', label: '추천' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const tierBadge = getTierBadge(insight.tier);
          return (
            <div
              key={insight.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{getTypeIcon(insight.type)}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(insight.type)}`}>
                        {insight.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${tierBadge.color}`}>
                        {tierBadge.label}
                      </span>
                    </div>
                    <p className="text-gray-900">{insight.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>신뢰도: {Math.round(insight.confidence * 100)}%</span>
                      <span>{new Date(insight.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="6"
                      strokeDasharray={`${insight.confidence * 176} 176`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                    {Math.round(insight.confidence * 100)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
