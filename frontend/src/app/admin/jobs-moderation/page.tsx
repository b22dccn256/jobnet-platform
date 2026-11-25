'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminNav from '@/components/admin/AdminNav';
import { getErrorMessage } from '@/lib/error';
import { formatSalary } from '@/lib/format';
import { adminService } from '@/services/admin.service';
import type { Job, JobStatus } from '@/types';

const STATUS_MAP: Record<JobStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ kiểm duyệt', color: 'warning' },
  approved: { label: 'Đang hiển thị', color: 'success' },
  rejected: { label: 'Đã từ chối', color: 'error' },
  closed: { label: 'Đã đóng', color: 'default' },
};

export default function AdminJobsModerationPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>('pending');
  const [rejectTarget, setRejectTarget] = useState<Job | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminJobs', statusFilter],
    queryFn: () => adminService.getJobs({ status: statusFilter, limit: 50 }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      adminService.moderateJob(id, { approve, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      setRejectTarget(null);
      message.success('Đã cập nhật trạng thái kiểm duyệt tin tuyển dụng');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Thao tác thất bại')),
  });

  return (
    <div className="container section">
      <AdminNav />

      <div className="section__head">
        <div>
          <h1 className="section__title">Kiểm duyệt tin tuyển dụng</h1>
          <p className="section__subtitle">
            Đảm bảo tính minh bạch của tin đăng trước khi đồng bộ lên chỉ mục tìm kiếm
          </p>
        </div>
        <Select<JobStatus>
          allowClear
          placeholder="Tất cả trạng thái"
          style={{ width: 200 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'pending', label: 'Chờ kiểm duyệt' },
            { value: 'approved', label: 'Đang hiển thị' },
            { value: 'rejected', label: 'Đã từ chối' },
            { value: 'closed', label: 'Đã đóng' },
          ]}
        />
      </div>

      <Card style={{ borderRadius: 14 }}>
        <Table<Job>
          rowKey="_id"
          loading={isLoading}
          dataSource={data?.items || []}
          scroll={{ x: 760 }}
          columns={[
            {
              title: 'Tiêu đề tin',
              dataIndex: 'title',
              render: (val, r) => (
                <Link href={`/jobs/${r._id}`} style={{ fontWeight: 600 }}>
                  {val}
                </Link>
              ),
            },
            {
              title: 'Doanh nghiệp',
              render: (_, r) => (typeof r.company === 'object' && r.company ? r.company.name : '–'),
            },
            {
              title: 'Mức lương',
              render: (_, r) => (
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatSalary(r.salaryMin, r.salaryMax)}
                </span>
              ),
            },
            {
              title: 'Trạng thái',
              render: (_, r) => {
                const st = STATUS_MAP[r.status] || { label: r.status, color: 'default' };
                return <Tag color={st.color}>{st.label}</Tag>;
              },
            },
            {
              title: 'Xét duyệt',
              render: (_, r) => (
                <Space>
                  {r.status !== 'approved' && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => moderateMutation.mutate({ id: r._id, approve: true })}
                    >
                      Duyệt hiển thị
                    </Button>
                  )}
                  {r.status !== 'rejected' && (
                    <Button danger size="small" onClick={() => setRejectTarget(r)}>
                      Từ chối
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={`Từ chối tin: ${rejectTarget?.title || ''}`}
        open={Boolean(rejectTarget)}
        onCancel={() => setRejectTarget(null)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={(v) => {
            if (!rejectTarget) return;
            moderateMutation.mutate({ id: rejectTarget._id, approve: false, reason: v.reason });
          }}
        >
          <Form.Item
            name="reason"
            label="Lý do từ chối (hiển thị cho nhà tuyển dụng)"
            rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Thông tin mức lương hoặc mô tả công việc chưa minh bạch..."
            />
          </Form.Item>
          <Button danger type="primary" htmlType="submit" loading={moderateMutation.isPending} block>
            Xác nhận từ chối
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
