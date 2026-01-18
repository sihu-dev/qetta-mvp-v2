'use client';

/**
 * System Settings Page
 * API 키 및 환경 설정
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  KeyIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { BRAND } from '@/lib/brand';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: 'production' | 'development';
  lastUsed?: string;
  createdAt: string;
}

interface Setting {
  key: string;
  label: string;
  description: string;
  type: 'toggle' | 'input' | 'select';
  value: string | boolean | number;
  options?: { value: string; label: string }[];
}

export default function SettingsPage() {
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apiKeys: ApiKey[] = [
    { id: '1', name: 'Production API Key', key: 'sk-prod-xxxx-xxxx-xxxx-xxxx1234', type: 'production', lastUsed: '2024-01-18', createdAt: '2024-01-01' },
    { id: '2', name: 'Development API Key', key: 'sk-dev-xxxx-xxxx-xxxx-xxxx5678', type: 'development', lastUsed: '2024-01-17', createdAt: '2024-01-05' },
  ];

  const [generalSettings, setGeneralSettings] = useState<Setting[]>([
    { key: 'site_name', label: '사이트 이름', description: '시스템에 표시되는 사이트 이름', type: 'input', value: 'Qetta' },
    { key: 'default_language', label: '기본 언어', description: '시스템 기본 언어 설정', type: 'select', value: 'ko', options: [{ value: 'ko', label: '한국어' }, { value: 'en', label: 'English' }] },
    { key: 'timezone', label: '시간대', description: '시스템 시간대 설정', type: 'select', value: 'Asia/Seoul', options: [{ value: 'Asia/Seoul', label: 'Asia/Seoul (KST)' }, { value: 'UTC', label: 'UTC' }] },
  ]);

  const [securitySettings, setSecuritySettings] = useState<Setting[]>([
    { key: 'two_factor', label: '2단계 인증', description: '관리자 계정에 2단계 인증 필수', type: 'toggle', value: true },
    { key: 'session_timeout', label: '세션 타임아웃', description: '비활성 세션 자동 로그아웃 (분)', type: 'input', value: 30 },
    { key: 'max_login_attempts', label: '최대 로그인 시도', description: '계정 잠금 전 허용 로그인 시도 횟수', type: 'input', value: 5 },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<Setting[]>([
    { key: 'email_notifications', label: '이메일 알림', description: '시스템 알림을 이메일로 전송', type: 'toggle', value: true },
    { key: 'slack_webhook', label: 'Slack Webhook', description: 'Slack 알림 Webhook URL', type: 'input', value: '' },
    { key: 'alert_threshold', label: '알림 임계값', description: 'API 에러율 알림 임계값 (%)', type: 'input', value: 5 },
  ]);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const renderSetting = (
    setting: Setting,
    settings: Setting[],
    setSettings: React.Dispatch<React.SetStateAction<Setting[]>>
  ) => {
    const updateValue = (value: string | boolean | number) => {
      setSettings((prev) =>
        prev.map((s) => (s.key === setting.key ? { ...s, value } : s))
      );
    };

    return (
      <div key={setting.key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{setting.label}</p>
          <p className="text-sm text-gray-500">{setting.description}</p>
        </div>
        <div className="ml-4">
          {setting.type === 'toggle' && (
            <button
              onClick={() => updateValue(!setting.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                setting.value ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  setting.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
          {setting.type === 'input' && (
            <input
              type={typeof setting.value === 'number' ? 'number' : 'text'}
              value={setting.value as string | number}
              onChange={(e) => updateValue(typeof setting.value === 'number' ? Number(e.target.value) : e.target.value)}
              className="w-48 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          )}
          {setting.type === 'select' && setting.options && (
            <select
              value={setting.value as string}
              onChange={(e) => updateValue(e.target.value)}
              className="w-48 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {setting.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  };

  return (
    <RoleGate allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            관리자 대시보드
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
              <p className="text-gray-500 mt-1">API 키 및 환경 설정</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <CheckIcon className="w-5 h-5" />
              )}
              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <KeyIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">API 키</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{apiKey.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      apiKey.type === 'production' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {apiKey.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showKey === apiKey.id ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(apiKey.key)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {copied === apiKey.key ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded">
                  {showKey === apiKey.id ? apiKey.key : '••••••••••••••••••••••••'}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                  <span>생성: {new Date(apiKey.createdAt).toLocaleDateString('ko-KR')}</span>
                  {apiKey.lastUsed && (
                    <span>최근 사용: {new Date(apiKey.lastUsed).toLocaleDateString('ko-KR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              + 새 API 키 생성
            </button>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <GlobeAltIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">일반 설정</h2>
          </div>
          <div className="px-6">
            {generalSettings.map((setting) =>
              renderSetting(setting, generalSettings, setGeneralSettings)
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">보안 설정</h2>
          </div>
          <div className="px-6">
            {securitySettings.map((setting) =>
              renderSetting(setting, securitySettings, setSecuritySettings)
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <BellIcon className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">알림 설정</h2>
          </div>
          <div className="px-6">
            {notificationSettings.map((setting) =>
              renderSetting(setting, notificationSettings, setNotificationSettings)
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
