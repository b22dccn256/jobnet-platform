'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Empty, Input, Select, Skeleton } from 'antd';
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import JobCardItem from '@/components/common/JobCardItem';
import { startRouteProgress } from '@/components/common/RouteProgressBar';
import { jobsService } from '@/services/jobs.service';

const HOT_KEYWORDS = ['TypeScript', 'NestJS', 'React', 'Next.js', 'Python', 'UI/UX'];

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
    const target = `/jobs?${params.toString()}`;
    startRouteProgress(target);
    router.push(target);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <span className="hero__badge">
            <ThunderboltOutlined /> Nền tảng kết nối việc làm thông minh
          </span>
          <h1 className="hero__title">Tìm đúng cơ hội nghề nghiệp bằng dữ liệu & AI thực chiến</h1>
          <p className="hero__subtitle">
            Giải pháp tuyển dụng tinh gọn dành cho doanh nghiệp SME và ứng viên công nghệ — tích hợp
            chỉ mục Elasticsearch, chấm điểm hồ sơ 105 điểm và thống kê thị trường trực tiếp.
          </p>

          <div className="search-box">
            <div className="search-box__field">
              <Input
                size="large"
                variant="borderless"
                placeholder="Vị trí, kỹ năng (NestJS, React, Python...)"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
              />
            </div>
            <div className="search-box__field">
              <Select
                size="large"
                variant="borderless"
                placeholder="Tất cả địa điểm"
                allowClear
                value={selectedLocation}
                onChange={(val) => setSelectedLocation(val)}
                suffixIcon={<EnvironmentOutlined style={{ color: '#94a3b8' }} />}
                options={[
                  { value: 'Hà Nội', label: 'Hà Nội' },
                  { value: 'Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
                  { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                  { value: 'Remote', label: 'Làm việc từ xa' },
                ]}
              />
            </div>
            <div className="search-box__submit">
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Tìm việc ngay
              </Button>
            </div>
          </div>

          <div className="hero__keywords">
            <span>Tìm nhanh:</span>
            {HOT_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                className="keyword-chip"
                onClick={() => {
                  const target = `/jobs?q=${encodeURIComponent(kw)}`;
                  startRouteProgress(target);
                  router.push(target);
                }}
              >
                {kw}
              </button>
            ))}
          </div>

          <div className="hero__metrics">
            <div className="hero__metric">
              <strong>{jobsData?.total ?? '10+'}</strong>
              <span>Vị trí đã kiểm duyệt</span>
            </div>
            <div className="hero__metric-sep" aria-hidden />
            <div className="hero__metric">
              <strong>105đ</strong>
              <span>Thang chấm độ phù hợp</span>
            </div>
            <div className="hero__metric-sep" aria-hidden />
            <div className="hero__metric">
              <strong>LLaMA 3.3</strong>
              <span>Trợ lý hội thoại tiếng Việt</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container features__grid">
          <article className="feature-card">
            <div className="feature-card__icon">
              <RobotOutlined />
            </div>
            <div>
              <h2 className="feature-card__title">Trợ lý AI LLaMA 3.3</h2>
              <p className="feature-card__desc">
                Tra cứu việc làm bằng câu tự nhiên qua Groq API tốc độ cao, đối chiếu trực tiếp dữ liệu thật.
              </p>
            </div>
          </article>
          <article
            className="feature-card"
            style={{ '--accent': '#059669', '--accent-soft': '#ecfdf5' } as React.CSSProperties}
          >
            <div className="feature-card__icon">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <h2 className="feature-card__title">Kiểm duyệt & Chấm điểm 105đ</h2>
              <p className="feature-card__desc">
                Tin tuyển dụng qua bước duyệt của Admin; xếp hạng hồ sơ minh bạch trên 9 tiêu chí.
              </p>
            </div>
          </article>
          <article
            className="feature-card"
            style={{ '--accent': '#d97706', '--accent-soft': '#fef3c7' } as React.CSSProperties}
          >
            <div className="feature-card__icon">
              <BarChartOutlined />
            </div>
            <div>
              <h2 className="feature-card__title">Bức tranh lương thị trường</h2>
              <p className="feature-card__desc">
                So sánh khoảng lương trung bình, trung vị theo ngành, kỹ năng dẫn đầu và nhu cầu tuyển dụng.
              </p>
            </div>
          </article>
        </div>
      </section>

      {categoriesData?.items && categoriesData.items.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section__head">
              <div>
                <h2 className="section__title">Ngành nghề trọng điểm</h2>
                <p className="section__subtitle">Lọc nhanh cơ hội theo nhóm chuyên môn</p>
              </div>
              <Link href="/jobs" className="section__link">
                Xem tất cả ngành <ArrowRightOutlined />
              </Link>
            </div>
            <div className="category-grid">
              {categoriesData.items.slice(0, 8).map((cat) => (
                <Link key={cat._id} href={`/jobs?category=${cat._id}`} className="category-card">
                  <div className="category-card__top">
                    <span className="category-card__badge">
                      <AppstoreOutlined />
                    </span>
                    <ArrowRightOutlined className="category-card__arrow" />
                  </div>
                  <h3 className="category-card__name">{cat.name}</h3>
                  <p className="category-card__desc">{cat.description || 'Khám phá việc làm mới'}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <h2 className="section__title">Việc làm mới phê duyệt</h2>
              <p className="section__subtitle">Cập nhật liên tục từ các doanh nghiệp đang tuyển dụng</p>
            </div>
            <Link href="/jobs" className="section__link">
              Tất cả việc làm <ArrowRightOutlined />
            </Link>
          </div>

          {jobsLoading ? (
            <div className="job-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="job-card job-card--skeleton">
                  <Skeleton active avatar paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          ) : jobsData?.items && jobsData.items.length > 0 ? (
            <div className="job-grid">
              {jobsData.items.map((job) => (
                <JobCardItem key={job._id} job={job} />
              ))}
            </div>
          ) : (
            <Empty description="Chưa có tin tuyển dụng nào được đăng tải" />
          )}
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner__copy">
              <h2 className="cta__title">Dành cho Doanh nghiệp SME đang mở rộng đội ngũ</h2>
              <p className="cta__desc" style={{ marginBottom: 0 }}>
                Đăng tin trong 2 phút, quản lý phễu ứng viên tập trung và mở khóa gợi ý ứng viên tự động
                theo thang 105 điểm qua cổng thanh toán VNPay.
              </p>
            </div>
            <div className="cta__actions">
              <Link href="/register?role=employer">
                <Button type="primary" size="large">
                  Tạo tài khoản Nhà tuyển dụng
                </Button>
              </Link>
              <Link href="/market-insights">
                <Button size="large" icon={<BarChartOutlined />}>
                  Xem báo cáo thị trường
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
