'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Empty, Segmented, Skeleton, Tag, Tooltip, message } from 'antd';
import { BankOutlined, CheckOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import JobCardItem from '@/components/common/JobCardItem';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { applicationsService } from '@/services/applications.service';

export default function SavedJobsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'jobs' | 'companies'>('jobs');

  const { data, isLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => applicationsService.getLikedJobs({ limit: 30 }),
  });

  const { data: followedData, isLoading: followedLoading } = useQuery({
    queryKey: ['followedCompanies'],
    queryFn: () => applicationsService.getFollowedCompanies({ limit: 50 }),
  });

  const unlikeMutation = useMutation({
    mutationFn: applicationsService.unlikeJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      message.success('Đã bỏ lưu việc làm');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: applicationsService.unfollowCompany,
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['followedCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['followingCompany', companyId] });
      queryClient.invalidateQueries({ queryKey: ['followersCount', companyId] });
      message.success('Đã bỏ theo dõi công ty');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể bỏ theo dõi')),
  });

  const savedJobs = (data?.items || []).filter((row) => row.job);
  const followedCompanies = (followedData?.items || []).filter((row) => row.company);

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Đã lưu &amp; Theo dõi</h1>
          <p className="section__subtitle">
            Quản lý các vị trí việc làm đã lưu và doanh nghiệp bạn đang theo dõi để nhận tin mới
          </p>
        </div>
        <Segmented<'jobs' | 'companies'>
          value={tab}
          onChange={(v) => setTab(v)}
          options={[
            { value: 'jobs', label: `Việc làm đã lưu (${savedJobs.length})` },
            { value: 'companies', label: `Công ty theo dõi (${followedCompanies.length})` },
          ]}
        />
      </div>

      {tab === 'jobs' ? (
        isLoading ? (
          <div className="job-grid">
            {[1, 2].map((i) => (
              <div key={i} className="job-card job-card--skeleton">
                <Skeleton active avatar paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        ) : savedJobs.length > 0 ? (
          <div className="job-grid">
            {savedJobs.map((row) => (
              <div key={row._id} style={{ position: 'relative' }}>
                <JobCardItem
                  job={row.job}
                  badge={
                    <Tooltip title="Bỏ lưu" mouseEnterDelay={0.3}>
                      <Button
                        size="small"
                        danger
                        data-no-nav="true"
                        aria-label="Bỏ lưu việc làm"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          unlikeMutation.mutate(row.job._id);
                        }}
                      />
                    </Tooltip>
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <Card style={{ borderRadius: 14, textAlign: 'center', padding: '24px 16px' }}>
            <Empty description="Chưa có công việc nào trong danh sách yêu thích">
              <Link href="/jobs">
                <Button type="primary">Khám phá việc làm</Button>
              </Link>
            </Empty>
          </Card>
        )
      ) : followedLoading ? (
        <div className="category-grid">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      ) : followedCompanies.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 16,
          }}
        >
          {followedCompanies.map((row) => {
            const comp = row.company;
            return (
              <Link key={row._id} href={`/companies/${comp._id}`} className="category-card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <SmartAvatar
                    src={comp.logo}
                    name={comp.name}
                    fallbackIcon={<BankOutlined />}
                    className="job-card__logo"
                    style={{ width: 44, height: 44, fontSize: 18 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <h3 className="category-card__name" style={{ margin: '0 0 4px' }}>
                        {comp.name}
                      </h3>
                      <Tooltip title="Bỏ theo dõi" mouseEnterDelay={0.3}>
                        <Button
                          size="small"
                          data-no-nav="true"
                          icon={<CheckOutlined />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            unfollowMutation.mutate(comp._id);
                          }}
                        >
                          Bỏ theo dõi
                        </Button>
                      </Tooltip>
                    </div>
                    {comp.industry && (
                      <Tag
                        color="blue"
                        style={{
                          maxWidth: '100%',
                          whiteSpace: 'normal',
                          height: 'auto',
                          lineHeight: 1.35,
                          marginInlineEnd: 0,
                        }}
                      >
                        {comp.industry}
                      </Tag>
                    )}
                  </div>
                </div>
                {comp.address && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                    <EnvironmentOutlined /> {comp.address}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <Card style={{ borderRadius: 14, textAlign: 'center', padding: '24px 16px' }}>
          <Empty description="Bạn chưa theo dõi công ty nào">
            <Link href="/companies">
              <Button type="primary">Xem danh sách công ty</Button>
            </Link>
          </Empty>
        </Card>
      )}
    </div>
  );
}
