'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { BRAND, SERVICE_WORDING } from '@/lib/brand';
import { useTender } from '@/lib/hooks/useTender';
import type { TenderSource } from '@/lib/api/types';

const sourceLabels = SERVICE_WORDING.tender.sources;

export default function TenderPage() {
  const {
    tenders,
    loading,
    collecting,
    analyzing,
    error,
    collectTenders,
    analyzeTender,
    refresh,
  } = useTender({ autoFetch: true });

  const [activeSource, setActiveSource] = useState<'all' | TenderSource>('all');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const filteredTenders =
    activeSource === 'all' ? tenders : tenders.filter((t) => t.source === activeSource);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'awarded':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-600 bg-green-50';
      case 'B':
        return 'text-blue-600 bg-blue-50';
      case 'C':
        return 'text-yellow-600 bg-yellow-50';
      case 'D':
        return 'text-orange-600 bg-orange-50';
      case 'F':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatBudget = (amount?: number, currency?: string) => {
    if (!amount || !currency) return '-';
    if (currency === 'KRW') {
      if (amount >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억원`;
      }
      return `${(amount / 10000).toFixed(0)}만원`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCollect = async () => {
    const sources: TenderSource[] =
      activeSource === 'all' ? ['g2b', 'ungm', 'sam', 'kz'] : [activeSource];
    const result = await collectTenders(sources);
    if (result) {
      alert(`수집 완료: ${result.collected}건 (신규 ${result.newRecords}건)`);
    }
  };

  const handleAnalyze = async (tenderId: string) => {
    setAnalyzingId(tenderId);
    const result = await analyzeTender(tenderId);
    setAnalyzingId(null);
    if (result) {
      alert(`분석 완료: Fit Score ${result.fit_score} (${result.fit_grade}등급)`);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return '진행중';
      case 'closed':
        return '마감';
      case 'cancelled':
        return '취소';
      case 'awarded':
        return '낙찰';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">입찰 관리</h1>
          <p className="text-gray-500 mt-1">글로벌 입찰 공고 수집 및 분석</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={handleCollect}
            disabled={collecting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${collecting ? 'animate-spin' : ''}`} />
            {collecting ? '수집 중...' : SERVICE_WORDING.tender.collect}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <DocumentDuplicateIcon className="w-5 h-5" />
            {SERVICE_WORDING.tender.generate}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Source Filters */}
      <div className="flex items-center gap-2">
        <FunnelIcon className="w-5 h-5 text-gray-400" />
        {[
          { key: 'all', label: '전체', count: tenders.length },
          {
            key: 'g2b',
            label: sourceLabels.g2b,
            count: tenders.filter((b) => b.source === 'g2b').length,
          },
          {
            key: 'ungm',
            label: 'UN Global',
            count: tenders.filter((b) => b.source === 'ungm').length,
          },
          { key: 'sam', label: 'SAM.gov', count: tenders.filter((b) => b.source === 'sam').length },
          {
            key: 'kz',
            label: 'Kazakhstan',
            count: tenders.filter((b) => b.source === 'kz').length,
          },
        ].map((source) => (
          <button
            key={source.key}
            onClick={() => setActiveSource(source.key as typeof activeSource)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSource === source.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {source.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeSource === source.key ? 'bg-blue-200' : 'bg-gray-100'
              }`}
            >
              {source.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && tenders.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Tenders Grid */}
      {filteredTenders.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTenders.map((tender) => (
            <div
              key={tender.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {sourceLabels[tender.source as keyof typeof sourceLabels]}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tender.status)}`}
                    >
                      {getStatusLabel(tender.status)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{tender.title}</h3>
                </div>
                {tender.fit_score !== undefined && tender.fit_score !== null && (
                  <div className="flex-shrink-0 ml-4">
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
                          stroke={
                            tender.fit_score >= 85
                              ? '#22c55e'
                              : tender.fit_score >= 70
                                ? '#3b82f6'
                                : tender.fit_score >= 55
                                  ? '#eab308'
                                  : '#ef4444'
                          }
                          strokeWidth="6"
                          strokeDasharray={`${(tender.fit_score / 100) * 176} 176`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{tender.fit_score}</span>
                        {tender.fit_grade && (
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded ${getGradeColor(tender.fit_grade)}`}
                          >
                            {tender.fit_grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">예산</span>
                  <span className="font-medium text-gray-900">
                    {formatBudget(tender.budget?.amount, tender.budget?.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">마감일</span>
                  <span className="font-medium text-gray-900">
                    {new Date(tender.deadline).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                {tender.buyer?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">발주처</span>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">
                      {tender.buyer.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleAnalyze(tender.id)}
                  disabled={analyzing || analyzingId === tender.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {analyzingId === tender.id ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  )}
                  {analyzingId === tender.id ? '분석중...' : SERVICE_WORDING.tender.analyze}
                </button>
                <Link
                  href={`/dashboard/tender/${tender.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  상세보기
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTenders.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">해당 소스의 입찰 공고가 없습니다</p>
          <button
            onClick={handleCollect}
            disabled={collecting}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {collecting ? '수집 중...' : '입찰 수집하기'}
          </button>
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
