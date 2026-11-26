'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, Divider, Empty, Space, Tag, message } from 'antd';
import { EnvironmentOutlined, GlobalOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import JobCardItem from '@/components/common/JobCardItem';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { applicationsService } from '@/services/applications.service';
import { employerService } from '@/services/employer.service';
import { jobsService } from '@/services/jobs.service';
import type { RootState } from '@/store';

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isCandidate = Boolean(accessToken && user?.role === 'candidate');

  const { data: company } = useQuery({
    queryKey: ['company', params.id],
    queryFn: () => employerService.getCompanyById(params.id),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['companyJobs', params.id],
    queryFn: () => jobsService.getJobs({ company: params.id, limit: 20 }),
  });

  const { data: countData } = useQuery({
    queryKey: ['followersCount', params.id],
    queryFn: () => applicationsService.getFollowersCount(params.id),
  });

  const { data: followState } = useQuery({
    queryKey: ['followingCompany', params.id],
    queryFn: () => applicationsService.checkFollowing(params.id),
    enabled: isCandidate,
  });

  const followMutation = useMutation({
    mutationFn: () =>
      followState?.following
        ? applicationsService.unfollowCompany(params.id)
        : applicationsService.followCompany(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followingCompany', params.id] });
      queryClient.invalidateQueries({ queryKey: ['followersCount', params.id] });
      queryClient.invalidateQueries({ queryKey: ['followedCompanies'] });
      message.success(followState?.following ? 'Đã bỏ theo dõi công ty' : 'Đã theo dõi công ty');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể thực hiện')),
  });

  if (!company) {
    return (
      <div className="container section">
        <Card>Đang tải thông tin doanh nghiệp...</Card>
      </div>
    );
  }

  return (
    <div className="container section">
      <Card style={{ borderRadius: 16, marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <Space size="middle" align="start">
            <SmartAvatar
              src={company.logo}
              name={company.name}
              className="job-card__logo"
              style={{ width: 64, height: 64, fontSize: 24 }}
            />
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: 22 }}>{company.name}</h1>
              <Space wrap>
                {company.industry && <Tag color="blue">{company.industry}</Tag>}
                {company.size && <Tag>{company.size}</Tag>}
                <Tag color="purple">{countData?.followersCount || 0} người theo dõi</Tag>
              </Space>
              <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                {company.address && (
                  <span style={{ marginRight: 16 }}>
                    <EnvironmentOutlined /> {company.address}
                  </span>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer">
                    <GlobalOutlined /> {company.website}
                  </a>
                )}
              </div>
            </div>
          </Space>

          <Button
            type={followState?.following ? 'default' : 'primary'}
            icon={followState?.following ? <CheckOutlined /> : <PlusOutlined />}
            onClick={() => {
              if (!isCandidate) return router.push('/login');
              followMutation.mutate();
            }}
          >
            {followState?.following ? 'Đang theo dõi' : 'Theo dõi công ty'}
          </Button>
        </div>

        {company.description && (
          <>
            <Divider />
            <h3>Giới thiệu doanh nghiệp</h3>
            <p style={{ whiteSpace: 'pre-line', color: '#334155' }}>{company.description}</p>
          </>
        )}
      </Card>

      <h2 className="section__title" style={{ marginBottom: 16 }}>
        Vị trí đang tuyển dụng ({jobsData?.total || 0})
      </h2>
      {jobsData?.items && jobsData.items.length > 0 ? (
        <div className="job-grid">
          {jobsData.items.map((job) => (
            <JobCardItem key={job._id} job={job} />
          ))}
        </div>
      ) : (
        <Empty description="Công ty hiện chưa có vị trí tuyển dụng đang mở" />
      )}
    </div>
  );
}
