'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Empty, Input, Select, Skeleton } from 'antd';
import {
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
import { jobsService } from '@/services/jobs.service';

const HOT_KEYWORDS = ['TypeScript', 'NestJS', 'React', 'Next.js', 'Python', 'Marketing'];

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

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <span className="hero__badge">
            <ThunderboltOutlined /> Nền tảng kết nối việc làm thông minh
          </span>
          <h1 className="hero__title">Khám phá cơ hội nghề nghiệp phù hợp nhất với bạn</h1>
          <p className="hero__subtitle">
            Giải pháp tuyển dụng tinh gọn cho doanh nghiệp SME, thị trường ngách và ứng viên tự do —
            tích hợp tìm kiếm Elasticsearch, trợ lý AI và thống kê thị trường.
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
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                Tìm việc
              </Button>
            </div>
          </div>

          <div className="hero__keywords">
            <span>Từ khóa nổi bật:</span>
            {HOT_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                className="keyword-chip"
                onClick={() => router.push(`/jobs?q=${encodeURIComponent(kw)}`)}
              >
                {kw}
              </button>
            ))}
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
              <h2 className="feature-card__title">Chatbot AI LLaMA 3.3</h2>
              <p className="feature-card__desc">
                Tìm việc bằng ngôn ngữ tự nhiên với Groq API tốc độ cao kết hợp dữ liệu thực tế.
              </p>
            </div>
          </article>
          <article
            className="feature-card"
            style={{ '--accent': '#10b981', '--accent-soft': '#ecfdf5' } as React.CSSProperties}
          >
            <div className="feature-card__icon">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <h2 className="feature-card__title">Kiểm duyệt & Gợi ý 105 điểm</h2>
              <p className="feature-card__desc">
                Tin đăng được Admin kiểm duyệt; xếp hạng độ phù hợp minh bạch theo 9 tiêu chí.
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
              <h2 className="feature-card__title">Phân tích thị trường việc làm</h2>
              <p className="feature-card__desc">
                Theo dõi lương trung bình, trung vị theo ngành, kỹ năng hot và xu hướng tuyển dụng.
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
                <h2 className="section__title">Ngành nghề nổi bật</h2>
                <p className="section__subtitle">Khám phá việc làm theo nhóm lĩnh vực chuyên môn</p>
              </div>
              <Link href="/jobs" className="section__link">
                Xem tất cả <ArrowRightOutlined />
              </Link>
            </div>
            <div className="category-grid">
              {categoriesData.items.slice(0, 8).map((cat) => (
                <Link key={cat._id} href={`/jobs?category=${cat._id}`} className="category-card">
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
              <h2 className="section__title">Việc làm mới nhất</h2>
              <p className="section__subtitle">Các tin tuyển dụng vừa được ban quản trị phê duyệt</p>
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
          <div className="cta">
            <h2 className="cta__title">Bạn là Nhà Tuyển Dụng SME?</h2>
            <p className="cta__desc">
              Đăng tin nhanh gọn, quản lý hồ sơ ứng viên tập trung và sử dụng thuật toán chấm điểm
              gợi ý ứng viên phù hợp với chi phí tối ưu.
            </p>
            <div className="cta__actions">
              <Link href="/register?role=employer">
                <Button type="primary" size="large">
                  Đăng ký Nhà tuyển dụng
                </Button>
              </Link>
              <Link href="/chatbot">
                <Button size="large" icon={<RobotOutlined />}>
                  Thử trợ lý AI tìm việc
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
