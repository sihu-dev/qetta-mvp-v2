'use client';

/**
 * Admin Dashboard Main Page
 * 시스템 관리 개요
 */

import Link from 'next/link';
import {
  UsersIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { BRAND } from '@/lib/brand';

interface AdminStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface AdminLink {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  stat?: string;
}

export default function AdminDashboardPage() {
  const stats: AdminStat[] = [
    { label: '전체 사용자', value: 127, change: '+12', trend: 'up' },
    { label: '활성 조직', value: 23, change: '+3', trend: 'up' },
    { label: '오늘 로그인', value: 45, change: '-5', trend: 'down' },
    { label: 'API 요청 (24h)', value: '12.5K', change: '+8%', trend: 'up' },
  ];

  const adminLinks: AdminLink[] = [
    {
      name: '사용자 관리',
      description: '사용자 계정 및 권한 관리',
      href: '/dashboard/admin/users',
      icon: UsersIcon,
      stat: '127 사용자',
    },
    {
      name: '조직 관리',
      description: '조직 및 팀 설정',
      href: '/dashboard/admin/organizations',
      icon: BuildingOffice2Icon,
      stat: '23 조직',
    },
    {
      name: '시스템 설정',
      description: 'API 키 및 환경 설정',
      href: '/dashboard/admin/settings',
      icon: Cog6ToothIcon,
    },
    {
      name: '사용량 통계',
      description: '리소스 사용량 모니터링',
      href: '/dashboard/admin/usage',
      icon: ChartBarSquareIcon,
      stat: '12.5K 요청',
    },
  ];

  const alerts = [
    { type: 'warning', message: '3개 계정의 비밀번호가 90일 이상 변경되지 않았습니다.' },
    { type: 'info', message: 'API 사용량이 월 할당량의 85%에 도달했습니다.' },
  ];

  const recentActivities = [
    { action: '사용자 생성', user: 'admin@qetta.io', target: '김철수 (user)', time: '5분 전' },
    { action: '권한 변경', user: 'admin@qetta.io', target: '박영희 (developer → admin)', time: '1시간 전' },
    { action: '조직 생성', user: 'admin@qetta.io', target: '스마트팩토리 솔루션즈', time: '2시간 전' },
    { action: 'API 키 재발급', user: 'developer@qetta.io', target: 'Production API Key', time: '3시간 전' },
    { action: '설정 변경', user: 'admin@qetta.io', target: 'Rate Limit (100 → 200)', time: '어제' },
  ];

  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-500 mt-1">시스템 관리 및 모니터링</p>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600 font-medium">관리자 모드</span>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  alert.type === 'error' ? 'bg-red-50 text-red-800' :
                  'bg-blue-50 text-blue-800'
                }`}
              >
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                {stat.change && (
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-500' :
                    stat.trend === 'down' ? 'text-red-500' :
                    'text-gray-500'
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
          {adminLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <link.icon className="w-6 h-6 text-blue-600" />
                </div>
                {link.stat && (
                  <span className="text-sm text-gray-500">{link.stat}</span>
                )}
              </div>
              <div className="mt-4">
                <h3 className="font-medium text-gray-900">{link.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">최근 관리 활동</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">전체 보기</button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivities.map((activity, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">{activity.user}</span> → {activity.target}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">시스템 상태</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Database', status: 'healthy' },
              { name: 'Storage', status: 'healthy' },
              { name: 'AI Service', status: 'healthy' },
              { name: 'API Gateway', status: 'healthy' },
            ].map((service) => (
              <div key={service.name} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  service.status === 'healthy' ? 'bg-green-500' :
                  service.status === 'degraded' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{service.status}</p>
                </div>
              </div>
            ))}
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
