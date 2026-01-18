'use client';

/**
 * Developer Dashboard Main Page
 * API 로그, 메트릭, 워크플로우 관리
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  CommandLineIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { BRAND, SERVICE_WORDING } from '@/lib/brand';

interface QuickStat {
  label: string;
  value: string | number;
  change?: string;
  status: 'success' | 'warning' | 'error' | 'neutral';
}

interface RecentLog {
  id: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
}

export default function DevDashboardPage() {
  const { metrics, loading, error, refresh } = useDashboard({ refreshInterval: 10000 });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  // Mock recent logs for now (will be replaced with real API)
  useEffect(() => {
    setRecentLogs([
      { id: '1', method: 'POST', path: '/api/tender/analyze', status: 200, duration: 1250, timestamp: '2분 전' },
      { id: '2', method: 'GET', path: '/api/evidence', status: 200, duration: 45, timestamp: '5분 전' },
      { id: '3', method: 'POST', path: '/api/agi/prediction', status: 200, duration: 890, timestamp: '8분 전' },
      { id: '4', method: 'GET', path: '/api/health', status: 200, duration: 12, timestamp: '10분 전' },
      { id: '5', method: 'POST', path: '/api/tender/collect', status: 500, duration: 5230, timestamp: '15분 전' },
    ]);
  }, []);

  const quickStats: QuickStat[] = [
    {
      label: 'API 상태',
      value: metrics?.health_status === 'healthy' ? '정상' : '오류',
      status: metrics?.health_status === 'healthy' ? 'success' : 'error',
    },
    {
      label: '오늘 요청',
      value: metrics?.total_tenders || 0,
      change: '+12%',
      status: 'neutral',
    },
    {
      label: '평균 응답',
      value: '245ms',
      change: '-8%',
      status: 'success',
    },
    {
      label: '에러율',
      value: '0.2%',
      change: '-0.1%',
      status: 'success',
    },
  ];

  const devLinks = [
    {
      name: 'API 로그',
      description: 'API 요청/응답 로그 조회',
      href: '/dashboard/dev/logs',
      icon: DocumentTextIcon,
    },
    {
      name: '실시간 메트릭',
      description: '시스템 성능 모니터링',
      href: '/dashboard/dev/metrics',
      icon: ChartBarIcon,
    },
    {
      name: '워크플로우',
      description: 'n8n 워크플로우 관리',
      href: '/dashboard/dev/workflows',
      icon: CogIcon,
    },
    {
      name: 'API 테스트',
      description: 'API 엔드포인트 테스트',
      href: '/dashboard/dev/test',
      icon: CommandLineIcon,
    },
  ];

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) {
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    }
    if (status >= 400 && status < 500) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
    }
    return <XCircleIcon className="w-4 h-4 text-red-500" />;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-700';
      case 'POST':
        return 'bg-blue-100 text-blue-700';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <RoleGate allowedRoles={['developer', 'admin']}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">개발자 대시보드</h1>
            <p className="text-gray-500 mt-1">API 모니터링 및 시스템 관리</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold ${
                  stat.status === 'success' ? 'text-green-600' :
                  stat.status === 'error' ? 'text-red-600' :
                  stat.status === 'warning' ? 'text-yellow-600' :
                  'text-gray-900'
                }`}>
                  {stat.value}
                </span>
                {stat.change && (
                  <span className={`text-sm ${
                    stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {devLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <link.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{link.name}</h3>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent API Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">최근 API 로그</h2>
            <Link
              href="/dashboard/dev/logs"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              전체 보기
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(log.status)}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(log.method)}`}>
                    {log.method}
                  </span>
                  <span className="font-mono text-sm text-gray-700">{log.path}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className={`font-medium ${
                    log.status >= 200 && log.status < 300 ? 'text-green-600' :
                    log.status >= 400 && log.status < 500 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-gray-500">{log.duration}ms</span>
                  <span className="text-gray-400 w-16 text-right">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">시스템 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-gray-500">버전</p>
              <p className="font-medium text-gray-900">v2.0.0</p>
            </div>
            <div>
              <p className="text-gray-500">환경</p>
              <p className="font-medium text-gray-900">Production</p>
            </div>
            <div>
              <p className="text-gray-500">업타임</p>
              <p className="font-medium text-gray-900">99.9%</p>
            </div>
            <div>
              <p className="text-gray-500">마지막 배포</p>
              <p className="font-medium text-gray-900">{new Date().toLocaleDateString('ko-KR')}</p>
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
