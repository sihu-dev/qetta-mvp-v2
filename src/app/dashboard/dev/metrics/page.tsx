'use client';

/**
 * Real-time Metrics Page
 * 시스템 성능 모니터링
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { BRAND } from '@/lib/brand';

interface MetricCard {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

interface TimeSeriesPoint {
  time: string;
  value: number;
}

export default function MetricsPage() {
  const { metrics, loading, refresh } = useDashboard({ refreshInterval: 5000 });
  const [cpuHistory, setCpuHistory] = useState<TimeSeriesPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<TimeSeriesPoint[]>([]);
  const [requestHistory, setRequestHistory] = useState<TimeSeriesPoint[]>([]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      setCpuHistory((prev) => {
        const newData = [...prev, { time: now, value: 20 + Math.random() * 30 }];
        return newData.slice(-20);
      });

      setMemoryHistory((prev) => {
        const newData = [...prev, { time: now, value: 50 + Math.random() * 20 }];
        return newData.slice(-20);
      });

      setRequestHistory((prev) => {
        const newData = [...prev, { time: now, value: Math.floor(Math.random() * 100) + 50 }];
        return newData.slice(-20);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const metricCards: MetricCard[] = [
    {
      label: 'CPU 사용률',
      value: cpuHistory.length > 0 ? cpuHistory[cpuHistory.length - 1].value.toFixed(1) : '0',
      unit: '%',
      icon: <CpuChipIcon className="w-6 h-6" />,
      trend: 'neutral',
      color: 'blue',
    },
    {
      label: '메모리 사용률',
      value: memoryHistory.length > 0 ? memoryHistory[memoryHistory.length - 1].value.toFixed(1) : '0',
      unit: '%',
      icon: <CircleStackIcon className="w-6 h-6" />,
      trend: 'up',
      trendValue: '+2.3%',
      color: 'green',
    },
    {
      label: '활성 연결',
      value: metrics?.active_connections || 12,
      icon: <ServerIcon className="w-6 h-6" />,
      trend: 'neutral',
      color: 'yellow',
    },
    {
      label: '평균 응답 시간',
      value: 245,
      unit: 'ms',
      icon: <ClockIcon className="w-6 h-6" />,
      trend: 'down',
      trendValue: '-8%',
      color: 'green',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600';
      case 'green':
        return 'bg-green-50 text-green-600';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-600';
      case 'red':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const SimpleChart = ({ data, color }: { data: TimeSeriesPoint[]; color: string }) => {
    if (data.length < 2) return <div className="h-32 flex items-center justify-center text-gray-400">데이터 로딩 중...</div>;

    const max = Math.max(...data.map((d) => d.value));
    const min = Math.min(...data.map((d) => d.value));
    const range = max - min || 1;

    return (
      <div className="h-32">
        <div className="flex items-end h-24 gap-1">
          {data.map((point, i) => {
            const height = ((point.value - min) / range) * 100;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all ${
                  color === 'blue' ? 'bg-blue-500' :
                  color === 'green' ? 'bg-green-500' :
                  color === 'yellow' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${point.time}: ${point.value.toFixed(1)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{data[0]?.time}</span>
          <span>{data[data.length - 1]?.time}</span>
        </div>
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={['developer', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/dev"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            개발자 대시보드
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">실시간 메트릭</h1>
              <p className="text-gray-500 mt-1">시스템 성능 모니터링</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                자동 새로고침: 5초
              </span>
              <button
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                metrics?.health_status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`} />
              <span className="font-medium text-gray-900">
                시스템 상태: {metrics?.health_status === 'healthy' ? '정상' : '오류'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              마지막 체크: {new Date().toLocaleTimeString('ko-KR')}
            </span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
                  {card.icon}
                </div>
                {card.trend && card.trendValue && (
                  <span className={`text-sm font-medium ${
                    card.trend === 'up' ? 'text-red-500' :
                    card.trend === 'down' ? 'text-green-500' :
                    'text-gray-500'
                  }`}>
                    {card.trendValue}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                  {card.unit && <span className="text-lg text-gray-500 ml-1">{card.unit}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CPU Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">CPU 사용률</h3>
            <SimpleChart data={cpuHistory} color="blue" />
          </div>

          {/* Memory Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">메모리 사용률</h3>
            <SimpleChart data={memoryHistory} color="green" />
          </div>

          {/* Requests Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">요청 수 (분당)</h3>
            <SimpleChart data={requestHistory} color="yellow" />
          </div>
        </div>

        {/* API Endpoints Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">API 엔드포인트 성능</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { path: '/api/tender/analyze', avgTime: 1250, requests: 234, errorRate: 0.5 },
              { path: '/api/evidence', avgTime: 45, requests: 892, errorRate: 0.1 },
              { path: '/api/agi/prediction', avgTime: 890, requests: 156, errorRate: 0.3 },
              { path: '/api/tender/collect', avgTime: 2340, requests: 67, errorRate: 2.1 },
              { path: '/api/health', avgTime: 12, requests: 4521, errorRate: 0 },
            ].map((endpoint) => (
              <div key={endpoint.path} className="px-6 py-4 flex items-center justify-between">
                <span className="font-mono text-sm text-gray-700">{endpoint.path}</span>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <p className="text-gray-500">평균 응답</p>
                    <p className={`font-medium ${
                      endpoint.avgTime < 100 ? 'text-green-600' :
                      endpoint.avgTime < 500 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {endpoint.avgTime}ms
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">요청 수</p>
                    <p className="font-medium text-gray-900">{endpoint.requests.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">에러율</p>
                    <p className={`font-medium ${
                      endpoint.errorRate < 0.5 ? 'text-green-600' :
                      endpoint.errorRate < 2 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {endpoint.errorRate}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">데이터베이스 통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">연결 풀</p>
              <p className="text-xl font-bold text-gray-900">10/20</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">평균 쿼리 시간</p>
              <p className="text-xl font-bold text-gray-900">8ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">총 레코드</p>
              <p className="text-xl font-bold text-gray-900">45.2K</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">저장소 사용량</p>
              <p className="text-xl font-bold text-gray-900">1.2GB</p>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="text-center text-sm text-gray-400">
          <p className="font-medium text-blue-600">{BRAND.name}</p>
          <p>
            {BRAND.slogan} — {BRAND.tagline}
          </p>
        </div>
      </div>
    </RoleGate>
  );
}
