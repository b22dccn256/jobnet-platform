'use client';

import { Card, Empty, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import JobCardItem from '@/components/common/JobCardItem';
import { employerService } from '@/services/employer.service';

const RANK_COLOR: Record<string, string> = {
  EXCELLENT: 'green',
  GOOD: 'blue',
  FAIR: 'orange',
  WEAK: 'default',
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
        <Card>Đang phân tích mức độ phù hợp...</Card>
      ) : data?.items && data.items.length > 0 ? (
        <div className="job-grid">
          {data.items.map((item) => (
            <JobCardItem
              key={item.job._id}
              job={item.job}
              badge={
                <Tag color={RANK_COLOR[item.rank]}>
                  {item.percent}% ({item.rank})
                </Tag>
              }
            />
          ))}
        </div>
      ) : (
        <Empty description="Hãy cập nhật kỹ năng và kinh nghiệm trong mục Hồ sơ CV để nhận gợi ý chính xác hơn" />
      )}
    </div>
  );
}
