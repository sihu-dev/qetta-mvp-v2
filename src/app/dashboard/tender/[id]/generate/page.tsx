'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BRAND, DOCUMENT_FORMATS, SERVICE_WORDING } from '@/lib/brand';
import { useTender } from '@/lib/hooks/useTender';
import { PageLoading, EmptyState } from '@/components/dashboard';
import type { TenderRecord } from '@/lib/api/types';

// Document type configuration
type DocumentTypeKey = 'proposal' | 'quotation' | 'presentation' | 'evidence';

interface DocumentTypeConfig {
  key: DocumentTypeKey;
  label: string;
  description: string;
  icon: typeof DocumentTextIcon;
  extension: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const documentTypes: DocumentTypeConfig[] = [
  {
    key: 'proposal',
    label: DOCUMENT_FORMATS.proposal.label,
    description: '입찰 공고에 맞춘 제안서를 자동으로 생성합니다. 회사 강점과 기술 역량을 포함합니다.',
    icon: DocumentTextIcon,
    extension: DOCUMENT_FORMATS.proposal.extension.toUpperCase(),
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    key: 'quotation',
    label: DOCUMENT_FORMATS.quotation.label,
    description: '예산 분석을 기반으로 상세 견적서를 생성합니다. 항목별 단가와 총액을 포함합니다.',
    icon: TableCellsIcon,
    extension: DOCUMENT_FORMATS.quotation.extension.toUpperCase(),
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    key: 'presentation',
    label: DOCUMENT_FORMATS.presentation.label,
    description: '프레젠테이션 발표자료를 생성합니다. 핵심 포인트와 시각적 자료를 포함합니다.',
    icon: PresentationChartBarIcon,
    extension: DOCUMENT_FORMATS.presentation.extension.toUpperCase(),
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    key: 'evidence',
    label: '제출 패키지',
    description: '모든 문서를 하나의 ZIP 파일로 묶어 제출용 패키지를 생성합니다.',
    icon: ArchiveBoxIcon,
    extension: DOCUMENT_FORMATS.evidence.extension.toUpperCase(),
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

// Generation status
type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

interface GeneratedDocument {
  type: DocumentTypeKey;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  buffer?: string; // base64
  success: boolean;
  error?: string;
}

interface GenerationState {
  status: GenerationStatus;
  progress: number;
  currentStep: string;
  documents: GeneratedDocument[];
  error?: string;
}

export default function TenderGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;

  const { getTenderById } = useTender({ autoFetch: false });
  const [tender, setTender] = useState<TenderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected document types
  const [selectedTypes, setSelectedTypes] = useState<DocumentTypeKey[]>(['proposal']);

  // Generation state
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    documents: [],
  });

  // Fetch tender info
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

