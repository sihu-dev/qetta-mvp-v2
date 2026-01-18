'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  FolderIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import { BRAND, SERVICE_WORDING } from '@/lib/brand';
import { useEvidence } from '@/lib/hooks/useEvidence';
import { Modal, ModalFooter, PageLoading, EmptyState } from '@/components/dashboard';
import type { EvidenceRecord } from '@/lib/api/types';

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const { records, verifyRecord, downloadPackage, fetchRecords } = useEvidence({ autoFetch: false });
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    hash: string;
    details?: {
      manifest_check: boolean;
      hash_check: boolean;
      signature_check?: boolean;
    };
  } | null>(null);

  useEffect(() => {
    async function loadRecord() {
      setLoading(true);
      await fetchRecords();
      setLoading(false);
    }
    loadRecord();
  }, [fetchRecords]);

  useEffect(() => {
    const found = records.find((r) => r.id === recordId);
    if (found) {
      setRecord(found);
    }
  }, [records, recordId]);

  const handleVerify = async () => {
    setVerifying(true);
    const result = await verifyRecord(recordId);
    setVerifying(false);
    if (result) {
      setVerifyResult(result);
      setShowVerifyModal(true);
      // Update local record status
      if (record) {
        setRecord({
          ...record,
          status: result.valid ? 'verified' : 'failed',
          verified_at: result.valid ? new Date().toISOString() : undefined,
        });
      }
    }
  };

  const handleDownload = async () => {
    if (!record) return;
    setDownloading(true);
    await downloadPackage(record.package_id);
    setDownloading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <CheckCircleIcon className="w-4 h-4" />
            검증됨
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
            <XCircleIcon className="w-4 h-4" />
            검증 실패
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            <ExclamationCircleIcon className="w-4 h-4" />
            미검증
          </span>
        );
    }
  };

  if (loading) {
    return <PageLoading message="증빙 정보를 불러오는 중..." />;
  }

  if (!record) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard/evidence"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            목록으로
          </Link>
        </div>
        <EmptyState
          icon={<ShieldCheckIcon className="w-12 h-12" />}
          title="증빙 기록을 찾을 수 없습니다."
          action={
            <button
              onClick={() => router.push('/dashboard/evidence')}
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
            href="/dashboard/evidence"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            목록으로
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{record.file_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(record.status)}
            <span className="text-sm text-gray-500">
              MANIFEST v{record.manifest_version}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {verifying ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheckIcon className="w-5 h-5" />
            )}
            {verifying ? '검증 중...' : '무결성 검증'}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {downloading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowDownTrayIcon className="w-5 h-5" />
            )}
            {downloading ? '다운로드 중...' : 'Gov ZIP 다운로드'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-900">MANIFEST v{record.manifest_version} 증빙 패키지</p>
            <p className="text-sm text-blue-700 mt-1">
              &ldquo;변조 탐지 가능&rdquo; (tamper-evident) 시스템으로 데이터 무결성을 보장합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hash Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">해시 정보</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">SHA-256 해시</p>
              <code className="block text-sm font-mono text-gray-800 break-all">
                {record.file_hash}
              </code>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              이 해시값은 원본 파일의 무결성을 증명합니다. 동일한 해시값이 계산되면 파일이 변조되지 않았음을 의미합니다.
            </p>
          </div>

          {/* Metadata */}
          {record.metadata && Object.keys(record.metadata).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">메타데이터</h2>
              <dl className="grid grid-cols-2 gap-4">
                {record.metadata.project_id && (
                  <div>
                    <dt className="text-sm text-gray-500">프로젝트 ID</dt>
                    <dd className="font-medium text-gray-900">{record.metadata.project_id}</dd>
                  </div>
                )}
                {record.metadata.project_name && (
                  <div>
                    <dt className="text-sm text-gray-500">프로젝트명</dt>
                    <dd className="font-medium text-gray-900">{record.metadata.project_name}</dd>
                  </div>
                )}
                {record.metadata.created_by && (
                  <div>
                    <dt className="text-sm text-gray-500">생성자</dt>
                    <dd className="font-medium text-gray-900">{record.metadata.created_by}</dd>
                  </div>
                )}
              </dl>
              {record.metadata.tags && record.metadata.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">태그</p>
                  <div className="flex flex-wrap gap-2">
                    {record.metadata.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
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
                <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-gray-500">파일 크기</dt>
                  <dd className="font-medium text-gray-900">
                    {(record.file_size / 1024).toFixed(1)} KB
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FolderIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-gray-500">패키지 ID</dt>
                  <dd className="font-medium text-gray-900 font-mono text-sm">
                    {record.package_id}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-gray-500">생성일</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(record.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
              </div>
              {record.verified_at && (
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <dt className="text-sm text-gray-500">검증일</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(record.verified_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <HashtagIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <dt className="text-sm text-gray-500">MANIFEST 버전</dt>
                  <dd className="font-medium text-gray-900">v{record.manifest_version}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-3">{SERVICE_WORDING.evidenceRegistry.nameKo}</h3>
            <p className="text-sm opacity-80 mb-4">
              변조 탐지 가능한 증빙 패키지로 데이터 무결성을 보장합니다.
            </p>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              {verifying ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheckIcon className="w-4 h-4" />
              )}
              {verifying ? '검증 중...' : '무결성 검증 실행'}
            </button>
          </div>
        </div>
      </div>

      {/* Verify Result Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="무결성 검증 결과"
        size="md"
      >
        {verifyResult && (
          <div className="space-y-4">
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                verifyResult.valid ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {verifyResult.valid ? (
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              ) : (
                <XCircleIcon className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className={`font-semibold ${verifyResult.valid ? 'text-green-900' : 'text-red-900'}`}>
                  {verifyResult.valid ? '검증 성공' : '검증 실패'}
                </p>
                <p className={`text-sm ${verifyResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                  {verifyResult.valid
                    ? '데이터 무결성이 확인되었습니다.'
                    : '데이터 변조가 감지되었습니다.'}
                </p>
              </div>
            </div>

            {verifyResult.details && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">세부 검증 결과</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {verifyResult.details.manifest_check ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-gray-600">MANIFEST 검증</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {verifyResult.details.hash_check ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-gray-600">해시 검증</span>
                  </div>
                  {verifyResult.details.signature_check !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      {verifyResult.details.signature_check ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-600">서명 검증</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">검증된 해시</p>
              <code className="text-xs font-mono text-gray-700 break-all">{verifyResult.hash}</code>
            </div>

            <ModalFooter>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </ModalFooter>
          </div>
        )}
      </Modal>

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
