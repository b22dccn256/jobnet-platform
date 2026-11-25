'use client';

import Link from 'next/link';
import { Button, Card, Empty, Popconfirm, Skeleton, Tag, message } from 'antd';
import { CalendarOutlined, DollarCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { formatSalary } from '@/lib/format';
import { applicationsService } from '@/services/applications.service';
import type { ApplicationStatus } from '@/types';

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  applied: 'processing',
  contacted: 'cyan',
  interview: 'warning',
  hired: 'success',
  rejected: 'error',
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
      <div className="section__head">
        <div>
          <h1 className="section__title">Việc làm đã ứng tuyển</h1>
          <p className="section__subtitle">Theo dõi tiến độ phản hồi hồ sơ từ doanh nghiệp</p>
        </div>
        {data?.total ? <Tag color="blue">{data.total} đơn ứng tuyển</Tag> : null}
      </div>

      {isLoading ? (
        <Card style={{ borderRadius: 12 }}>
          <Skeleton active avatar paragraph={{ rows: 3 }} />
        </Card>
      ) : data?.items && data.items.length > 0 ? (
        <div className="emp-cand-list">
          {data.items.map((app) => {
            const job = typeof app.job === 'object' ? app.job : null;
            const comp = job && typeof job.company === 'object' ? job.company : null;
            const compName = comp?.name || job?.companyName || 'Doanh nghiệp';

            return (
              <div key={app._id} className="emp-cand-card">
                <div className="emp-cand-card__main">
                  <SmartAvatar
                    src={comp?.logo || job?.companyLogo}
                    name={compName}
                    className="job-card__logo"
                  />
                  <div className="emp-cand-card__info">
                    {job ? (
                      <Link href={`/jobs/${job._id}`} className="emp-cand-card__name" style={{ fontWeight: 600 }}>
                        {job.title}
                      </Link>
                    ) : (
                      <strong className="emp-cand-card__name">Tin tuyển dụng</strong>
                    )}
                    <div className="emp-cand-card__role">{compName}</div>
                    <div className="emp-cand-card__meta">
                      {job && (
                        <span>
                          <DollarCircleOutlined /> {formatSalary(job.salaryMin, job.salaryMax)}
                        </span>
                      )}
                      {job?.location && (
                        <span>
                          <EnvironmentOutlined /> {job.location}
                        </span>
                      )}
                      <span>
                        <CalendarOutlined /> Ngày nộp:{' '}
                        {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="emp-cand-card__actions">
                  <Tag color={STATUS_COLOR[app.status]} style={{ margin: 0, padding: '4px 10px' }}>
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
            );
          })}
        </div>
      ) : (
        <Card style={{ borderRadius: 14 }}>
          <Empty description="Bạn chưa ứng tuyển công việc nào">
            <Link href="/jobs">
              <Button type="primary">Khám phá việc làm ngay</Button>
            </Link>
          </Empty>
        </Card>
      )}
    </div>
  );
}
