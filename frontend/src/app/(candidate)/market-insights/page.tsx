'use client';

import dynamic from 'next/dynamic';
import { Card, Empty, Skeleton, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { marketService } from '@/services/market.service';

const MarketInsightsCharts = dynamic(
  () => import('@/components/candidate/MarketInsightsCharts'),
  {
    ssr: false,
    loading: () => (
      <Card style={{ borderRadius: 14 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    ),
  },
);

export default function MarketInsightsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: () => marketService.getOverview(),
  });

  if (isLoading) {
    return (
      <div className="container section">
        <div className="section__head">
          <div>
            <h1 className="section__title">Phân tích & Xu hướng thị trường việc làm</h1>
            <p className="section__subtitle">
              So sánh mức lương trung bình, trung vị theo ngành, kỹ năng nổi bật và nhu cầu tuyển dụng
            </p>
          </div>
        </div>
        <Card style={{ borderRadius: 14 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container section">
        <Empty description="Chưa có dữ liệu thống kê thị trường" />
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Phân tích & Xu hướng thị trường việc làm</h1>
          <p className="section__subtitle">
            So sánh mức lương trung bình, trung vị theo ngành, kỹ năng nổi bật và nhu cầu tuyển dụng
          </p>
        </div>
        <Tag color="blue">
          Kỳ {data.period} · Nguồn: {data.source}
        </Tag>
      </div>

      <MarketInsightsCharts data={data} />
    </div>
  );
}
