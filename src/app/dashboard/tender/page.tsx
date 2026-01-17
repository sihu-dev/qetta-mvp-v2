'use client';

import { useState } from 'react';

interface Bid {
  id: string;
  source: 'g2b' | 'ungm' | 'sam' | 'kz';
  title: string;
  budget: number;
  currency: string;
  deadline: string;
  status: 'new' | 'analyzing' | 'interested' | 'applied' | 'won' | 'lost';
  fit_score: number | null;
}

export default function TenderPage() {
  const [bids, setBids] = useState<Bid[]>([
    {
      id: '1',
      source: 'g2b',
      title: '스마트팩토리 MES 시스템 구축',
      budget: 850000000,
      currency: 'KRW',
      deadline: '2024-02-15',
      status: 'analyzing',
      fit_score: 78,
    },
    {
      id: '2',
      source: 'g2b',
      title: '설비 예지보전 시스템 도입',
      budget: 450000000,
      currency: 'KRW',
      deadline: '2024-02-20',
      status: 'interested',
      fit_score: 92,
    },
    {
      id: '3',
      source: 'ungm',
      title: 'Digital Transformation Consulting',
      budget: 500000,
      currency: 'USD',
      deadline: '2024-03-01',
      status: 'new',
      fit_score: null,
    },
    {
      id: '4',
      source: 'sam',
      title: 'Cloud Migration Services',
      budget: 1200000,
      currency: 'USD',
      deadline: '2024-02-28',
      status: 'applied',
      fit_score: 85,
    },
  ]);

  const [activeSource, setActiveSource] = useState<'all' | 'g2b' | 'ungm' | 'sam' | 'kz'>('all');
  const [isCollecting, setIsCollecting] = useState(false);

  const filteredBids = activeSource === 'all'
    ? bids
    : bids.filter(b => b.source === activeSource);

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'g2b': return '나라장터';
      case 'ungm': return 'UN Global';
      case 'sam': return 'SAM.gov';
      case 'kz': return 'Kazakhstan';
      default: return source;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-700';
      case 'analyzing': return 'bg-yellow-100 text-yellow-700';
      case 'interested': return 'bg-blue-100 text-blue-700';
      case 'applied': return 'bg-purple-100 text-purple-700';
      case 'won': return 'bg-green-100 text-green-700';
      case 'lost': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return '신규';
      case 'analyzing': return '분석중';
      case 'interested': return '관심';
      case 'applied': return '제출';
      case 'won': return '낙찰';
      case 'lost': return '유찰';
      default: return status;
    }
  };

  const formatBudget = (amount: number, currency: string) => {
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

  const handleCollect = () => {
    setIsCollecting(true);
    setTimeout(() => {
      setBids(prev => [{
        id: String(Date.now()),
        source: 'g2b',
        title: '신규 수집된 입찰 공고',
        budget: 600000000,
        currency: 'KRW',
        deadline: '2024-03-15',
        status: 'new',
        fit_score: null,
      }, ...prev]);
      setIsCollecting(false);
    }, 2000);
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
            onClick={handleCollect}
            disabled={isCollecting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isCollecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                수집 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                입찰 수집
              </>
            )}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            문서 생성
          </button>
        </div>
      </div>

      {/* Source Filters */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: '전체', count: bids.length },
          { key: 'g2b', label: '나라장터', count: bids.filter(b => b.source === 'g2b').length },
          { key: 'ungm', label: 'UN Global', count: bids.filter(b => b.source === 'ungm').length },
          { key: 'sam', label: 'SAM.gov', count: bids.filter(b => b.source === 'sam').length },
          { key: 'kz', label: 'Kazakhstan', count: bids.filter(b => b.source === 'kz').length },
        ].map(source => (
          <button
            key={source.key}
            onClick={() => setActiveSource(source.key as typeof activeSource)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSource === source.key
                ? 'bg-purple-100 text-purple-700'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {source.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeSource === source.key ? 'bg-purple-200' : 'bg-gray-100'
            }`}>
              {source.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bids Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBids.map((bid) => (
          <div
            key={bid.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {getSourceLabel(bid.source)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(bid.status)}`}>
                    {getStatusLabel(bid.status)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-2">{bid.title}</h3>
              </div>
              {bid.fit_score !== null && (
                <div className="flex-shrink-0 w-14 h-14 relative">
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke={bid.fit_score >= 80 ? '#22c55e' : bid.fit_score >= 60 ? '#eab308' : '#ef4444'}
                      strokeWidth="5"
                      strokeDasharray={`${(bid.fit_score / 100) * 151} 151`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {bid.fit_score}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">예산</span>
                <span className="font-medium text-gray-900">{formatBudget(bid.budget, bid.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">마감일</span>
                <span className="font-medium text-gray-900">
                  {new Date(bid.deadline).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                분석하기
              </button>
              <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                상세보기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
