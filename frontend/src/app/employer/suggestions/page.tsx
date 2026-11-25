'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Empty, Progress, Select, Space, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import { getErrorMessage } from '@/lib/error';
import { employerService } from '@/services/employer.service';
import { jobsService } from '@/services/jobs.service';

const RANK_COLOR: Record<string, string> = {
  EXCELLENT: 'green',
  GOOD: 'blue',
  FAIR: 'orange',
  WEAK: 'default',
};

export default function EmployerSuggestionsPage() {
  const [jobId, setJobId] = useState<string | undefined>(undefined);

  const { data: myJobs } = useQuery({
    queryKey: ['myEmployerJobs'],
    queryFn: () => jobsService.getMyJobs({ limit: 50 }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendedCandidates', jobId],
    queryFn: () => employerService.getRecommendedCandidates(jobId!, { limit: 20 }),
    enabled: Boolean(jobId),
    retry: false,
  });

  return (
    <div className="container section">
      <EmployerNav />

      <Card
        title="Gợi ý ứng viên phù hợp theo tin tuyển dụng (Thang chấm 105 điểm)"
        extra={
          <Select
            placeholder="Chọn một tin tuyển dụng..."
            style={{ minWidth: 260 }}
            value={jobId}
            onChange={(v) => setJobId(v)}
            options={(myJobs?.items || []).map((j) => ({ value: j._id, label: j.title }))}
          />
        }
        style={{ borderRadius: 14 }}
      >
        {!jobId ? (
          <Empty description="Hãy chọn một tin tuyển dụng ở góc phải để chạy thuật toán chấm điểm ứng viên" />
        ) : error ? (
          <Alert
            type="warning"
            showIcon
            message="Cần kích hoạt gói dịch vụ Premium"
            description={getErrorMessage(error, 'Vui lòng nâng cấp gói dịch vụ để mở khóa gợi ý ứng viên')}
            action={
              <Link href="/employer/upgrade">
                <Button type="primary" size="small">
                  Nâng cấp ngay
                </Button>
              </Link>
            }
          />
        ) : isLoading ? (
          <p>Đang chấm điểm hồ sơ ứng viên...</p>
        ) : data?.items && data.items.length > 0 ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {data.items.map((item) => (
              <Card key={item.candidate._id} size="small" style={{ borderRadius: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Link
                      href={`/employer/candidates/${item.candidate._id}`}
                      style={{ fontSize: 16, fontWeight: 600 }}
                    >
                      {item.candidate.fullName || item.candidate.email}
                    </Link>
                    <p style={{ margin: '2px 0 8px', fontSize: 13, color: '#64748b' }}>
                      {item.candidate.desiredTitle || 'Ứng viên'} ·{' '}
                      {item.candidate.desiredLocation || ''}
                    </p>
                    <Space wrap size={[6, 6]}>
                      <Tag>Kỹ năng: {item.breakdown.skills}/35</Tag>
                      <Tag>Kinh nghiệm: {item.breakdown.experience}/25</Tag>
                      <Tag>Cấp độ: {item.breakdown.level}/10</Tag>
                      <Tag>Dự án: {item.breakdown.projects}/10</Tag>
                      <Tag>Chức danh: {item.breakdown.title}/5</Tag>
                      <Tag>Lương: {item.breakdown.salary}/5</Tag>
                      <Tag>Địa điểm: {item.breakdown.location}/5</Tag>
                      <Tag>Học vấn: {item.breakdown.education}/5</Tag>
                      <Tag>Hồ sơ: {item.breakdown.profileQuality}/5</Tag>
                    </Space>
                  </div>

                  <div style={{ minWidth: 160, textAlign: 'right' }}>
                    <Tag color={RANK_COLOR[item.rank]}>
                      {item.rank} ({item.totalScore}/{item.maxScore}đ)
                    </Tag>
                    <Progress percent={item.percent} size="small" style={{ marginTop: 6 }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="Chưa có ứng viên phù hợp" />
        )}
      </Card>
    </div>
  );
}
