'use client';

/**
 * API Test Console Page
 * API 엔드포인트 테스트
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlayIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { BRAND } from '@/lib/brand';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  defaultBody?: object;
}

interface TestHistory {
  id: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  response?: unknown;
}

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/health', description: '헬스체크' },
  { method: 'GET', path: '/api/health/ready', description: '준비 상태 체크' },
  { method: 'GET', path: '/api/health/live', description: '라이브 체크' },
  { method: 'GET', path: '/api/metrics', description: '시스템 메트릭' },
  { method: 'GET', path: '/api/evidence', description: '증빙 목록 조회' },
  { method: 'POST', path: '/api/evidence', description: '증빙 생성', defaultBody: { title: 'Test Evidence', category: 'test' } },
  { method: 'POST', path: '/api/evidence/verify', description: '증빙 검증', defaultBody: { id: 'test-id' } },
  { method: 'GET', path: '/api/tender/collect', description: '입찰 수집' },
  { method: 'POST', path: '/api/tender/analyze', description: '입찰 분석', defaultBody: { tenderId: 'test-tender' } },
  { method: 'POST', path: '/api/tender/generate', description: '문서 생성', defaultBody: { tenderId: 'test-tender', type: 'proposal' } },
  { method: 'POST', path: '/api/agi/prediction', description: 'AI 예측', defaultBody: { input: 'test query' } },
  { method: 'POST', path: '/api/agi/reasoning', description: 'AI 추론', defaultBody: { query: 'test query' } },
  { method: 'GET', path: '/api/agi/memory', description: 'AI 메모리 조회' },
  { method: 'POST', path: '/api/agi/orchestrate', description: 'AI 오케스트레이션', defaultBody: { task: 'test task' } },
];

export default function TestPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [copied, setCopied] = useState(false);

  const handleEndpointSelect = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.defaultBody ? JSON.stringify(endpoint.defaultBody, null, 2) : '');
    setResponse(null);
    setError(null);
    setDuration(null);
    setStatusCode(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        try {
          options.body = requestBody;
        } catch {
          throw new Error('Invalid JSON body');
        }
      }

      const res = await fetch(selectedEndpoint.path, options);
      const elapsed = Date.now() - startTime;
      setDuration(elapsed);
      setStatusCode(res.status);

      const data = await res.json();
      setResponse(data);

      // Add to history
      const historyItem: TestHistory = {
        id: `test-${Date.now()}`,
        method: selectedEndpoint.method,
        path: selectedEndpoint.path,
        status: res.status,
        duration: elapsed,
        timestamp: new Date().toISOString(),
        response: data,
      };
      setHistory((prev) => [historyItem, ...prev].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      setDuration(Date.now() - startTime);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h1 className="text-2xl font-bold text-gray-900">API 테스트 콘솔</h1>
          <p className="text-gray-500 mt-1">API 엔드포인트 테스트 및 디버깅</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoint List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">엔드포인트</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {ENDPOINTS.map((endpoint, i) => (
                <button
                  key={i}
                  onClick={() => handleEndpointSelect(endpoint)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                    selectedEndpoint === endpoint ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-gray-700 truncate">{endpoint.path}</p>
                    <p className="text-xs text-gray-500">{endpoint.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Request/Response */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getMethodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm text-gray-700">{selectedEndpoint.path}</span>
                </div>
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                  실행
                </button>
              </div>

              {selectedEndpoint.method !== 'GET' && (
                <div className="p-4 border-b border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full h-32 px-3 py-2 font-mono text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder='{ "key": "value" }'
                  />
                </div>
              )}

              {/* Response */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Response</span>
                    {statusCode && (
                      <span className={`text-sm font-medium ${
                        statusCode >= 200 && statusCode < 300 ? 'text-green-600' :
                        statusCode >= 400 && statusCode < 500 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {statusCode}
                      </span>
                    )}
                    {duration && (
                      <span className="text-sm text-gray-500">{duration}ms</span>
                    )}
                  </div>
                  {response !== null && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                    >
                      {copied ? (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      )}
                      {copied ? '복사됨' : '복사'}
                    </button>
                  )}
                </div>

                {error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                  </div>
                ) : response !== null ? (
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto max-h-80">
                    <code>{JSON.stringify(response, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    실행 버튼을 클릭하여 API를 테스트하세요
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">최근 테스트</h2>
                </div>
                <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const endpoint = ENDPOINTS.find(
                          (e) => e.path === item.path && e.method === item.method
                        );
                        if (endpoint) {
                          handleEndpointSelect(endpoint);
                          setResponse(item.response);
                          setStatusCode(item.status);
                          setDuration(item.duration);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMethodColor(item.method)}`}>
                          {item.method}
                        </span>
                        <span className="font-mono text-sm text-gray-700">{item.path}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`font-medium ${
                          item.status >= 200 && item.status < 300 ? 'text-green-600' :
                          item.status >= 400 && item.status < 500 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-gray-500">{item.duration}ms</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(item.timestamp).toLocaleTimeString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
    </RoleGate>
  );
}
