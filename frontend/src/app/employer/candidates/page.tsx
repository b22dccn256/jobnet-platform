'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import { getErrorMessage } from '@/lib/error';
import { applicationsService } from '@/services/applications.service';
import { employerService } from '@/services/employer.service';
import { jobsService } from '@/services/jobs.service';
import type { Application, ApplicationStatus, User } from '@/types';

export default function EmployerCandidatesPage() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<string | undefined>(undefined);
  const [emailTarget, setEmailTarget] = useState<{ email: string; fullName?: string } | null>(null);

  const { data: myJobs } = useQuery({
    queryKey: ['myEmployerJobs'],
    queryFn: () => jobsService.getMyJobs({ limit: 50 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employerApplications', selectedJob],
    queryFn: () => applicationsService.getEmployerApplications({ jobId: selectedJob, limit: 50 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsService.updateStatus(id, { status, notifyByEmail: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employerApplications'] });
      message.success('Đã cập nhật trạng thái và gửi thông báo cho ứng viên');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Cập nhật thất bại')),
  });

  const mailMutation = useMutation({
    mutationFn: employerService.sendEmail,
    onSuccess: () => {
      message.success('Đã gửi email cho ứng viên');
      setEmailTarget(null);
    },
    onError: (err) => message.error(getErrorMessage(err, 'Gửi email thất bại')),
  });

  return (
    <div className="container section">
      <EmployerNav />

      <Card
        title="Danh sách hồ sơ ứng viên ứng tuyển"
        extra={
          <Select
            allowClear
            placeholder="Lọc theo tin tuyển dụng"
            style={{ minWidth: 240 }}
            value={selectedJob}
            onChange={(v) => setSelectedJob(v)}
            options={(myJobs?.items || []).map((j) => ({ value: j._id, label: j.title }))}
          />
        }
        style={{ borderRadius: 14 }}
      >
        <Table<Application>
          rowKey="_id"
          loading={isLoading}
          dataSource={data?.items || []}
          scroll={{ x: 760 }}
          columns={[
            {
              title: 'Ứng viên',
              render: (_, r) => {
                const u = typeof r.user === 'object' ? (r.user as User) : null;
                return u ? (
                  <div>
                    <Link href={`/employer/candidates/${u._id}`} style={{ fontWeight: 600 }}>
                      {u.fullName || u.email}
                    </Link>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                  </div>
                ) : (
                  '–'
                );
              },
            },
            {
              title: 'Vị trí ứng tuyển',
              render: (_, r) => (typeof r.job === 'object' ? r.job.title : '–'),
            },
            {
              title: 'Trạng thái hồ sơ',
              render: (_, r) => (
                <Select<ApplicationStatus>
                  size="small"
                  value={r.status}
                  style={{ width: 150 }}
                  onChange={(status) => statusMutation.mutate({ id: r._id, status })}
                  options={[
                    { value: 'applied', label: 'Mới ứng tuyển' },
                    { value: 'contacted', label: 'Đã liên hệ' },
                    { value: 'interview', label: 'Mời phỏng vấn' },
                    { value: 'hired', label: 'Trúng tuyển' },
                    { value: 'rejected', label: 'Không phù hợp' },
                  ]}
                />
              ),
            },
            {
              title: 'Liên hệ & Hồ sơ',
              render: (_, r) => {
                const u = typeof r.user === 'object' ? (r.user as User) : null;
                return (
                  <Space wrap>
                    {u && (
                      <>
                        <Link href={`/employer/candidates/${u._id}`}>
                          <Button size="small">Xem CV</Button>
                        </Link>
                        <Button
                          size="small"
                          icon={<MailOutlined />}
                          onClick={() => setEmailTarget({ email: u.email, fullName: u.fullName })}
                        >
                          Gửi email
                        </Button>
                      </>
                    )}
                    {r.cvUrl && <Tag color="blue">Đính kèm file</Tag>}
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        title={`Gửi email tới ${emailTarget?.fullName || emailTarget?.email || ''}`}
        open={Boolean(emailTarget)}
        onCancel={() => setEmailTarget(null)}
        footer={null}
      >
        <Form
          layout="vertical"
          initialValues={{ subject: 'Thư mời phỏng vấn từ nhà tuyển dụng qua JobNet' }}
          onFinish={(v) => {
            if (!emailTarget) return;
            mailMutation.mutate({
              to: emailTarget.email,
              subject: v.subject,
              html: `<p>${String(v.body || '').replace(/\n/g, '<br/>')}</p>`,
            });
          }}
        >
          <Form.Item name="subject" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="Nội dung email" rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder="Thời gian, địa điểm phỏng vấn..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mailMutation.isPending} block>
            Gửi email
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
