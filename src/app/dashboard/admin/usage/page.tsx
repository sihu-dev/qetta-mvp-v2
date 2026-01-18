'use client';

/**
 * Usage Statistics Page
 * 리소스 사용량 모니터링
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ServerIcon,
  CircleStackIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { BRAND } from '@/lib/brand';

interface UsageData {
  date: string;
  apiCalls: number;
  storage: number;
  aiTokens: number;
  evidence: number;
}

interface TopUser {
  id: string;
  name: string;
  email: string;
  apiCalls: number;
  storage: number;
}

export default function UsagePage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);

  useEffect(() => {
    // Generate mock usage data
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const data: UsageData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        apiCalls: Math.floor(Math.random() * 5000) + 1000,
        storage: Math.floor(Math.random() * 500) + 100,
        aiTokens: Math.floor(Math.random() * 50000) + 10000,
        evidence: Math.floor(Math.random() * 50) + 10,
      });
    }
    setUsageData(data);

    // Mock top users
    setTopUsers([
      { id: '1', name: '스마트팩토리 솔루션즈', email: 'admin@smartfactory.co.kr', apiCalls: 15234, storage: 2.5 },
      { id: '2', name: 'AI 제조혁신', email: 'dev@aimanufacturing.com', apiCalls: 12456, storage: 1.8 },
      { id: '3', name: '로봇셀 인테그레이터', email: 'team@robotcell.io', apiCalls: 9876, storage: 3.2 },
      { id: '4', name: '디지털트윈 코리아', email: 'contact@digitaltwin.kr', apiCalls: 7654, storage: 0.9 },
      { id: '5', name: '예지보전 테크', email: 'info@predmaint.tech', apiCalls: 5432, storage: 1.5 },
    ]);
  }, [dateRange]);

  const totalApiCalls = usageData.reduce((sum, d) => sum + d.apiCalls, 0);
  const totalStorage = usageData.reduce((sum, d) => sum + d.storage, 0);
  const totalAiTokens = usageData.reduce((sum, d) => sum + d.aiTokens, 0);
  const totalEvidence = usageData.reduce((sum, d) => sum + d.evidence, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const SimpleBarChart = ({ data, dataKey, color }: { data: UsageData[]; dataKey: keyof UsageData; color: string }) => {
    const values = data.map((d) => d[dataKey] as number);
    const max = Math.max(...values);

    return (
      <div className="h-32 flex items-end gap-0.5">
        {values.map((value, i) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t transition-all ${color}`}
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${data[i].date}: ${formatNumber(value)}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            관리자 대시보드
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">사용량 통계</h1>
              <p className="text-gray-500 mt-1">리소스 사용량 모니터링</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      dateRange === range
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range === '7d' ? '7일' : range === '30d' ? '30일' : '90일'}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ArrowDownTrayIcon className="w-5 h-5" />
                내보내기
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">API 요청</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalApiCalls)}</p>
              </div>
            </div>
            <SimpleBarChart data={usageData} dataKey="apiCalls" color="bg-blue-500" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <CircleStackIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">저장소 (MB)</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalStorage)}</p>
              </div>
            </div>
            <SimpleBarChart data={usageData} dataKey="storage" color="bg-green-500" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CpuChipIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">AI 토큰</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalAiTokens)}</p>
              </div>
            </div>
            <SimpleBarChart data={usageData} dataKey="aiTokens" color="bg-purple-500" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <ServerIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">증빙 생성</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalEvidence)}</p>
              </div>
            </div>
            <SimpleBarChart data={usageData} dataKey="evidence" color="bg-amber-500" />
          </div>
        </div>

        {/* Usage Limits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">월간 사용량 한도</h2>
          <div className="space-y-4">
            {[
              { label: 'API 요청', used: totalApiCalls, limit: 1000000, unit: '회' },
              { label: '저장소', used: totalStorage, limit: 10240, unit: 'MB' },
              { label: 'AI 토큰', used: totalAiTokens, limit: 5000000, unit: '토큰' },
            ].map((item) => {
              const percentage = Math.min((item.used / item.limit) * 100, 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="text-gray-500">
                      {formatNumber(item.used)} / {formatNumber(item.limit)} {item.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percentage >= 90 ? 'bg-red-500' :
                        percentage >= 70 ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">상위 사용자</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topUsers.map((user, i) => (
              <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <p className="text-gray-500">API 요청</p>
                    <p className="font-medium text-gray-900">{formatNumber(user.apiCalls)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">저장소</p>
                    <p className="font-medium text-gray-900">{user.storage}GB</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">일별 사용량</h2>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4" />
              <span>최근 {dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'}일</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">API 요청</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">저장소 (MB)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">AI 토큰</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">증빙</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usageData.slice(-10).reverse().map((data) => (
                  <tr key={data.date} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {new Date(data.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatNumber(data.apiCalls)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatNumber(data.storage)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatNumber(data.aiTokens)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                      {data.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
