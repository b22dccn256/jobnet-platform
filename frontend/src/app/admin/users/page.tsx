'use client';

import { useState } from 'react';
import { Card, Input, Select, Switch, Table, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminNav from '@/components/admin/AdminNav';
import { getErrorMessage } from '@/lib/error';
import { adminService } from '@/services/admin.service';
import type { User, UserRole } from '@/types';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', q, roleFilter],
    queryFn: () => adminService.getUsers({ q, role: roleFilter, limit: 50 }),
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

      <Card title="Quản lý người dùng & Phân quyền" style={{ borderRadius: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <Input
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
            { title: 'Họ và tên', dataIndex: 'fullName' },
            { title: 'Email', dataIndex: 'email' },
            {
              title: 'Vai trò',
              render: (_, r) => (
                <Select<UserRole>
                  size="small"
                  value={r.role}
                  style={{ width: 150 }}
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
              title: 'Hoạt động',
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
