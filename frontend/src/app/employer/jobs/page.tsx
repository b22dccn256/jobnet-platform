'use client';

import Link from 'next/link';
import { Button, Card, Popconfirm, Space, Table, Tag, Tooltip, message } from 'antd';
import { FileAddOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import { formatSalary } from '@/lib/format';
import { jobsService } from '@/services/jobs.service';
import type { Job, JobStatus } from '@/types';

const STATUS_BADGE: Record<JobStatus, { color: string; label: string }> = {
  pending: { color: 'warning', label: 'Chờ duyệt' },
  approved: { color: 'success', label: 'Đang hiển thị' },
  rejected: { color: 'error', label: 'Bị từ chối' },
  closed: { color: 'default', label: 'Đã đóng' },
};

export default function EmployerJobsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['myEmployerJobs'],
    queryFn: () => jobsService.getMyJobs({ limit: 50 }),
  });

  const closeMutation = useMutation({
    mutationFn: jobsService.closeJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEmployerJobs'] });
      message.success('Đã đóng tin tuyển dụng');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: jobsService.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEmployerJobs'] });
      message.success('Đã xóa tin tuyển dụng');
    },
  });

  return (
    <div className="container section">
      <EmployerNav />

      <div className="section__head">
        <div>
          <h1 className="section__title">Quản lý tin tuyển dụng</h1>
          <p className="section__subtitle">
            Theo dõi trạng thái xét duyệt, chỉnh sửa hoặc đóng các vị trí đã đủ nhân sự
          </p>
        </div>
        <Link href="/employer/jobs/new">
          <Button type="primary" icon={<FileAddOutlined />}>
            Đăng tin mới
          </Button>
        </Link>
      </div>

      <Card style={{ borderRadius: 14 }}>
        <Table<Job>
          rowKey="_id"
          loading={isLoading}
          dataSource={data?.items || []}
          scroll={{ x: 720 }}
          columns={[
            {
              title: 'Vị trí tuyển dụng',
              dataIndex: 'title',
              render: (val, r) => (
                <Link href={`/employer/jobs/${r._id}`} style={{ fontWeight: 600 }}>
                  {val}
                </Link>
              ),
            },
            {
              title: 'Mức lương',
              render: (_, r) => (
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatSalary(r.salaryMin, r.salaryMax)}
                </span>
              ),
            },
            { title: 'Địa điểm', dataIndex: 'location' },
            {
              title: 'Trạng thái',
              render: (_, r) => {
                const badge = STATUS_BADGE[r.status];
                return r.rejectReason ? (
                  <Tooltip title={`Lý do: ${r.rejectReason}`}>
                    <Tag color={badge.color}>{badge.label}</Tag>
                  </Tooltip>
                ) : (
                  <Tag color={badge.color}>{badge.label}</Tag>
                );
              },
            },
            {
              title: 'Thao tác',
              render: (_, r) => (
                <Space wrap>
                  <Link href={`/employer/jobs/${r._id}`}>
                    <Button size="small">Sửa</Button>
                  </Link>
                  {r.status === 'approved' && (
                    <Button size="small" onClick={() => closeMutation.mutate(r._id)}>
                      Đóng tin
                    </Button>
                  )}
                  <Popconfirm title="Xóa tin này?" onConfirm={() => deleteMutation.mutate(r._id)}>
                    <Button size="small" danger>
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
