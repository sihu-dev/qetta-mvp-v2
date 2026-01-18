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
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  UsersIcon,
  TrophyIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { BRAND, SERVICE_WORDING } from '@/lib/brand';
import { useTender } from '@/lib/hooks/useTender';
import { PageLoading, EmptyState } from '@/components/dashboard';
import type { TenderRecord, TenderAnalysis, QualificationCheck, RequiredDocument, CompetitionLevel } from '@/lib/api/types';

// Fit Score 원형 차트 컴포넌트
function FitScoreChart({ score, size = 'lg' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = {
    sm: { width: 64, radius: 24, stroke: 4 },
    md: { width: 96, radius: 36, stroke: 6 },
    lg: { width: 128, radius: 48, stroke: 8 },
  };

  const { width, radius, stroke } = dimensions[size];
  const center = width / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#22c55e'; // green-500
    if (score >= 70) return '#3b82f6'; // blue-500
    if (score >= 55) return '#eab308'; // yellow-500
    if (score >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="relative" style={{ width, height: width }}>
      <svg className="transform -rotate-90" width={width} height={width}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth={stroke}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-gray-900 ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'}`}>
          {score}
        </span>
        <span className={`text-gray-500 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>점</span>
      </div>
    </div>
  );
}

// Fit Grade 배지 컴포넌트
function FitGradeBadge({ grade }: { grade: string }) {
  const gradeStyles: Record<string, string> = {
    A: 'bg-green-100 text-green-700 border-green-200',
    B: 'bg-blue-100 text-blue-700 border-blue-200',
    C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    D: 'bg-orange-100 text-orange-700 border-orange-200',
    F: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${gradeStyles[grade] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      <TrophyIcon className="w-5 h-5" />
      <span className="font-bold text-lg">{grade}등급</span>
      <span className="text-sm">
        ({SERVICE_WORDING.fitGrade[grade as keyof typeof SERVICE_WORDING.fitGrade] || '미분류'})
      </span>
    </div>
  );
}

// 자격요건 체크리스트 컴포넌트
function QualificationChecklist({ qualifications }: { qualifications: QualificationCheck[] }) {
  const metCount = qualifications.filter(q => q.met).length;
  const totalCount = qualifications.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
          자격요건 충족 현황
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          metCount === totalCount
            ? 'bg-green-100 text-green-700'
            : metCount >= totalCount / 2
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
        }`}>
          {metCount}/{totalCount} 충족
        </span>
      </div>
      <ul className="space-y-3">
        {qualifications.map((qual, idx) => (
          <li key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${qual.met ? 'bg-green-50' : 'bg-red-50'}`}>
            {qual.met ? (
              <CheckCircleSolidIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${qual.met ? 'text-green-900' : 'text-red-900'}`}>
                {qual.requirement}
              </p>
              {qual.note && (
                <p className={`text-sm mt-1 ${qual.met ? 'text-green-700' : 'text-red-700'}`}>
                  {qual.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 필수 서류 목록 컴포넌트
function RequiredDocumentsList({ documents }: { documents: RequiredDocument[] }) {
  const mandatoryDocs = documents.filter(d => d.mandatory);
  const optionalDocs = documents.filter(d => !d.mandatory);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <DocumentCheckIcon className="w-5 h-5 text-blue-600" />
        필수 서류 목록
      </h3>

      {mandatoryDocs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            필수 제출
          </h4>
          <ul className="space-y-2">
            {mandatoryDocs.map((doc, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-gray-900">{doc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {doc.format.join(', ').toUpperCase()}
                  </span>
                  {doc.deadline && (
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      {new Date(doc.deadline).toLocaleDateString('ko-KR')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {optionalDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-gray-400" />
            선택 제출
          </h4>
          <ul className="space-y-2">
            {optionalDocs.map((doc, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{doc.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {doc.format.join(', ').toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 경쟁 강도 컴포넌트
function CompetitionIntensity({ level, competitorCount }: { level: CompetitionLevel; competitorCount?: number }) {
  const levelConfig: Record<CompetitionLevel, { label: string; color: string; bgColor: string; bars: number }> = {
    low: { label: '낮음', color: 'text-green-600', bgColor: 'bg-green-500', bars: 1 },
    medium: { label: '보통', color: 'text-yellow-600', bgColor: 'bg-yellow-500', bars: 2 },
    high: { label: '높음', color: 'text-red-600', bgColor: 'bg-red-500', bars: 3 },
  };

  const config = levelConfig[level];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <UsersIcon className="w-5 h-5 text-blue-600" />
        경쟁 강도
      </h3>
      <div className="flex items-center gap-4">
        <div className="flex items-end gap-1">
          {[1, 2, 3].map(bar => (
            <div
              key={bar}
              className={`w-4 rounded-t transition-all ${
                bar <= config.bars ? config.bgColor : 'bg-gray-200'
              }`}
              style={{ height: `${bar * 12}px` }}
            />
          ))}
        </div>
        <div>
          <p className={`font-bold text-lg ${config.color}`}>{config.label}</p>
          {competitorCount !== undefined && (
            <p className="text-sm text-gray-500">예상 경쟁사: {competitorCount}개사</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 낙찰 확률 컴포넌트
function WinProbability({ probability }: { probability: number }) {
  const getColorClass = (prob: number) => {
    if (prob >= 70) return { text: 'text-green-600', bg: 'bg-green-500' };
    if (prob >= 50) return { text: 'text-blue-600', bg: 'bg-blue-500' };
    if (prob >= 30) return { text: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { text: 'text-red-600', bg: 'bg-red-500' };
  };

  const colors = getColorClass(probability);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <ChartBarIcon className="w-5 h-5 text-blue-600" />
        낙찰 확률
      </h3>
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${colors.text}`}>{probability}%</span>
          <span className="text-sm text-gray-500">예상 낙찰 확률</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${colors.bg}`}
            style={{ width: `${probability}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          {probability >= 70 ? '높은 낙찰 가능성' :
           probability >= 50 ? '적극적인 준비 권장' :
           probability >= 30 ? '전략적 접근 필요' : '신중한 검토 필요'}
        </p>
      </div>
    </div>
  );
}

// 권장사항 컴포넌트
function Recommendations({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <LightBulbIcon className="w-5 h-5 text-blue-600" />
        권장사항
      </h3>
      <ul className="space-y-3">
        {recommendations.map((rec, idx) => (
          <li key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              {idx + 1}
            </span>
            <p className="text-gray-700">{rec}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  const handleGenerateDocument = () => {
    router.push(`/dashboard/tender/${tenderId}/generate`);
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

  const getStatusLabel = (status?: string) => {
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
        return status || '-';
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

  // Mock analysis data for demonstration (remove in production)
  const mockAnalysis: TenderAnalysis = analysis || {
    id: 'mock-analysis',
    tender_id: tenderId,
    fit_score: tender.fit_score || 75,
    fit_grade: (tender.fit_grade as 'A' | 'B' | 'C' | 'D' | 'F') || 'B',
    scores: {
      qualification: 85,
      financial: 70,
      experience: 80,
      expertise: 75,
      timing: 65,
      competition: 70,
    },
    strengths: [
      '해당 분야의 풍부한 경험 보유',
      '적정 예산 범위 내 수행 가능',
      '관련 인증 및 자격 보유',
    ],
    weaknesses: [
      '유사 프로젝트 직접 수행 경험 부족',
      '마감일까지 준비 시간 촉박',
    ],
    recommendations: [
      '제안서에 유사 프로젝트 수행 경험을 상세히 기술하세요',
      '기술력 입증을 위한 포트폴리오를 준비하세요',
      '가격 경쟁력 확보를 위한 원가 분석을 진행하세요',
      '협력사 네트워크를 활용한 컨소시엄 구성을 검토하세요',
    ],
    qualifications_met: [
      { requirement: '사업자등록증', met: true, note: '유효기간 내 확인됨' },
      { requirement: 'ISO 9001 인증', met: true, note: '2025년 갱신 완료' },
      { requirement: '관련 실적 3건 이상', met: true, note: '5건 보유' },
      { requirement: '기술인력 5인 이상', met: false, note: '현재 3명, 2명 추가 필요' },
      { requirement: '재무건전성 요건', met: true, note: '부채비율 적정' },
    ],
    required_documents: [
      { name: '사업자등록증 사본', format: ['pdf'], mandatory: true },
      { name: '제안서', format: ['docx', 'pdf'], mandatory: true, deadline: tender.deadline },
      { name: '견적서', format: ['xlsx', 'pdf'], mandatory: true },
      { name: '기술인력 현황표', format: ['xlsx'], mandatory: true },
      { name: '유사실적 증빙', format: ['pdf'], mandatory: true },
      { name: '회사소개서', format: ['pptx', 'pdf'], mandatory: false },
      { name: '추가 포트폴리오', format: ['pdf'], mandatory: false },
    ],
    competition_level: 'medium',
    win_probability: 62,
    competitor_count: 8,
    market_insights: [],
    created_at: new Date().toISOString(),
  };

  const hasAnalysis = tender.fit_score !== undefined && tender.fit_score !== null;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Title & Info */}
          <div className="flex-1">
            <Link
              href="/dashboard/tender"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              목록으로
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{tender.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {SERVICE_WORDING.tender.sources[tender.source as keyof typeof SERVICE_WORDING.tender.sources]}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tender.status)}`}>
                {getStatusLabel(tender.status)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {formatBudget(tender.budget?.amount, tender.budget?.currency)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {new Date(tender.deadline).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
            >
              {analyzing ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="w-5 h-5" />
              )}
              {analyzing ? '분석 중...' : '분석하기'}
            </button>
            <button
              onClick={handleGenerateDocument}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <DocumentDuplicateIcon className="w-5 h-5" />
              문서 생성
            </button>
            <Link
              href="/dashboard/tender"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              목록으로
            </Link>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      {hasAnalysis && (
        <>
          {/* Fit Score & Grade */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <FitScoreChart score={tender.fit_score || 0} size="lg" />
              <div className="text-center md:text-left">
                <FitGradeBadge grade={tender.fit_grade || 'C'} />
                <p className="mt-4 text-gray-600 max-w-md">
                  이 입찰 공고에 대한 회사의 종합 적합도입니다.
                  자격요건, 재무상태, 경험, 전문성, 일정, 경쟁 상황을 종합적으로 분석한 결과입니다.
                </p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          {mockAnalysis.scores && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                세부 평가 점수
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(mockAnalysis.scores).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    qualification: '자격요건',
                    financial: '재무상태',
                    experience: '경험',
                    expertise: '전문성',
                    timing: '일정',
                    competition: '경쟁력',
                  };
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{labels[key] || key}</span>
                        <span className="text-sm font-bold text-gray-900">{value}점</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            value >= 80 ? 'bg-green-500' :
                            value >= 60 ? 'bg-blue-500' :
                            value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analysis Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competition & Win Probability */}
            <div className="space-y-6">
              {mockAnalysis.competition_level && (
                <CompetitionIntensity
                  level={mockAnalysis.competition_level}
                  competitorCount={mockAnalysis.competitor_count}
                />
              )}
              {mockAnalysis.win_probability !== undefined && (
                <WinProbability probability={mockAnalysis.win_probability} />
              )}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    강점
                  </h4>
                  <ul className="space-y-2">
                    {mockAnalysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                        <CheckCircleSolidIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    약점
                  </h4>
                  <ul className="space-y-2">
                    {mockAnalysis.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Qualification Checklist */}
          {mockAnalysis.qualifications_met && mockAnalysis.qualifications_met.length > 0 && (
            <QualificationChecklist qualifications={mockAnalysis.qualifications_met} />
          )}

          {/* Required Documents */}
          {mockAnalysis.required_documents && mockAnalysis.required_documents.length > 0 && (
            <RequiredDocumentsList documents={mockAnalysis.required_documents} />
          )}

          {/* Recommendations */}
          {mockAnalysis.recommendations && mockAnalysis.recommendations.length > 0 && (
            <Recommendations recommendations={mockAnalysis.recommendations} />
          )}
        </>
      )}

      {/* No Analysis State */}
      {!hasAnalysis && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">분석 결과가 없습니다</h3>
          <p className="text-gray-500 mb-6">
            입찰 공고를 분석하여 적합도, 자격요건, 경쟁 강도 등을 확인하세요.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {analyzing ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5" />
            )}
            {analyzing ? '분석 중...' : '분석 시작하기'}
          </button>
        </div>
      )}

      {/* Tender Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description */}
        <div className="lg:col-span-2 space-y-6">
          {tender.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">공고 내용</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{tender.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">키워드</h3>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">첨부 문서</h3>
              <ul className="space-y-2">
                {tender.documents.map((doc, i) => (
                  <li key={i}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 hover:bg-gray-50 rounded-lg transition-colors"
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
      <div className="text-center text-sm text-gray-400 pt-8 border-t border-gray-100">
        <p className="font-medium" style={{ color: BRAND.colors.primary }}>{BRAND.name}</p>
        <p>
          {BRAND.slogan} - {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}
