'use client';

/**
 * Organizations Management Page
 * 조직 및 팀 관리
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  UsersIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { DataTable, type Column, Modal, ConfirmModal } from '@/components/dashboard';
import { BRAND } from '@/lib/brand';

interface Organization {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  member_count: number;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  created_at: string;
  status: 'active' | 'inactive';
  [key: string]: unknown;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Mock data
    setOrganizations([
      { id: '1', name: '스마트팩토리 솔루션즈', description: '스마트공장 구축 전문', industry: '제조/IT', member_count: 25, plan: 'professional', created_at: '2024-01-01', status: 'active' },
      { id: '2', name: 'AI 제조혁신', description: 'AI 기반 품질관리', industry: '제조', member_count: 12, plan: 'starter', created_at: '2024-01-05', status: 'active' },
      { id: '3', name: '로봇셀 인테그레이터', description: '로봇 자동화 시스템', industry: 'SI', member_count: 45, plan: 'enterprise', created_at: '2024-01-10', status: 'active' },
      { id: '4', name: '디지털트윈 코리아', description: '디지털트윈 솔루션', industry: 'IT', member_count: 8, plan: 'free', created_at: '2024-01-12', status: 'inactive' },
      { id: '5', name: '예지보전 테크', description: '예지보전 시스템', industry: '제조/IT', member_count: 15, plan: 'professional', created_at: '2024-01-15', status: 'active' },
    ]);
    setLoading(false);
  }, []);

  const filteredOrgs = organizations.filter((org) => {
    if (search && !org.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getPlanBadge = (plan: Organization['plan']) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700',
      starter: 'bg-blue-100 text-blue-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700',
    };
    const labels = {
      free: 'Free',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[plan]}`}>
        {labels[plan]}
      </span>
    );
  };

  const getStatusBadge = (status: Organization['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      active: '활성',
      inactive: '비활성',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: '조직명',
      sortable: true,
      render: (org) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{org.name}</p>
            <p className="text-xs text-gray-500">{org.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      header: '업종',
      width: '120px',
      sortable: true,
      render: (org) => (
        <span className="text-gray-700">{org.industry || '-'}</span>
      ),
    },
    {
      key: 'member_count',
      header: '멤버',
      width: '100px',
      sortable: true,
      render: (org) => (
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{org.member_count}</span>
        </div>
      ),
    },
    {
      key: 'plan',
      header: '플랜',
      width: '130px',
      sortable: true,
      render: (org) => getPlanBadge(org.plan),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      sortable: true,
      render: (org) => getStatusBadge(org.status),
    },
    {
      key: 'created_at',
      header: '생성일',
      width: '120px',
      sortable: true,
      render: (org) => (
        <span className="text-gray-500 text-sm">
          {new Date(org.created_at).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (org) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrg(org);
              setShowEditModal(true);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrg(org);
              setShowDeleteModal(true);
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async (orgId: string) => {
    setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    setShowDeleteModal(false);
    setSelectedOrg(null);
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
              <h1 className="text-2xl font-bold text-gray-900">조직 관리</h1>
              <p className="text-gray-500 mt-1">조직 및 팀 설정</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="w-5 h-5" />
              조직 추가
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="조직명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">전체 조직</p>
            <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">전체 멤버</p>
            <p className="text-2xl font-bold text-blue-600">
              {organizations.reduce((a, o) => a + o.member_count, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">유료 플랜</p>
            <p className="text-2xl font-bold text-purple-600">
              {organizations.filter((o) => o.plan !== 'free').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">활성 조직</p>
            <p className="text-2xl font-bold text-green-600">
              {organizations.filter((o) => o.status === 'active').length}
            </p>
          </div>
        </div>

        {/* Organizations Table */}
        <DataTable
          data={filteredOrgs}
          columns={columns}
          keyField="id"
          pageSize={10}
          loading={loading}
          emptyMessage="조직이 없습니다."
        />

        {/* Edit Modal */}
        {selectedOrg && showEditModal && (
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedOrg(null);
            }}
            title="조직 정보 수정"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  조직명
                </label>
                <input
                  type="text"
                  defaultValue={selectedOrg.name}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  defaultValue={selectedOrg.description}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  플랜
                </label>
                <select
                  defaultValue={selectedOrg.plan}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedOrg(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedOrg(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation */}
        {selectedOrg && showDeleteModal && (
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedOrg(null);
            }}
            onConfirm={() => handleDelete(selectedOrg.id)}
            title="조직 삭제"
            message={`${selectedOrg.name} 조직을 삭제하시겠습니까? 모든 멤버와 데이터가 삭제됩니다.`}
            confirmLabel="삭제"
            confirmVariant="danger"
          />
        )}

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
