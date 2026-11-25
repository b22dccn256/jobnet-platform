'use client';

import Link from 'next/link';
import { Button, Card, Empty, Skeleton, Tooltip, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import JobCardItem from '@/components/common/JobCardItem';
import { applicationsService } from '@/services/applications.service';

export default function SavedJobsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => applicationsService.getLikedJobs({ limit: 30 }),
  });

  const unlikeMutation = useMutation({
    mutationFn: applicationsService.unlikeJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      message.success('Đã bỏ lưu việc làm');
    },
  });

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Việc làm đã lưu</h1>
          <p className="section__subtitle">
            Lưu trữ các vị trí quan tâm để so sánh và ứng tuyển bất cứ lúc nào
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="job-grid">
          {[1, 2].map((i) => (
            <div key={i} className="job-card job-card--skeleton">
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="job-grid">
          {data.items
            .filter((row) => row.job)
            .map((row) => (
              <div key={row._id} style={{ position: 'relative' }}>
                <JobCardItem
                  job={row.job}
                  badge={
                    <Tooltip title="Bỏ lưu" mouseEnterDelay={0.3}>
                      <Button
                        size="small"
                        danger
                        aria-label="Bỏ lưu việc làm"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.preventDefault();
                          unlikeMutation.mutate(row.job._id);
                        }}
                      />
                    </Tooltip>
                  }
                />
              </div>
            ))}
        </div>
      ) : (
        <Card style={{ borderRadius: 14, textAlign: 'center', padding: '24px 16px' }}>
          <Empty description="Chưa có công việc nào trong danh sách yêu thích">
            <Link href="/jobs">
              <Button type="primary">Khám phá việc làm</Button>
            </Link>
          </Empty>
        </Card>
      )}
    </div>
  );
}
