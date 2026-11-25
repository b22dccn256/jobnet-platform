'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Divider, Form, Input, Modal, Space, Tag, Upload, message } from 'antd';
import {
  BankOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  HeartFilled,
  HeartOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getErrorMessage } from '@/lib/error';
import { formatSalary, LEVEL_LABEL, WORK_MODE_LABEL } from '@/lib/format';
import { applicationsService } from '@/services/applications.service';
import { cvService } from '@/services/cv.service';
import { jobsService } from '@/services/jobs.service';
import type { RootState } from '@/store';
import type { Job } from '@/types';

export default function JobDetailClient({ jobId, initialJob }: { jobId: string; initialJob: Job | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [applyOpen, setApplyOpen] = useState(false);
  const [uploadedCvKey, setUploadedCvKey] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsService.getJobById(jobId),
    initialData: initialJob || undefined,
  });

  const isCandidate = Boolean(accessToken && user?.role === 'candidate');

  const { data: likeState } = useQuery({
    queryKey: ['jobLiked', jobId],
    queryFn: () => applicationsService.checkLiked(jobId),
    enabled: isCandidate,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: () =>
      likeState?.liked ? applicationsService.unlikeJob(jobId) : applicationsService.likeJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobLiked', jobId] });
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      message.success(likeState?.liked ? 'Đã bỏ lưu tin' : 'Đã lưu công việc yêu thích');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể thao tác')),
  });

  const applyMutation = useMutation({
    mutationFn: (values: { coverLetter?: string; cvUrl?: string }) =>
      applicationsService.apply({
        jobId,
        coverLetter: values.coverLetter,
        cvUrl: uploadedCvKey || values.cvUrl,
      }),
    onSuccess: () => {
      message.success('Ứng tuyển thành công!');
      setApplyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
    },
    onError: (err) => message.error(getErrorMessage(err, 'Ứng tuyển thất bại')),
  });

  if (!job) {
    return (
      <div className="container section">
        <Card>Không tìm thấy thông tin việc làm hoặc tin chưa được công khai.</Card>
      </div>
    );
  }

  const companyObj = typeof job.company === 'object' && job.company !== null ? job.company : null;

  return (
    <div className="container section">
      <Card style={{ borderRadius: 16 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 24 }}>{job.title}</h1>
            {companyObj && (
              <Link href={`/companies/${companyObj._id}`} style={{ fontSize: 16, fontWeight: 600 }}>
                <BankOutlined /> {companyObj.name}
              </Link>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <Tag color="green" icon={<DollarCircleOutlined />}>
                {formatSalary(job.salaryMin, job.salaryMax)}
              </Tag>
              {job.location && <Tag icon={<EnvironmentOutlined />}>{job.location}</Tag>}
              <Tag color="blue">{WORK_MODE_LABEL[job.workMode] || job.workMode}</Tag>
              <Tag>{LEVEL_LABEL[job.level] || job.level}</Tag>
              {job.deadline && (
                <Tag icon={<CalendarOutlined />}>
                  Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                </Tag>
              )}
            </div>
          </div>

          <Space wrap>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={() => {
                if (!accessToken) return router.push('/login');
                if (user?.role !== 'candidate') {
                  message.info('Chỉ tài khoản ứng viên mới có thể ứng tuyển');
                  return;
                }
                setApplyOpen(true);
              }}
            >
              Ứng tuyển ngay
            </Button>
            <Button
              size="large"
              icon={likeState?.liked ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
              onClick={() => {
                if (!isCandidate) return router.push('/login');
                toggleLikeMutation.mutate();
              }}
            >
              {likeState?.liked ? 'Đã lưu' : 'Lưu tin'}
            </Button>
          </Space>
        </div>

        {job.skills?.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {job.skills.map((s) => (
              <span key={s} className="skill-chip">
                {s}
              </span>
            ))}
          </div>
        )}

        <Divider />

        {job.description && (
          <section style={{ marginBottom: 20 }}>
            <h3>Mô tả công việc</h3>
            <p style={{ whiteSpace: 'pre-line', color: '#334155' }}>{job.description}</p>
          </section>
        )}

        {job.requirements && (
          <section style={{ marginBottom: 20 }}>
            <h3>Yêu cầu ứng viên</h3>
            <p style={{ whiteSpace: 'pre-line', color: '#334155' }}>{job.requirements}</p>
          </section>
        )}

        {job.benefits && (
          <section>
            <h3>Quyền lợi</h3>
            <p style={{ whiteSpace: 'pre-line', color: '#334155' }}>{job.benefits}</p>
          </section>
        )}
      </Card>

      <Modal
        title={`Ứng tuyển: ${job.title}`}
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={(v) => applyMutation.mutate(v)}>
          <Form.Item label="Tải lên CV PDF/DOCX (hoặc để trống để dùng hồ sơ CV trực tuyến trên JobNet)">
            <Upload
              maxCount={1}
              beforeUpload={async (file) => {
                try {
                  setUploading(true);
                  const res = await cvService.uploadFile(file, 'cv');
                  setUploadedCvKey(res.key);
                  message.success('Đã tải CV lên hệ thống');
                } catch (err) {
                  message.error(getErrorMessage(err, 'Tải file thất bại'));
                } finally {
                  setUploading(false);
                }
                return false;
              }}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Chọn file CV (PDF, DOC, DOCX)
              </Button>
            </Upload>
            {uploadedCvKey && (
              <p style={{ fontSize: 12, color: '#10b981', marginTop: 6 }}>Đã đính kèm: {uploadedCvKey}</p>
            )}
          </Form.Item>

          <Form.Item name="coverLetter" label="Thư giới thiệu ngắn">
            <Input.TextArea rows={4} placeholder="Giới thiệu ngắn gọn kinh nghiệm và mong muốn của bạn..." />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={applyMutation.isPending} block size="large">
            Gửi hồ sơ ứng tuyển
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
