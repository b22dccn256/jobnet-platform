'use client';

import Link from 'next/link';
import { Button, Card, Empty, Popconfirm, Tag, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/error';
import { applicationsService } from '@/services/applications.service';
import type { ApplicationStatus } from '@/types';

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  applied: 'blue',
  contacted: 'cyan',
  interview: 'orange',
  hired: 'green',
  rejected: 'red',
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: 'Đã nộp hồ sơ',
  contacted: 'Đã liên hệ',
  interview: 'Mời phỏng vấn',
  hired: 'Trúng tuyển',
  rejected: 'Chưa phù hợp',
};

export default function AppliedJobsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationsService.getMyApplications({ limit: 30 }),
  });

  const withdrawMutation = useMutation({
    mutationFn: applicationsService.withdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      message.success('Đã rút hồ sơ ứng tuyển');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể rút đơn')),
  });

  return (
    <div className="container section">
      <h1 className="section__title" style={{ marginBottom: 20 }}>
        Lịch sử việc làm đã ứng tuyển
      </h1>

      {isLoading ? (
        <Card>Đang tải...</Card>
      ) : data?.items && data.items.length > 0 ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {data.items.map((app) => {
            const job = typeof app.job === 'object' ? app.job : null;
            const comp = job && typeof job.company === 'object' ? job.company : null;
            return (
              <Card key={app._id} style={{ borderRadius: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    {job ? (
                      <Link href={`/jobs/${job._id}`} style={{ fontSize: 16, fontWeight: 600 }}>
                        {job.title}
                      </Link>
                    ) : (
                      <span>Tin tuyển dụng</span>
                    )}
                    <p style={{ margin: '4px 0', color: '#64748b', fontSize: 13 }}>
                      {comp?.name || ''} · Ngày nộp:{' '}
                      {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Tag color={STATUS_COLOR[app.status]}>
                      {STATUS_LABEL[app.status] || app.status}
                    </Tag>
                    {app.status === 'applied' && (
                      <Popconfirm
                        title="Rút đơn ứng tuyển này?"
                        onConfirm={() => withdrawMutation.mutate(app._id)}
                      >
                        <Button danger size="small">
                          Rút đơn
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty description="Bạn chưa ứng tuyển công việc nào" />
      )}
    </div>
  );
}
