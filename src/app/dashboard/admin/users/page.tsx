'use client';

/**
 * User Management Page
 * 사용자 계정 및 권한 관리
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { RoleGate } from '@/components/layout/RoleGate';
import { DataTable, type Column, Modal, ConfirmModal } from '@/components/dashboard';
import { BRAND } from '@/lib/brand';
import type { SystemRole } from '@/lib/auth/config';

interface User {
  id: string;
  email: string;
  display_name?: string;
  company_name?: string;
  system_role: SystemRole;
  created_at: string;
  last_login?: string;
  status: 'active' | 'inactive' | 'suspended';
  [key: string]: unknown;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | SystemRole>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Mock data
    setUsers([
      { id: '1', email: 'admin@qetta.io', display_name: '관리자', system_role: 'admin', created_at: '2024-01-01', last_login: '2024-01-18', status: 'active' },
      { id: '2', email: 'developer@qetta.io', display_name: '개발자', system_role: 'developer', created_at: '2024-01-05', last_login: '2024-01-17', status: 'active' },
      { id: '3', email: 'user1@company.com', display_name: '김철수', company_name: '스마트공장', system_role: 'user', created_at: '2024-01-10', last_login: '2024-01-18', status: 'active' },
      { id: '4', email: 'user2@company.com', display_name: '박영희', company_name: '제조혁신', system_role: 'user', created_at: '2024-01-12', status: 'inactive' },
      { id: '5', email: 'user3@company.com', display_name: '이민수', company_name: 'AI솔루션즈', system_role: 'developer', created_at: '2024-01-15', last_login: '2024-01-16', status: 'active' },
    ]);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter((user) => {
    if (search && !user.email.toLowerCase().includes(search.toLowerCase()) &&
        !user.display_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (roleFilter !== 'all' && user.system_role !== roleFilter) {
      return false;
    }
    return true;
  });

  const getRoleIcon = (role: SystemRole) => {
    switch (role) {
      case 'admin':
        return <ShieldCheckIcon className="w-4 h-4 text-red-500" />;
      case 'developer':
        return <CodeBracketIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: SystemRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      developer: 'bg-blue-100 text-blue-700',
      user: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      admin: '관리자',
      developer: '개발자',
      user: '사용자',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colors[role]}`}>
        {getRoleIcon(role)}
        {labels[role]}
      </span>
    );
  };

  const getStatusBadge = (status: User['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      suspended: 'bg-red-100 text-red-700',
    };
    const labels = {
      active: '활성',
      inactive: '비활성',
      suspended: '정지',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const columns: Column<User>[] = [
    {
      key: 'email',
      header: '사용자',
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium text-gray-900">{user.display_name || user.email}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'company_name',
      header: '회사',
      sortable: true,
      render: (user) => (
        <span className="text-gray-700">{user.company_name || '-'}</span>
      ),
    },
    {
      key: 'system_role',
      header: '역할',
      width: '120px',
      sortable: true,
      render: (user) => getRoleBadge(user.system_role),
    },
    {
      key: 'status',
      header: '상태',
      width: '100px',
      sortable: true,
      render: (user) => getStatusBadge(user.status),
    },
    {
      key: 'last_login',
      header: '최근 로그인',
      width: '150px',
      sortable: true,
      render: (user) => (
        <span className="text-gray-500 text-sm">
          {user.last_login ? new Date(user.last_login).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
              setShowEditModal(true);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
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

  const handleRoleChange = async (userId: string, newRole: SystemRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, system_role: newRole } : u))
    );
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDelete = async (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setShowDeleteModal(false);
    setSelectedUser(null);
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
              <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
              <p className="text-gray-500 mt-1">사용자 계정 및 권한 관리</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="w-5 h-5" />
              사용자 추가
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="이메일 또는 이름 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | SystemRole)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 역할</option>
              <option value="admin">관리자</option>
              <option value="developer">개발자</option>
              <option value="user">사용자</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">전체 사용자</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">관리자</p>
            <p className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.system_role === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">개발자</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.system_role === 'developer').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">활성 사용자</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === 'active').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <DataTable
          data={filteredUsers}
          columns={columns}
          keyField="id"
          pageSize={10}
          loading={loading}
          emptyMessage="사용자가 없습니다."
        />

        {/* Edit Modal */}
        {selectedUser && showEditModal && (
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            title="사용자 역할 변경"
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">사용자</p>
                <p className="font-medium">{selectedUser.display_name || selectedUser.email}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할 선택
                </label>
                <select
                  value={selectedUser.system_role}
                  onChange={(e) => handleRoleChange(selectedUser.id, e.target.value as SystemRole)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">사용자</option>
                  <option value="developer">개발자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation */}
        {selectedUser && showDeleteModal && (
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={() => handleDelete(selectedUser.id)}
            title="사용자 삭제"
            message={`${selectedUser.display_name || selectedUser.email} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
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
