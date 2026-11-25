'use client';

import { Card, Empty, Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { marketService } from '@/services/market.service';
import type { SalaryByCategoryRow } from '@/types';

const toTrieu = (val?: number) => Math.round(((val || 0) / 1_000_000) * 10) / 10;

export default function MarketInsightsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['marketOverview'],
    queryFn: () => marketService.getOverview(),
  });

  if (isLoading) {
    return (
      <div className="container section">
        <Card>Đang tải thống kê thị trường việc làm...</Card>
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

  const salaryChartData = (data.salaryByCategory || []).map((row) => ({
    category: row._id,
    avgSalary: toTrieu(((row.avgMin || 0) + (row.avgMax || 0)) / 2),
    medianSalary: toTrieu(
      ((row.medianMin ?? row.avgMin ?? 0) + (row.medianMax ?? row.avgMax ?? 0)) / 2,
    ),
    count: row.count,
  }));

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

      <div style={{ display: 'grid', gap: 24 }}>
        <Card title="Mức lương Trung bình & Trung vị theo ngành (Đơn vị: Triệu VND)" style={{ borderRadius: 14 }}>
          {salaryChartData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={salaryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgSalary" name="Lương trung bình (Triệu)" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="medianSalary" name="Lương trung vị (Triệu)" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty description="Chưa có dữ liệu mức lương" />
          )}

          <Table<SalaryByCategoryRow>
            rowKey="_id"
            size="small"
            pagination={false}
            style={{ marginTop: 20 }}
            dataSource={data.salaryByCategory}
            columns={[
              { title: 'Ngành nghề', dataIndex: '_id' },
              {
                title: 'Khoảng lương TB',
                render: (_, r) => `${toTrieu(r.avgMin)} – ${toTrieu(r.avgMax)} triệu`,
              },
              {
                title: 'Khoảng lương Trung vị',
                render: (_, r) =>
                  `${toTrieu(r.medianMin ?? r.avgMin)} – ${toTrieu(r.medianMax ?? r.avgMax)} triệu`,
              },
              { title: 'Số lượng tin', dataIndex: 'count' },
            ]}
          />
        </Card>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          <Card title="Top kỹ năng được tìm kiếm nhiều nhất" style={{ borderRadius: 14 }}>
            {data.hotSkills.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data.hotSkills.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="_id" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" name="Số tin yêu cầu" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty />
            )}
          </Card>

          <Card title="Xu hướng số lượng tin tuyển dụng theo thời gian" style={{ borderRadius: 14 }}>
            {data.demandTrend.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={data.demandTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Số tin đăng"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
