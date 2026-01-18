'use client';

import { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  SparklesIcon,
  LightBulbIcon,
  CpuChipIcon,
  ChartBarIcon,
  BoltIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';
import { BRAND, INTELLIGENCE_TIERS } from '@/lib/brand';
import { useAGI } from '@/lib/hooks/useAGI';

type InsightType = 'all' | 'anomaly' | 'prediction' | 'recommendation' | 'reasoning';

export default function AGIPage() {
  const { predictions, stats, loading, predicting, reasoning, error, predict, reason, fetchStats } =
    useAGI();

  const [activeTab, setActiveTab] = useState<InsightType>('all');
  const [query, setQuery] = useState('');

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const filteredPredictions =
    activeTab === 'all' ? predictions : predictions.filter((p) => p.type === activeTab);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return ExclamationTriangleIcon;
      case 'quality':
        return SparklesIcon;
      case 'maintenance':
        return LightBulbIcon;
      default:
        return ChartBarIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'anomaly':
        return 'bg-red-100 text-red-700';
      case 'quality':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 1:
        return { label: 'Rule', color: 'bg-green-500' };
      case 2:
        return { label: 'ML', color: 'bg-blue-500' };
      case 3:
        return { label: 'Claude', color: 'bg-sky-500' };
      default:
        return { label: `T${tier}`, color: 'bg-gray-500' };
    }
  };

  const handlePredict = async (type: 'quality' | 'maintenance' | 'anomaly') => {
    await predict('equipment-1', type, 72);
  };

  const handleReason = async () => {
    if (!query.trim()) return;
    await reason(query, '설비 데이터 분석 컨텍스트');
    setQuery('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">3-Tier Intelligence</h1>
          <p className="text-gray-500 mt-1">AGI 인사이트 분석 결과</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePredict('quality')}
            disabled={predicting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {predicting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                예측 중...
              </>
            ) : (
              <>
                <BoltIcon className="w-5 h-5" />
                품질 예측
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tier Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tier 1: {INTELLIGENCE_TIERS.rule.name}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.by_tier[1] || INTELLIGENCE_TIERS.rule.percentage}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">비용: {INTELLIGENCE_TIERS.rule.cost}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ServerStackIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tier 2: {INTELLIGENCE_TIERS.ml.name}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.by_tier[2] || INTELLIGENCE_TIERS.ml.percentage}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">비용: {INTELLIGENCE_TIERS.ml.cost}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CpuChipIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tier 3: {INTELLIGENCE_TIERS.claude.name}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.by_tier[3] || INTELLIGENCE_TIERS.claude.percentage}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">비용: {INTELLIGENCE_TIERS.claude.cost}</p>
        </div>
      </div>

      {/* Quick Prediction Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 예측</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handlePredict('quality')}
            disabled={predicting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            <SparklesIcon className="w-5 h-5" />
            품질 예측
          </button>
          <button
            onClick={() => handlePredict('maintenance')}
            disabled={predicting}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            <LightBulbIcon className="w-5 h-5" />
            정비 예측
          </button>
          <button
            onClick={() => handlePredict('anomaly')}
            disabled={predicting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            이상 탐지
          </button>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 추론</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="질문을 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleReason()}
          />
          <button
            onClick={handleReason}
            disabled={reasoning || !query.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {reasoning ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <CpuChipIcon className="w-5 h-5" />
            )}
            {reasoning ? '추론 중...' : '추론'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: 'all', label: '전체' },
          { key: 'anomaly', label: '이상 탐지' },
          { key: 'quality', label: '품질' },
          { key: 'maintenance', label: '정비' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as InsightType)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && predictions.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Predictions List */}
      <div className="space-y-4">
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">아직 예측 결과가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">위의 버튼을 클릭하여 예측을 시작하세요.</p>
          </div>
        ) : (
          filteredPredictions.map((prediction) => {
            const tierBadge = getTierBadge(prediction.tier_used);
            const TypeIcon = getTypeIcon(prediction.type);
            return (
              <div
                key={prediction.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(prediction.type)}`}
                        >
                          {prediction.type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${tierBadge.color}`}
                        >
                          {tierBadge.label}
                        </span>
                      </div>
                      <p className="text-gray-900">
                        {prediction.explanation ||
                          `예측값: ${JSON.stringify(prediction.prediction.value)}`}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>신뢰도: {Math.round(prediction.confidence * 100)}%</span>
                        <span>{new Date(prediction.created_at).toLocaleString('ko-KR')}</span>
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
                        stroke="#2563eb"
                        strokeWidth="6"
                        strokeDasharray={`${prediction.confidence * 176} 176`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                      {Math.round(prediction.confidence * 100)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">통계 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-80">총 예측</p>
              <p className="text-2xl font-bold">{stats.total_predictions}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">전체 정확도</p>
              <p className="text-2xl font-bold">{(stats.accuracy.overall * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm opacity-80">비용 절감</p>
              <p className="text-2xl font-bold">
                {(stats.cost_savings.tier1_vs_tier3 * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">월 예상 비용</p>
              <p className="text-2xl font-bold">
                ₩{stats.cost_savings.estimated_monthly.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Brand Footer */}
      <div className="text-center text-sm text-gray-400">
        <p className="font-medium text-blue-600">{BRAND.name}</p>
        <p>
          {BRAND.slogan} — {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}
