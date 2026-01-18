'use client';

/**
 * API Logs Viewer Page
 * API 요청/응답 로그 조회 및 필터링
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { DataTable, type Column } from '@/components/dashboard';

interface ApiLog {
  id: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  user_id?: string;
  created_at: string;
  request_body?: string;
  response_body?: string;
  [key: string]: unknown; // Index signature for DataTable compatibility
}

type FilterStatus = 'all' | 'success' | 'error';
type FilterMethod = 'all' | 'GET' | 'POST' | 'PUT' | 'DELETE';

export default function LogsPage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterMethod, setFilterMethod] = useState<FilterMethod>('all');
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  // Mock data for now
  useEffect(() => {
    const mockLogs: ApiLog[] = Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i + 1}`,
      method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
      path: [
        '/api/tender/analyze',
        '/api/tender/collect',
        '/api/evidence',
        '/api/evidence/verify',
        '/api/agi/prediction',
        '/api/agi/reasoning',
        '/api/health',
        '/api/metrics',
      ][Math.floor(Math.random() * 8)],
      status_code: Math.random() > 0.1 ? 200 : Math.random() > 0.5 ? 400 : 500,
      duration_ms: Math.floor(Math.random() * 2000) + 10,
      user_id: Math.random() > 0.3 ? `user-${Math.floor(Math.random() * 10) + 1}` : undefined,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
    }));
    setLogs(mockLogs);
    setLoading(false);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      if (search && !log.path.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Status filter
      if (filterStatus === 'success' && log.status_code >= 400) {
        return false;
      }
      if (filterStatus === 'error' && log.status_code < 400) {
        return false;
      }
      // Method filter
      if (filterMethod !== 'all' && log.method !== filterMethod) {
        return false;
      }
      return true;
    });
  }, [logs, search, filterStatus, filterMethod]);

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) {
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    }
    if (status >= 400 && status < 500) {
      return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
    }
    return <XCircleIcon className="w-4 h-4 text-red-500" />;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-700';
      case 'POST':
        return 'bg-blue-100 text-blue-700';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns: Column<ApiLog>[] = [
    {
      key: 'status_code',
      header: '상태',
      width: '80px',
      render: (log) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(log.status_code)}
          <span className={`font-medium ${
            log.status_code >= 200 && log.status_code < 300 ? 'text-green-600' :
            log.status_code >= 400 && log.status_code < 500 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {log.status_code}
          </span>
        </div>
      ),
    },
    {
      key: 'method',
      header: '메서드',
      width: '100px',
      sortable: true,
      render: (log) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(log.method)}`}>
          {log.method}
        </span>
      ),
    },
    {
      key: 'path',
      header: '경로',
      sortable: true,
      render: (log) => (
        <span className="font-mono text-sm text-gray-700">{log.path}</span>
      ),
    },
    {
      key: 'duration_ms',
      header: '응답 시간',
      width: '120px',
      sortable: true,
      render: (log) => (
        <span className={`font-medium ${
          log.duration_ms < 100 ? 'text-green-600' :
          log.duration_ms < 500 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {log.duration_ms}ms
        </span>
      ),
    },
    {
      key: 'created_at',
      header: '시간',
      width: '180px',
      sortable: true,
      render: (log) => (
        <span className="text-gray-500 text-sm">
          {new Date(log.created_at).toLocaleString('ko-KR')}
        </span>
      ),
    },
  ];

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <RoleGate allowedRoles={['developer', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/dev"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            개발자 대시보드
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API 로그</h1>
              <p className="text-gray-500 mt-1">API 요청/응답 로그 조회</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="경로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">모든 상태</option>
                <option value="success">성공 (2xx)</option>
                <option value="error">에러 (4xx, 5xx)</option>
              </select>
            </div>

            {/* Method Filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as FilterMethod)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 메서드</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">전체 요청</p>
            <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">성공</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredLogs.filter((l) => l.status_code < 400).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">에러</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredLogs.filter((l) => l.status_code >= 400).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">평균 응답</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredLogs.length > 0
                ? Math.round(filteredLogs.reduce((a, l) => a + l.duration_ms, 0) / filteredLogs.length)
                : 0}ms
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <DataTable
          data={filteredLogs}
          columns={columns}
          keyField="id"
          pageSize={15}
          loading={loading}
          emptyMessage="로그가 없습니다."
          onRowClick={(log) => setSelectedLog(log)}
        />

        {/* Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">로그 상세</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">메서드</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(selectedLog.method)}`}>
                      {selectedLog.method}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">상태 코드</p>
                    <p className="font-medium">{selectedLog.status_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">경로</p>
                    <p className="font-mono text-sm">{selectedLog.path}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">응답 시간</p>
                    <p className="font-medium">{selectedLog.duration_ms}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">시간</p>
                    <p>{new Date(selectedLog.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">사용자 ID</p>
                    <p>{selectedLog.user_id || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
