'use client';

import { useRouter } from 'next/navigation';
import { Card, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import JobEditorForm from '@/components/employer/JobEditorForm';
import { getErrorMessage } from '@/lib/error';
import { jobsService, type UpsertJobPayload } from '@/services/jobs.service';

export default function EmployerEditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', params.id],
    queryFn: () => jobsService.getJobById(params.id),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpsertJobPayload) => jobsService.updateJob(params.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEmployerJobs'] });
      message.success('Đã cập nhật tin tuyển dụng');
      router.push('/employer/jobs');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Cập nhật thất bại')),
  });

  return (
    <div className="container section">
      <EmployerNav />
      <h1 className="section__title" style={{ marginBottom: 16 }}>
        Chỉnh sửa tin tuyển dụng
      </h1>
      {isLoading || !job ? (
        <Card>Đang tải thông tin tin tuyển dụng...</Card>
      ) : (
        <JobEditorForm
          initialJob={job}
          submitting={updateMutation.isPending}
          onSubmit={(payload) => updateMutation.mutate(payload)}
        />
      )}
    </div>
  );
}
