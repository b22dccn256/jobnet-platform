'use client';

import { Button, Card, Empty, message } from 'antd';
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
      <h1 className="section__title" style={{ marginBottom: 20 }}>
        Việc làm đã lưu
      </h1>

      {isLoading ? (
        <Card>Đang tải...</Card>
      ) : data?.items && data.items.length > 0 ? (
        <div className="job-grid">
          {data.items
            .filter((row) => row.job)
            .map((row) => (
              <div key={row._id} style={{ position: 'relative' }}>
                <JobCardItem
                  job={row.job}
                  badge={
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.preventDefault();
                        unlikeMutation.mutate(row.job._id);
                      }}
                    />
                  }
                />
              </div>
            ))}
        </div>
      ) : (
        <Empty description="Chưa có công việc nào trong danh sách yêu thích" />
      )}
    </div>
  );
}
