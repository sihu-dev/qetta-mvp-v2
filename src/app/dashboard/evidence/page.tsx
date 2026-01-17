'use client';

import { useEffect, useState } from 'react';

interface Snapshot {
  id: string;
  period_start: string;
  period_end: string;
  event_count: number;
  action_count: number;
  alarm_count: number;
  package_hash: string;
  created_at: string;
  verified: boolean;
}

export default function EvidencePage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Simulate loading snapshots
    setTimeout(() => {
      setSnapshots([
        {
          id: '1',
          period_start: '2024-01-01',
          period_end: '2024-01-31',
          event_count: 1523,
          action_count: 45,
          alarm_count: 12,
          package_hash: 'sha256:a1b2c3d4e5f6...',
          created_at: '2024-02-01T09:00:00Z',
          verified: true,
        },
        {
          id: '2',
          period_start: '2024-02-01',
          period_end: '2024-02-29',
          event_count: 1891,
          action_count: 52,
          alarm_count: 8,
          package_hash: 'sha256:f6e5d4c3b2a1...',
          created_at: '2024-03-01T09:00:00Z',
          verified: true,
        },
        {
          id: '3',
          period_start: '2024-03-01',
          period_end: '2024-03-31',
          event_count: 2134,
          action_count: 61,
          alarm_count: 15,
          package_hash: 'sha256:1a2b3c4d5e6f...',
          created_at: '2024-04-01T09:00:00Z',
          verified: false,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateSnapshot = () => {
    setIsCreating(true);
    // Simulate creating snapshot
    setTimeout(() => {
      setIsCreating(false);
      alert('증빙 스냅샷이 생성되었습니다.');
    }, 2000);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">증빙 관리</h1>
          <p className="text-gray-500 mt-1">Gov ZIP 패키지 생성 및 검증</p>
        </div>
        <button
          onClick={handleCreateSnapshot}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              생성 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 스냅샷 생성
            </>
          )}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-medium text-purple-900">MANIFEST v1.2 증빙 패키지</p>
            <p className="text-sm text-purple-700 mt-1">
              &ldquo;변조 탐지 가능&rdquo; (tamper-evident) 시스템으로 데이터 무결성을 보장합니다.
              <br />
              패키지에는 events.csv, actions.csv, MANIFEST.json이 포함됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">스냅샷 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이벤트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조치</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">알람</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">해시</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {snapshot.period_start} ~ {snapshot.period_end}
                      </p>
                      <p className="text-sm text-gray-500">
                        생성: {new Date(snapshot.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {snapshot.event_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {snapshot.action_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${snapshot.alarm_count > 10 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {snapshot.alarm_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {snapshot.package_hash}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {snapshot.verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        검증됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        미검증
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        검증
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                        다운로드
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