  // Toggle document type selection
  const toggleDocType = useCallback((key: DocumentTypeKey) => {
    setSelectedTypes((prev) => {
      if (prev.includes(key)) {
        // Don't allow deselecting if it's the only one
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== key);
      }
      return [...prev, key];
    });
  }, []);

  // Generate documents
  const handleGenerate = async () => {
    if (selectedTypes.length === 0) return;

    setGenerationState({
      status: 'generating',
      progress: 0,
      currentStep: '문서 생성 준비 중...',
      documents: [],
    });

    try {
      // Simulate progress steps
      const steps = [
        { progress: 10, message: '입찰 정보 분석 중...' },
        { progress: 30, message: '회사 프로필 로딩 중...' },
        { progress: 50, message: '문서 템플릿 적용 중...' },
        { progress: 70, message: '콘텐츠 생성 중...' },
        { progress: 90, message: '파일 저장 중...' },
      ];

      for (const step of steps) {
        setGenerationState((prev) => ({
          ...prev,
          progress: step.progress,
          currentStep: step.message,
        }));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Call API
      const response = await fetch('/api/tender/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: tenderId,
          orgId: tender?.org_id || 'demo-org',
          autoGenerate: true,
          documentTypes: selectedTypes.filter((t) => t !== 'evidence'),
          returnBuffer: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '문서 생성에 실패했습니다.');
      }

      // Process results
      const generatedDocs: GeneratedDocument[] = [];

      if (selectedTypes.includes('proposal') && result.documents?.proposal) {
        generatedDocs.push({
          type: 'proposal',
          fileName: `${tender?.title?.slice(0, 30) || 'proposal'}_제안서.docx`,
          filePath: result.documents.proposal.filePath,
          fileSize: result.documents.proposal.fileSize,
          buffer: result.buffers?.proposal,
          success: result.documents.proposal.success,
          error: result.documents.proposal.error,
        });
      }

      if (selectedTypes.includes('quotation') && result.documents?.quotation) {
        generatedDocs.push({
          type: 'quotation',
          fileName: `${tender?.title?.slice(0, 30) || 'quotation'}_견적서.xlsx`,
          filePath: result.documents.quotation.filePath,
          fileSize: result.documents.quotation.fileSize,
          buffer: result.buffers?.quotation,
          success: result.documents.quotation.success,
          error: result.documents.quotation.error,
        });
      }

      if (selectedTypes.includes('presentation') && result.documents?.presentation) {
        generatedDocs.push({
          type: 'presentation',
          fileName: `${tender?.title?.slice(0, 30) || 'presentation'}_발표자료.pptx`,
          filePath: result.documents.presentation.filePath,
          fileSize: result.documents.presentation.fileSize,
          buffer: result.buffers?.presentation,
          success: result.documents.presentation.success,
          error: result.documents.presentation.error,
        });
      }

      // For evidence package (ZIP), we would need to create a separate endpoint
      if (selectedTypes.includes('evidence')) {
        generatedDocs.push({
          type: 'evidence',
          fileName: `${tender?.title?.slice(0, 30) || 'package'}_제출패키지.zip`,
          success: true, // Placeholder - would need actual ZIP generation
        });
      }

      setGenerationState({
        status: 'success',
        progress: 100,
        currentStep: '문서 생성 완료!',
        documents: generatedDocs,
      });
    } catch (err) {
      setGenerationState((prev) => ({
        ...prev,
        status: 'error',
        progress: 0,
        currentStep: '',
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
      }));
    }
  };

  // Download document
  const handleDownload = (doc: GeneratedDocument) => {
    if (doc.buffer) {
      // Convert base64 to blob and download
      const byteCharacters = atob(doc.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const mimeType = DOCUMENT_FORMATS[doc.type]?.mimeType || 'application/octet-stream';
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (doc.filePath) {
      // Server-side file path - would need download endpoint
      alert(`파일 경로: ${doc.filePath}\n(다운로드 엔드포인트가 필요합니다)`);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Reset generation state
  const handleReset = () => {
    setGenerationState({
      status: 'idle',
      progress: 0,
      currentStep: '',
      documents: [],
    });
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
      <div>
        <Link
          href={`/dashboard/tender/${tenderId}`}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          입찰 상세로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{SERVICE_WORDING.tender.generate}</h1>
        <p className="text-gray-500 mt-1">{tender.title}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Type Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">문서 타입 선택</h2>
            <p className="text-sm text-gray-500 mb-6">
              생성할 문서 타입을 선택하세요. 여러 개를 동시에 선택할 수 있습니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((docType) => {
                const isSelected = selectedTypes.includes(docType.key);
                const Icon = docType.icon;

                return (
                  <button
                    key={docType.key}
                    onClick={() => toggleDocType(docType.key)}
                    disabled={generationState.status === 'generating'}
                    className={`relative flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `${docType.borderColor} ${docType.bgColor}`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${generationState.status === 'generating' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircleIcon className={`w-6 h-6 ${docType.color}`} />
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`p-3 rounded-lg ${docType.bgColor} mb-4`}>
                      <Icon className={`w-6 h-6 ${docType.color}`} />
                    </div>

                    {/* Label */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{docType.label}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${docType.bgColor} ${docType.color}`}>
                        {docType.extension}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500">{docType.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generation Progress */}
          {generationState.status === 'generating' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">문서 생성 중...</h2>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">{generationState.currentStep}</span>
                  <span className="font-medium text-gray-700">{generationState.progress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${generationState.progress}%` }}
                  />
                </div>
              </div>

              {/* Loading animation */}
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            </div>
          )}

          {/* Generation Results */}
          {generationState.status === 'success' && generationState.documents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">생성 완료</h2>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  다시 시작
                </button>
              </div>

              <div className="space-y-3">
                {generationState.documents.map((doc) => {
                  const docConfig = documentTypes.find((d) => d.key === doc.type);
                  const Icon = docConfig?.icon || DocumentTextIcon;

                  return (
                    <div
                      key={doc.type}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        doc.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${docConfig?.bgColor || 'bg-gray-100'}`}>
                          <Icon className={`w-5 h-5 ${docConfig?.color || 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {doc.success ? formatFileSize(doc.fileSize) : doc.error}
                          </p>
                        </div>
                      </div>
                      {doc.success ? (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          다운로드
                        </button>
                      ) : (
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error State */}
          {generationState.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800">문서 생성 실패</h3>
                  <p className="text-sm text-red-600 mt-1">{generationState.error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-4 text-sm text-red-700 hover:text-red-800 underline"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Generate Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">문서 생성</h2>

            {/* Selected summary */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">선택된 문서:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTypes.map((type) => {
                  const docConfig = documentTypes.find((d) => d.key === type);
                  return (
                    <span
                      key={type}
                      className={`text-xs font-medium px-2 py-1 rounded ${docConfig?.bgColor || 'bg-gray-100'} ${docConfig?.color || 'text-gray-700'}`}
                    >
                      {docConfig?.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={selectedTypes.length === 0 || generationState.status === 'generating'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generationState.status === 'generating' ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="w-5 h-5" />
                  생성하기
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              AI가 입찰 정보를 분석하여 문서를 자동 생성합니다.
            </p>
          </div>

          {/* Tender Info Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">입찰 정보</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">공고명</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{tender.title}</dd>
              </div>
              <div>
                <dt className="text-gray-500">발주처</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{tender.buyer?.name || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">마감일</dt>
                <dd className="font-medium text-gray-900 mt-0.5">
                  {new Date(tender.deadline).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              {tender.fit_score && (
                <div>
                  <dt className="text-gray-500">적합도</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">
                    {tender.fit_score}점 ({tender.fit_grade}등급)
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
            <h3 className="font-semibold text-blue-900 mb-3">문서 생성 팁</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                제안서와 발표자료를 함께 생성하면 일관된 내용을 유지할 수 있습니다.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                견적서는 예산 정보를 기반으로 자동 계산됩니다.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                제출 패키지로 모든 문서를 한 번에 묶을 수 있습니다.
              </li>
            </ul>
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
  );
}
