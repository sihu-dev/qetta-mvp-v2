'use client';

/**
 * Workflows Management Page
 * n8n 워크플로우 관리
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PlayIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { BRAND } from '@/lib/brand';

interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  lastRun?: string;
  lastStatus?: 'success' | 'error' | 'running';
  executionCount: number;
  avgDuration: number;
  tags: string[];
}

interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'error' | 'running';
  startedAt: string;
  duration?: number;
  error?: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    // Mock data
    setWorkflows([
      {
        id: 'wf-1',
        name: 'G2B 입찰 수집',
        description: '나라장터 입찰 공고 자동 수집',
        active: true,
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        lastStatus: 'success',
        executionCount: 245,
        avgDuration: 45000,
        tags: ['tender', 'g2b'],
      },
      {
        id: 'wf-2',
        name: 'UNGM 입찰 수집',
        description: 'UN 글로벌 마켓플레이스 입찰 수집',
        active: true,
        lastRun: new Date(Date.now() - 7200000).toISOString(),
        lastStatus: 'success',
        executionCount: 89,
        avgDuration: 120000,
        tags: ['tender', 'ungm', 'international'],
      },
      {
        id: 'wf-3',
        name: '일일 적합도 분석',
        description: '신규 입찰 자동 적합도 분석',
        active: true,
        lastRun: new Date(Date.now() - 86400000).toISOString(),
        lastStatus: 'error',
        executionCount: 30,
        avgDuration: 180000,
        tags: ['analysis', 'daily'],
      },
      {
        id: 'wf-4',
        name: '증빙 자료 백업',
        description: 'Gov ZIP 파일 주기적 백업',
        active: false,
        lastRun: new Date(Date.now() - 172800000).toISOString(),
        lastStatus: 'success',
        executionCount: 15,
        avgDuration: 60000,
        tags: ['evidence', 'backup'],
      },
      {
        id: 'wf-5',
        name: '알림 발송',
        description: '마감 임박 입찰 알림',
        active: true,
        lastRun: new Date(Date.now() - 1800000).toISOString(),
        lastStatus: 'running',
        executionCount: 567,
        avgDuration: 5000,
        tags: ['notification', 'alert'],
      },
    ]);

    setExecutions([
      { id: 'ex-1', workflowId: 'wf-5', workflowName: '알림 발송', status: 'running', startedAt: new Date(Date.now() - 1800000).toISOString() },
      { id: 'ex-2', workflowId: 'wf-1', workflowName: 'G2B 입찰 수집', status: 'success', startedAt: new Date(Date.now() - 3600000).toISOString(), duration: 45230 },
      { id: 'ex-3', workflowId: 'wf-2', workflowName: 'UNGM 입찰 수집', status: 'success', startedAt: new Date(Date.now() - 7200000).toISOString(), duration: 118450 },
      { id: 'ex-4', workflowId: 'wf-3', workflowName: '일일 적합도 분석', status: 'error', startedAt: new Date(Date.now() - 86400000).toISOString(), duration: 45000, error: 'API rate limit exceeded' },
    ]);

    setLoading(false);
  }, []);

  const handleToggle = async (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === workflowId ? { ...wf, active: !wf.active } : wf
      )
    );
  };

  const handleTrigger = async (workflowId: string) => {
    setTriggering(workflowId);
    // Simulate trigger
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTriggering(null);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'running':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}초`;
    return `${(ms / 60000).toFixed(1)}분`;
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
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
              <h1 className="text-2xl font-bold text-gray-900">워크플로우 관리</h1>
              <p className="text-gray-500 mt-1">n8n 자동화 워크플로우 관리</p>
            </div>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CogIcon className="w-5 h-5" />
              n8n 대시보드
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">전체 워크플로우</p>
            <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">활성</p>
            <p className="text-2xl font-bold text-green-600">
              {workflows.filter((wf) => wf.active).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">오늘 실행</p>
            <p className="text-2xl font-bold text-blue-600">47</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">실패율</p>
            <p className="text-2xl font-bold text-gray-900">2.1%</p>
          </div>
        </div>

        {/* Workflows List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">워크플로우 목록</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
              <p className="text-gray-500 mt-2">로딩 중...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(workflow.lastStatus)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                        {workflow.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">{workflow.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>실행: {workflow.executionCount}회</span>
                        <span>평균: {formatDuration(workflow.avgDuration)}</span>
                        {workflow.lastRun && (
                          <span>마지막: {formatTimeAgo(workflow.lastRun)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTrigger(workflow.id)}
                      disabled={!workflow.active || triggering === workflow.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {triggering === workflow.id ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                      실행
                    </button>
                    <button
                      onClick={() => handleToggle(workflow.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        workflow.active ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          workflow.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Executions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">최근 실행</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(execution.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{execution.workflowName}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(execution.startedAt).toLocaleString('ko-KR')}
                    </p>
                    {execution.error && (
                      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {execution.error}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {execution.duration && (
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration(execution.duration)}
                    </p>
                  )}
                  <p className={`text-sm capitalize ${
                    execution.status === 'success' ? 'text-green-600' :
                    execution.status === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {execution.status === 'success' ? '성공' :
                     execution.status === 'error' ? '실패' : '실행 중'}
                  </p>
                </div>
              </div>
            ))}
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
