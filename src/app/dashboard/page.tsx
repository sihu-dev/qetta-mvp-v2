'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  events: number;
  actions: number;
  snapshots: number;
  bids: number;
}

interface RecentActivity {
  id: string;
  type: 'event' | 'action' | 'snapshot' | 'bid';
  title: string;
  timestamp: string;
  status?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    events: 0,
    actions: 0,
    snapshots: 0,
    bids: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        events: 1247,
        actions: 89,
        snapshots: 12,
        bids: 34,
      });
      setActivities([
        { id: '1', type: 'event', title: 'CNC-001 가동 시작', timestamp: '5분 전', status: 'running' },
        { id: '2', type: 'action', title: '예방 정비 완료', timestamp: '1시간 전', status: 'completed' },
        { id: '3', type: 'snapshot', title: '2024-01 증빙 생성', timestamp: '3시간 전' },
        { id: '4', type: 'bid', title: 'MES 구축 사업 분석', timestamp: '어제', status: 'analyzing' },
        { id: '5', type: 'event', title: 'PRESS-003 알람 발생', timestamp: '어제', status: 'error' },
      ]);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    { label: '총 이벤트', value: stats.events, icon: '📊', color: 'bg-blue-500' },
    { label: '조치 사항', value: stats.actions, icon: '✅', color: 'bg-green-500' },
    { label: '증빙 스냅샷', value: stats.snapshots, icon: '🔒', color: 'bg-purple-500' },
    { label: '입찰 공고', value: stats.bids, icon: '📋', color: 'bg-orange-500' },
  ];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'analyzing': return 'bg-yellow-100 text-yellow-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return '📊';
      case 'action': return '✅';
      case 'snapshot': return '🔒';
      case 'bid': return '📋';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">Qetta 증빙 레지스트리 현황</p>
      </div>

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
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
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
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{getTypeIcon(activity.type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
                {activity.status && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3-Tier Intelligence</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Rule-based (95%)</span>
                <span className="text-gray-900 font-medium">₩0</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">ML/pgvector (4%)</span>
                <span className="text-gray-900 font-medium">₩500K/년</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '4%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Claude API (1%)</span>
                <span className="text-gray-900 font-medium">₩6M/년 cap</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '1%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">이번 달 API 사용량</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">₩45,230</p>
            <p className="text-xs text-gray-400 mt-1">한도의 0.9%</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white">
        <h2 className="text-xl font-semibold mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors">
            <span className="text-2xl">📦</span>
            <div className="text-left">
              <p className="font-medium">증빙 생성</p>
              <p className="text-sm opacity-80">Gov ZIP 패키지</p>
            </div>
          </button>
          <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors">
            <span className="text-2xl">🔍</span>
            <div className="text-left">
              <p className="font-medium">입찰 분석</p>
              <p className="text-sm opacity-80">AI 적합도 검사</p>
            </div>
          </button>
          <button className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors">
            <span className="text-2xl">📄</span>
            <div className="text-left">
              <p className="font-medium">문서 생성</p>
              <p className="text-sm opacity-80">제안서/견적서</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
