'use client';

import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import JobEditorForm from '@/components/employer/JobEditorForm';
import { getErrorMessage } from '@/lib/error';
import { jobsService } from '@/services/jobs.service';

export default function EmployerNewJobPage() {
  const router = useRouter();
  const createMutation = useMutation({
    mutationFn: jobsService.createJob,
    onSuccess: () => {
      message.success('Đã đăng tin tuyển dụng! Tin đang chờ Quản trị viên xét duyệt.');
      router.push('/employer/jobs');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể đăng tin tuyển dụng')),
  });

  return (
    <div className="container section">
      <EmployerNav />
      <h1 className="section__title" style={{ marginBottom: 16 }}>
        Đăng tin tuyển dụng mới
      </h1>
      <JobEditorForm
        submitting={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
}
