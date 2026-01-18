'use client';

import Link from 'next/link';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { BRAND, SERVICE_WORDING, INTELLIGENCE_TIERS } from '@/lib/brand';
import { useDashboard } from '@/lib/hooks/useDashboard';

interface RecentActivity {
  id: string;
  type: 'event' | 'action' | 'snapshot' | 'bid';
  title: string;
  timestamp: string;
  status?: string;
}

const typeIcons = {
  event: ChartBarIcon,
  action: CheckCircleIcon,
  snapshot: ShieldCheckIcon,
  bid: DocumentTextIcon,
};

export default function DashboardPage() {
  const { metrics, health, loading, error, refreshAll, lastUpdated } = useDashboard({
    autoFetch: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  // Generate recent activities from metrics
  const activities: RecentActivity[] = metrics
    ? [
        {
          id: '1',
          type: 'event',
          title: `설비 데이터 ${metrics.activity.recent_predictions}건 분석`,
          timestamp: '방금 전',
          status: 'running',
        },
        {
          id: '2',
          type: 'action',
          title: `AI 예측 정확도 ${(metrics.agi.accuracy_rate * 100).toFixed(1)}%`,
          timestamp: '오늘',
          status: 'completed',
        },
        {
          id: '3',
          type: 'snapshot',
          title: `증빙 ${metrics.evidence.pending}건 검증 대기`,
          timestamp: '최근',
          status: metrics.evidence.pending > 0 ? 'analyzing' : 'completed',
        },
        {
          id: '4',
          type: 'bid',
          title: `입찰 ${metrics.tender.active}건 분석 가능`,
          timestamp: '오늘',
          status: 'analyzing',
        },
      ]
    : [];

  const statCards = [
    {
      label: '증빙 패키지',
      value: metrics?.evidence.total || 0,
      Icon: ShieldCheckIcon,
      color: 'bg-blue-600',
      subtext: `검증됨 ${metrics?.evidence.verified || 0}`,
    },
    {
      label: '입찰 공고',
      value: metrics?.tender.total || 0,
      Icon: DocumentTextIcon,
      color: 'bg-orange-500',
      subtext: `분석됨 ${metrics?.tender.analyzed || 0}`,
    },
    {
      label: 'AI 예측',
      value: metrics?.agi.predictions_today || 0,
      Icon: ChartBarIcon,
      color: 'bg-green-600',
      subtext: `정확도 ${((metrics?.agi.accuracy_rate || 0) * 100).toFixed(0)}%`,
    },
    {
      label: '최근 활동',
      value:
        (metrics?.activity.recent_uploads || 0) +
        (metrics?.activity.recent_analyses || 0) +
        (metrics?.activity.recent_predictions || 0),
      Icon: CheckCircleIcon,
      color: 'bg-blue-600',
      subtext: '지난 24시간',
    },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1">{SERVICE_WORDING.evidenceRegistry.nameKo} 현황</p>
        </div>
        <div className="flex items-center gap-4">
          {health && (
            <span
              className={`text-sm font-medium ${getHealthStatusColor(health.status)}`}
            >
              {health.status === 'healthy'
                ? '시스템 정상'
                : health.status === 'degraded'
                  ? '일부 지연'
                  : '연결 오류'}
            </span>
          )}
          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
                {stat.subtext && <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>}
              </div>
              <div
                className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
              >
                <stat.Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = typeIcons[activity.type];
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                    {activity.status && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}
                      >
                        {SERVICE_WORDING.status[
                          activity.status as keyof typeof SERVICE_WORDING.status
                        ] || activity.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>아직 활동 내역이 없습니다.</p>
            </div>
          )}
        </div>

        {/* Intelligence Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3-Tier Intelligence</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {INTELLIGENCE_TIERS.rule.name} ({INTELLIGENCE_TIERS.rule.percentage}%)
                </span>
                <span className="text-gray-900 font-medium">{INTELLIGENCE_TIERS.rule.cost}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${INTELLIGENCE_TIERS.rule.percentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {INTELLIGENCE_TIERS.ml.name} ({INTELLIGENCE_TIERS.ml.percentage}%)
                </span>
                <span className="text-gray-900 font-medium">{INTELLIGENCE_TIERS.ml.cost}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${INTELLIGENCE_TIERS.ml.percentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {INTELLIGENCE_TIERS.claude.name} ({INTELLIGENCE_TIERS.claude.percentage}%)
                </span>
                <span className="text-gray-900 font-medium">{INTELLIGENCE_TIERS.claude.cost}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-sky-500 h-2 rounded-full"
                  style={{ width: `${INTELLIGENCE_TIERS.claude.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">오늘 AI 사용량</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              ₩{(metrics?.agi.cost_today || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              예측 {metrics?.agi.predictions_today || 0}건
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
        <h2 className="text-xl font-semibold mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/evidence"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
          >
            <ArchiveBoxIcon className="h-8 w-8" />
            <div className="text-left">
              <p className="font-medium">{SERVICE_WORDING.evidenceRegistry.nameKo}</p>
              <p className="text-sm opacity-80">Gov ZIP 패키지</p>
            </div>
          </Link>
          <Link
            href="/dashboard/tender"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
          >
            <MagnifyingGlassIcon className="h-8 w-8" />
            <div className="text-left">
              <p className="font-medium">{SERVICE_WORDING.tender.analyze}</p>
              <p className="text-sm opacity-80">AI 적합도 검사</p>
            </div>
          </Link>
          <Link
            href="/dashboard/tender"
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors"
          >
            <DocumentDuplicateIcon className="h-8 w-8" />
            <div className="text-left">
              <p className="font-medium">{SERVICE_WORDING.documentSkills.nameKo}</p>
              <p className="text-sm opacity-80">제안서/견적서</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer with last updated */}
      <div className="text-center text-sm text-gray-400">
        <p className="font-medium text-blue-600">{BRAND.name}</p>
        <p>
          {BRAND.slogan} — {BRAND.tagline}
        </p>
        {lastUpdated && (
          <p className="mt-2 text-xs">
            마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
          </p>
        )}
      </div>
    </div>
  );
}
