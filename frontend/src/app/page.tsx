'use client';

import React, { useState } from 'react';
import { Typography, Input, Button, Card, Row, Col, Tag, Space, Select, Spin, Empty } from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarCircleOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { jobsService } from '@/services/jobs.service';
import type { Job } from '@/types';

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['latestJobs'],
    queryFn: () => jobsService.getJobs({ limit: 6 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => jobsService.getCategories(),
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedLocation) params.set('location', selectedLocation);
    router.push(`/jobs?${params.toString()}`);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Thoả thuận';
    if (min && max) return `${(min / 1000000).toFixed(0)} - ${(max / 1000000).toFixed(0)} triệu`;
    if (min) return `Từ ${(min / 1000000).toFixed(0)} triệu`;
    return `Đến ${(max! / 1000000).toFixed(0)} triệu`;
  };

  return (
    <div>
      {/* 1. Hero Search Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          padding: '72px 24px 84px',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Tag color="cyan" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>
            <ThunderboltOutlined /> Nền tảng kết nối việc làm thông minh 2026
          </Tag>
          <Title level={1} style={{ color: '#fff', fontSize: 44, fontWeight: 800, marginBottom: 16 }}>
            Khám phá cơ hội nghề nghiệp phù hợp nhất với bạn
          </Title>
          <Paragraph style={{ color: '#e0e7ff', fontSize: 18, marginBottom: 36, maxWidth: 680, margin: '0 auto 36px' }}>
            Kết nối trực tiếp giữa doanh nghiệp SME và người tìm việc. Tích hợp AI thông minh và dữ liệu phân tích thị trường trực quan.
          </Paragraph>

          {/* Search Box */}
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              padding: 6,
            }}
          >
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={12}>
                <Input
                  size="large"
                  placeholder="Vị trí tuyển dụng, kỹ năng (ví dụ: NestJS, React, Marketing)..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onPressEnter={handleSearch}
                  variant="borderless"
                  style={{ fontSize: 15 }}
                />
              </Col>
              <Col xs={24} md={7}>
                <Select
                  size="large"
                  placeholder="Tất cả địa điểm"
                  variant="borderless"
                  style={{ width: '100%', textAlign: 'left' }}
                  allowClear
                  value={selectedLocation}
                  onChange={(val) => setSelectedLocation(val)}
                  suffixIcon={<EnvironmentOutlined style={{ color: '#94a3b8' }} />}
                  options={[
                    { value: 'Hà Nội', label: 'Hà Nội' },
                    { value: 'Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
                    { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                    { value: 'Remote', label: 'Làm việc từ xa (Remote)' },
                  ]}
                />
              </Col>
              <Col xs={24} md={5}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleSearch}
                  icon={<SearchOutlined />}
                  style={{
                    height: 48,
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 16,
                    background: '#10b981',
                    borderColor: '#10b981',
                  }}
                >
                  Tìm việc
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Hot Keywords */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Text style={{ color: '#cbd5e1', fontSize: 13 }}>Từ khóa nổi bật: </Text>
            {['TypeScript', 'NestJS', 'React', 'Java', 'Python', 'Marketing'].map((kw) => (
              <Tag
                key={kw}
                style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', margin: '2px 4px' }}
                onClick={() => {
                  setSearchTerm(kw);
                  router.push(`/jobs?q=${kw}`);
                }}
              >
                {kw}
              </Tag>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Feature Highlights */}
      <section style={{ maxWidth: 1200, margin: '-32px auto 48px', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <Card hoverable style={{ borderRadius: 12, borderTop: '4px solid #2563eb' }}>
              <Space align="start" size="middle">
                <div style={{ background: '#dbeafe', padding: 12, borderRadius: 10, color: '#2563eb', fontSize: 24 }}>
                  <RobotOutlined />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Chatbot AI hỗ trợ</Title>
                  <Paragraph type="secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    Trò chuyện tự nhiên với trợ lý Groq LLM để tìm kiếm việc làm đúng với mong đợi.
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ borderRadius: 12, borderTop: '4px solid #10b981' }}>
              <Space align="start" size="middle">
                <div style={{ background: '#d1fae5', padding: 12, borderRadius: 10, color: '#10b981', fontSize: 24 }}>
                  <SafetyCertificateOutlined />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Tin tuyển dụng đã duyệt</Title>
                  <Paragraph type="secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    Mọi tin đăng từ nhà tuyển dụng đều được ban quản trị kiểm duyệt kỹ lưỡng để phòng tránh rủi ro.
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ borderRadius: 12, borderTop: '4px solid #f59e0b' }}>
              <Space align="start" size="middle">
                <div style={{ background: '#fef3c7', padding: 12, borderRadius: 10, color: '#d97706', fontSize: 24 }}>
                  <BarChartOutlined />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Dữ liệu thị trường</Title>
                  <Paragraph type="secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    Tổng hợp tự động mức lương trung bình, kỹ năng hot và nhu cầu tuyển dụng từ crawler.
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </section>

      {/* 3. Categories Section */}
      {categoriesData?.items && categoriesData.items.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto 56px', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <div>
              <Title level={3} style={{ margin: 0 }}>Ngành nghề nổi bật</Title>
              <Text type="secondary">Tìm việc làm theo chuyên môn nghề nghiệp bạn quan tâm</Text>
            </div>
            <Link href="/jobs" style={{ fontWeight: 600, color: '#2563eb' }}>
              Xem tất cả <ArrowRightOutlined />
            </Link>
          </div>

          <Row gutter={[16, 16]}>
            {categoriesData.items.slice(0, 8).map((cat) => (
              <Col xs={12} sm={8} md={6} key={cat._id}>
                <Card
                  hoverable
                  style={{ borderRadius: 10, textAlign: 'center', height: '100%' }}
                  onClick={() => router.push(`/jobs?category=${cat._id}`)}
                >
                  <Title level={5} style={{ margin: '8px 0 4px', fontSize: 15 }}>
                    {cat.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                    {cat.description || 'Xem việc làm phù hợp'}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* 4. Latest Jobs Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto 64px', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Việc làm mới nhất</Title>
            <Text type="secondary">Các cơ hội việc làm hấp dẫn vừa được kiểm duyệt</Text>
          </div>
          <Link href="/jobs" style={{ fontWeight: 600, color: '#2563eb' }}>
            Xem thêm cơ hội khác <ArrowRightOutlined />
          </Link>
        </div>

        {jobsLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : jobsData?.items && jobsData.items.length > 0 ? (
          <Row gutter={[20, 20]}>
            {jobsData.items.map((job: Job) => {
              const companyName = typeof job.company === 'object' && job.company !== null ? job.company.name : 'Doanh nghiệp tuyển dụng';
              const companyLogo = typeof job.company === 'object' && job.company !== null ? job.company.logo : null;

              return (
                <Col xs={24} md={12} key={job._id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, height: '100%', display: 'flex', flexDirection: 'column' }}
                    onClick={() => router.push(`/jobs/${job._id}`)}
                  >
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#2563eb',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {companyLogo ? (
                          <img src={companyLogo} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          companyName[0].toUpperCase()
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ margin: 0, fontSize: 16 }} ellipsis>
                          {job.title}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 14 }} ellipsis>
                          {companyName}
                        </Text>

                        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <Tag color="green" icon={<DollarCircleOutlined />}>
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </Tag>
                          {job.location && (
                            <Tag icon={<EnvironmentOutlined />}>
                              {job.location}
                            </Tag>
                          )}
                          <Tag color="blue" style={{ textTransform: 'capitalize' }}>
                            {job.workMode}
                          </Tag>
                        </div>

                        {job.skills && job.skills.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            {job.skills.slice(0, 3).map((s) => (
                              <Tag key={s} style={{ fontSize: 11, background: '#f8fafc', color: '#64748b' }}>
                                {s}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Empty description="Hiện tại chưa có tin việc làm nào. Hãy quay lại sau!" />
        )}
      </section>

      {/* 5. CTA Employer Banner */}
      <section
        style={{
          background: '#f1f5f9',
          padding: '60px 24px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Title level={2} style={{ marginBottom: 12 }}>Bạn là Nhà Tuyển Dụng?</Title>
          <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
            Đăng tin tuyển dụng nhanh chóng, tiếp cận hàng ngàn ứng viên tiềm năng và nhận gợi ý thuật toán chấm điểm ứng viên phù hợp với chi phí tối ưu.
          </Paragraph>
          <Space size="middle">
            <Link href="/register">
              <Button type="primary" size="large" style={{ height: 44, padding: '0 28px', background: '#2563eb' }}>
                Đăng ký tài khoản NTD
              </Button>
            </Link>
            <Link href="/login">
              <Button size="large" style={{ height: 44, padding: '0 28px' }}>
                Đăng tin ngay
              </Button>
            </Link>
          </Space>
        </div>
      </section>
    </div>
  );
}
