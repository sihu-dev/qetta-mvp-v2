'use client';

import { useState } from 'react';
import {
  PlusIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { BRAND, SERVICE_WORDING } from '@/lib/brand';
import { useEvidence } from '@/lib/hooks/useEvidence';

export default function EvidencePage() {
  const {
    records,
    loading,
    error,
    verifyRecord,
    downloadPackage,
    refresh,
  } = useEvidence({ autoFetch: true });

  const [isCreating, setIsCreating] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    // TODO: Implement create snapshot API call
    setTimeout(() => {
      setIsCreating(false);
      alert('증빙 스냅샷이 생성되었습니다.');
      refresh();
    }, 2000);
  };

  const handleVerify = async (recordId: string) => {
    setVerifyingId(recordId);
    const result = await verifyRecord(recordId);
    setVerifyingId(null);

    if (result) {
      alert(result.valid ? '검증 완료: 데이터 무결성 확인됨' : '검증 실패: 데이터 변조 감지');
    }
  };

  const handleDownload = async (packageId: string) => {
    setDownloadingId(packageId);
    await downloadPackage(packageId);
    setDownloadingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircleIcon className="w-3 h-3" />
            검증됨
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircleIcon className="w-3 h-3" />
            실패
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <ExclamationCircleIcon className="w-3 h-3" />
            미검증
          </span>
        );
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {SERVICE_WORDING.evidenceRegistry.nameKo}
          </h1>
          <p className="text-gray-500 mt-1">{SERVICE_WORDING.evidenceRegistry.desc}</p>
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
            onClick={handleCreateSnapshot}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5" />
                새 스냅샷 생성
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-900">MANIFEST v1.2 증빙 패키지</p>
            <p className="text-sm text-blue-700 mt-1">
              &ldquo;변조 탐지 가능&rdquo; (tamper-evident) 시스템으로 데이터 무결성을 보장합니다.
              <br />
              패키지에는 events.csv, actions.csv, MANIFEST.json이 포함됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">증빙 기록 목록</h2>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">아직 증빙 기록이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">새 스냅샷을 생성하여 시작하세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    파일명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    크기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    해시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{record.file_name}</p>
                        {record.metadata?.project_name && (
                          <p className="text-sm text-gray-500">{record.metadata.project_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(record.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {record.file_hash.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(record.id)}
                          disabled={verifyingId === record.id}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                        >
                          {verifyingId === record.id ? (
                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheckIcon className="w-3 h-3" />
                          )}
                          검증
                        </button>
                        <button
                          onClick={() => handleDownload(record.package_id)}
                          disabled={downloadingId === record.package_id}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm font-medium disabled:opacity-50"
                        >
                          {downloadingId === record.package_id ? (
                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                          ) : (
                            <ArrowDownTrayIcon className="w-3 h-3" />
                          )}
                          다운로드
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
