'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Empty, Input, Pagination, Skeleton, Tag } from 'antd';
import { BankOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { employerService } from '@/services/employer.service';

export default function CompaniesPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', q, page],
    queryFn: () => employerService.getCompanies({ q, page, limit: 12 }),
  });

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Danh sách doanh nghiệp tuyển dụng</h1>
          <p className="section__subtitle">Khám phá hồ sơ công ty và theo dõi cơ hội việc làm mới</p>
        </div>
      </div>

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
              <Link key={comp._id} href={`/companies/${comp._id}`} className="category-card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <div className="job-card__logo" style={{ width: 44, height: 44, fontSize: 18 }}>
                    {comp.logo ? <img src={comp.logo} alt={comp.name} /> : <BankOutlined />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 className="category-card__name" style={{ margin: 0 }}>
                      {comp.name}
                    </h3>
                    {comp.industry && <Tag color="blue">{comp.industry}</Tag>}
                  </div>
                </div>
                <p className="category-card__desc">{comp.description || 'Chưa cập nhật mô tả'}</p>
                {comp.address && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                    <EnvironmentOutlined /> {comp.address}
                  </p>
                )}
              </Link>
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
    </div>
  );
}
