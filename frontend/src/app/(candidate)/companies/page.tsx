'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Empty, Input, Pagination, Segmented, Skeleton, Tag, Tooltip, message } from 'antd';
import {
  BankOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { applicationsService } from '@/services/applications.service';
import { employerService } from '@/services/employer.service';
import type { RootState } from '@/store';
import type { Company } from '@/types';

function CompanyCard({
  comp,
  action,
}: {
  comp: Company;
  action?: React.ReactNode;
}) {
  return (
    <Link href={`/companies/${comp._id}`} className="category-card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
        <SmartAvatar
          src={comp.logo}
          name={comp.name}
          fallbackIcon={<BankOutlined />}
          className="job-card__logo"
          style={{ width: 44, height: 44, fontSize: 18 }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <h3 className="category-card__name" style={{ margin: '0 0 4px' }}>
              {comp.name}
            </h3>
            {action}
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
      <p className="category-card__desc">{comp.description || 'Chưa cập nhật mô tả'}</p>
      {comp.address && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
          <EnvironmentOutlined /> {comp.address}
        </p>
      )}
    </Link>
  );
}

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const { user, accessToken, hydrated } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'all' | 'following'>('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCandidate = Boolean(mounted && hydrated && accessToken && user?.role === 'candidate');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', debouncedQ, page],
    queryFn: () => employerService.getCompanies({ q: debouncedQ, page, limit: 12 }),
  });

  const { data: followedData, isLoading: followedLoading } = useQuery({
    queryKey: ['followedCompanies'],
    queryFn: () => applicationsService.getFollowedCompanies({ limit: 50 }),
    enabled: isCandidate,
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

  const followedCompanies = (followedData?.items || []).filter((row) => row.company);

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Danh sách doanh nghiệp tuyển dụng</h1>
          <p className="section__subtitle">Khám phá hồ sơ công ty và theo dõi cơ hội việc làm mới</p>
        </div>
        {isCandidate && (
          <Segmented<'all' | 'following'>
            value={tab}
            onChange={(v) => setTab(v)}
            options={[
              { value: 'all', label: 'Tất cả doanh nghiệp' },
              { value: 'following', label: `Đang theo dõi (${followedCompanies.length})` },
            ]}
          />
        )}
      </div>

      {tab === 'following' && isCandidate ? (
        followedLoading ? (
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
            {followedCompanies.map((row) => (
              <CompanyCard
                key={row._id}
                comp={row.company}
                action={
                  <Tooltip title="Bỏ theo dõi" mouseEnterDelay={0.3}>
                    <Button
                      size="small"
                      data-no-nav="true"
                      icon={<CheckOutlined />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        unfollowMutation.mutate(row.company._id);
                      }}
                    >
                      Đang theo dõi
                    </Button>
                  </Tooltip>
                }
              />
            ))}
          </div>
        ) : (
          <Card style={{ borderRadius: 14, textAlign: 'center', padding: '24px 16px' }}>
            <Empty description="Bạn chưa theo dõi doanh nghiệp nào">
              <Button type="primary" onClick={() => setTab('all')}>
                Khám phá danh sách công ty
              </Button>
            </Empty>
          </Card>
        )
      ) : (
        <>
          <Input
            size="large"
            placeholder="Tìm theo tên công ty, lĩnh vực hoặc địa chỉ..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 480, marginBottom: 24 }}
          />

          {isLoading ? (
            <div className="category-grid">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              ))}
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                  gap: 16,
                }}
              >
                {data.items.map((comp) => (
                  <CompanyCard key={comp._id} comp={comp} />
                ))}
              </div>
              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  current={page}
                  pageSize={12}
                  total={data.total}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            </>
          ) : (
            <Empty description="Không tìm thấy công ty phù hợp" />
          )}
        </>
      )}
    </div>
  );
}
