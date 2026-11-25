'use client';

import { useEffect, useState } from 'react';
import { Card, Input, Select, Switch, Table, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminNav from '@/components/admin/AdminNav';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { adminService } from '@/services/admin.service';
import type { User, UserRole } from '@/types';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', debouncedQ, roleFilter],
    queryFn: () => adminService.getUsers({ q: debouncedQ, role: roleFilter, limit: 50 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      message.success('Đã cập nhật trạng thái tài khoản');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể cập nhật trạng thái')),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      message.success('Đã cập nhật phân quyền người dùng');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể đổi quyền')),
  });

  return (
    <div className="container section">
      <AdminNav />

      <div className="section__head">
        <div>
          <h1 className="section__title">Quản lý người dùng & Phân quyền</h1>
          <p className="section__subtitle">
            Tra cứu tài khoản, phân quyền vai trò và kiểm soát trạng thái hoạt động
          </p>
        </div>
      </div>

      <Card style={{ borderRadius: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo email hoặc họ tên..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Select<UserRole>
            allowClear
            placeholder="Lọc vai trò"
            style={{ width: 180 }}
            value={roleFilter}
            onChange={(v) => setRoleFilter(v)}
            options={[
              { value: 'candidate', label: 'Ứng viên' },
              { value: 'employer', label: 'Nhà tuyển dụng' },
              { value: 'admin', label: 'Quản trị viên' },
            ]}
          />
        </div>

        <Table<User>
          rowKey="_id"
          loading={isLoading}
          dataSource={data?.items || []}
          scroll={{ x: 680 }}
          columns={[
            {
              title: 'Người dùng',
              render: (_, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <SmartAvatar
                    src={r.avatar}
                    name={r.fullName || r.email}
                    className="job-card__logo"
                    style={{ width: 36, height: 36, fontSize: 14, borderRadius: 9 }}
                  />
                  <div>
                    <strong style={{ display: 'block', lineHeight: 1.3 }}>
                      {r.fullName || 'Chưa đặt tên'}
                    </strong>
                    <span style={{ fontSize: 12.5, color: '#64748b' }}>{r.email}</span>
                  </div>
                </div>
              ),
            },
            {
              title: 'Vai trò',
              render: (_, r) => (
                <Select<UserRole>
                  size="small"
                  value={r.role}
                  style={{ width: 155 }}
                  onChange={(role) => roleMutation.mutate({ id: r._id, role })}
                  options={[
                    { value: 'candidate', label: 'Ứng viên' },
                    { value: 'employer', label: 'Nhà tuyển dụng' },
                    { value: 'admin', label: 'Quản trị viên' },
                  ]}
                />
              ),
            },
            {
              title: 'Trạng thái hoạt động',
              render: (_, r) => (
                <Switch
                  checked={r.isActive}
                  onChange={(checked) => statusMutation.mutate({ id: r._id, isActive: checked })}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
