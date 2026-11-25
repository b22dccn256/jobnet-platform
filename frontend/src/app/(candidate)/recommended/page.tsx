'use client';

import Link from 'next/link';
import { Button, Card, Empty, Skeleton, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import JobCardItem from '@/components/common/JobCardItem';
import { employerService } from '@/services/employer.service';

const RANK_COLOR: Record<string, string> = {
  EXCELLENT: 'green',
  GOOD: 'blue',
  FAIR: 'orange',
  WEAK: 'default',
};

const RANK_LABEL: Record<string, string> = {
  EXCELLENT: 'Xuất sắc',
  GOOD: 'Phù hợp tốt',
  FAIR: 'Khá phù hợp',
  WEAK: 'Cân nhắc',
};

export default function RecommendedJobsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendedJobs'],
    queryFn: () => employerService.getRecommendedJobs({ limit: 20 }),
  });

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Việc làm gợi ý phù hợp với hồ sơ của bạn</h1>
          <p className="section__subtitle">
            Được xếp hạng tự động theo 9 tiêu chí (kỹ năng, kinh nghiệm, cấp bậc, mức lương, địa điểm...)
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="job-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="job-card job-card--skeleton">
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="job-grid">
          {data.items.map((item) => (
            <JobCardItem
              key={item.job._id}
              job={item.job}
              badge={
                <Tag
                  color={RANK_COLOR[item.rank]}
                  style={{ margin: 0, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                >
                  {item.percent}% · {RANK_LABEL[item.rank] || item.rank}
                </Tag>
              }
            />
          ))}
        </div>
      ) : (
        <Card style={{ borderRadius: 14, textAlign: 'center', padding: '24px 16px' }}>
          <Empty description="Hãy cập nhật kỹ năng và kinh nghiệm trong mục Hồ sơ CV để nhận gợi ý chính xác hơn">
            <Link href="/cv">
              <Button type="primary">Cập nhật hồ sơ CV ngay</Button>
            </Link>
          </Empty>
        </Card>
      )}
    </div>
  );
}
