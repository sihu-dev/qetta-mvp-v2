'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  TagIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BRAND, SERVICE_WORDING } from '@/lib/brand';
import { useTender } from '@/lib/hooks/useTender';
import { PageLoading, EmptyState } from '@/components/dashboard';
import type { TenderRecord, TenderAnalysis } from '@/lib/api/types';

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;

  const { getTenderById, analyzeTender, analyzing } = useTender({ autoFetch: false });
  const [tender, setTender] = useState<TenderRecord | null>(null);
  const [analysis, setAnalysis] = useState<TenderAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTender() {
      setLoading(true);
      const data = await getTenderById(tenderId);
      if (data) {
        setTender(data);
      } else {
        setError('입찰 정보를 불러오는데 실패했습니다.');
      }
      setLoading(false);
    }
    fetchTender();
  }, [tenderId, getTenderById]);

  const handleAnalyze = async () => {
    const result = await analyzeTender(tenderId);
    if (result) {
      setAnalysis(result);
      if (tender) {
        setTender({
          ...tender,
          fit_score: result.fit_score,
          fit_grade: result.fit_grade,
        });
      }
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

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-700';
      case 'B':
        return 'bg-blue-100 text-blue-700';
      case 'C':
        return 'bg-yellow-100 text-yellow-700';
      case 'D':
        return 'bg-orange-100 text-orange-700';
      case 'F':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status?: string) => {
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

  if (loading) {
    return <PageLoading message="입찰 정보를 불러오는 중..." />;
  }

  if (error || !tender) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard/tender"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            목록으로
          </Link>
        </div>
        <EmptyState
          icon={<DocumentTextIcon className="w-12 h-12" />}
          title={error || '입찰 정보를 찾을 수 없습니다.'}
          action={
            <button
              onClick={() => router.push('/dashboard/tender')}
              className="text-blue-600 hover:text-blue-700"
            >
              목록으로 돌아가기
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/tender"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{tender.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
              {SERVICE_WORDING.tender.sources[tender.source as keyof typeof SERVICE_WORDING.tender.sources]}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tender.status)}`}>
              {tender.status === 'open' ? '진행중' : tender.status === 'closed' ? '마감' : tender.status}
            </span>
            {tender.fit_grade && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(tender.fit_grade)}`}>
                {tender.fit_grade}등급 (적합도 {tender.fit_score})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {analyzing ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5" />
            )}
            {analyzing ? '분석 중...' : SERVICE_WORDING.tender.analyze}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <DocumentDuplicateIcon className="w-5 h-5" />
            {SERVICE_WORDING.tender.generate}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {tender.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">공고 내용</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{tender.description}</p>
            </div>
          )}

          {/* Analysis Results */}
          {(analysis || tender.fit_score) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">적합도 분석 결과</h2>

              {/* Fit Score */}
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke={
                        (tender.fit_score || 0) >= 85
                          ? '#22c55e'
                          : (tender.fit_score || 0) >= 70
                            ? '#3b82f6'
                            : (tender.fit_score || 0) >= 55
                              ? '#eab308'
                              : '#ef4444'
                      }
                      strokeWidth="8"
                      strokeDasharray={`${((tender.fit_score || 0) / 100) * 251} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{tender.fit_score || 0}</span>
                    <span className="text-xs text-gray-500">점</span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {SERVICE_WORDING.fitGrade[(tender.fit_grade || 'C') as keyof typeof SERVICE_WORDING.fitGrade]}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    이 입찰에 대한 회사의 적합도를 나타냅니다.
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              {analysis?.scores && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">세부 평가</h3>
                  {Object.entries(analysis.scores).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-20">{key}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Strengths & Weaknesses */}
              {analysis && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">강점</h3>
                    <ul className="space-y-1">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">약점</h3>
                    <ul className="space-y-1">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis?.recommendations && analysis.recommendations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">전략 추천</h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-gray-500">예산</dt>
                  <dd className="font-medium text-gray-900">
                    {formatBudget(tender.budget?.amount, tender.budget?.currency)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-gray-500">마감일</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(tender.deadline).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-gray-500">발주처</dt>
                  <dd className="font-medium text-gray-900">{tender.buyer?.name || '-'}</dd>
                  {tender.buyer?.country && (
                    <dd className="text-sm text-gray-500">{tender.buyer.country}</dd>
                  )}
                </div>
              </div>
              {tender.category && (
                <div className="flex items-start gap-3">
                  <TagIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <dt className="text-sm text-gray-500">카테고리</dt>
                    <dd className="font-medium text-gray-900">{tender.category}</dd>
                  </div>
                </div>
              )}
              {tender.url && (
                <div className="flex items-start gap-3">
                  <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <dt className="text-sm text-gray-500">원본 링크</dt>
                    <dd>
                      <a
                        href={tender.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        공고 페이지 열기
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Keywords */}
          {tender.keywords && tender.keywords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">키워드</h2>
              <div className="flex flex-wrap gap-2">
                {tender.keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {tender.documents && tender.documents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">첨부 문서</h2>
              <ul className="space-y-2">
                {tender.documents.map((doc, i) => (
                  <li key={i}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                      {doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
  );
}
