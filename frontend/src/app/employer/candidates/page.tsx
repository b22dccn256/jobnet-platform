'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Skeleton,
  Tag,
  message,
} from 'antd';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  MailOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import CandidateOverviewModal from '@/components/employer/CandidateOverviewModal';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { LEVEL_LABEL } from '@/lib/format';
import { applicationsService } from '@/services/applications.service';
import { employerService } from '@/services/employer.service';
import { jobsService } from '@/services/jobs.service';
import type { ApplicationStatus, JobLevel, User } from '@/types';

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string; color: string }> = [
  { value: 'applied', label: 'Mới ứng tuyển', color: 'blue' },
  { value: 'contacted', label: 'Đã liên hệ', color: 'cyan' },
  { value: 'interview', label: 'Mời phỏng vấn', color: 'gold' },
  { value: 'hired', label: 'Trúng tuyển', color: 'green' },
  { value: 'rejected', label: 'Không phù hợp', color: 'red' },
];

export default function EmployerCandidatesPage() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<JobLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [previewCandidate, setPreviewCandidate] = useState<{
    id: string;
    cvUrl?: string;
  } | null>(null);
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
      message.success('Đã cập nhật trạng thái hồ sơ ứng viên');
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

  const filteredItems = useMemo(() => {
    const raw = data?.items || [];
    return raw.filter((app) => {
      const u = typeof app.user === 'object' ? (app.user as User) : null;
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (levelFilter !== 'all' && u?.desiredLevel !== levelFilter) return false;
      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const hay = `${u?.fullName || ''} ${u?.email || ''} ${u?.desiredTitle || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data?.items, keyword, levelFilter, statusFilter]);

  return (
    <div className="container section">
      <EmployerNav />

      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="section__title">Quản lý hồ sơ ứng viên ứng tuyển</h1>
          <p className="section__subtitle">
            Sàng lọc theo tin tuyển dụng, xem nhanh tổng quan CV và phản hồi trạng thái
          </p>
        </div>
      </div>

      {/* Top Filter Bar matching Hình 3.12 */}
      <Card style={{ borderRadius: 14, marginBottom: 20 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 12,
          }}
        >
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Nhập tên hoặc email ứng viên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            size="large"
            allowClear
            placeholder="Lọc theo tin tuyển dụng"
            value={selectedJob}
            onChange={(v) => setSelectedJob(v)}
            options={(myJobs?.items || []).map((j) => ({ value: j._id, label: j.title }))}
          />
          <Select
            size="large"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
            ]}
          />
        </div>
      </Card>

      <div className="emp-cand-layout">
        {/* Left filter sidebar matching Hình 3.12 */}
        <aside className="cv-card emp-cand-sidebar">
          <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
            <FilterOutlined style={{ color: '#2563eb' }} /> Trình độ ứng viên
          </div>
          <Radio.Group
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            style={{ display: 'grid', gap: 10 }}
          >
            <Radio value="all">Tất cả trình độ</Radio>
            <Radio value="intern">Thực tập sinh (Intern)</Radio>
            <Radio value="junior">Junior</Radio>
            <Radio value="middle">Middle</Radio>
            <Radio value="senior">Senior</Radio>
          </Radio.Group>
        </aside>

        {/* Candidate cards list */}
        <div className="emp-cand-list">
          {isLoading ? (
            <Card>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card style={{ borderRadius: 14 }}>
              <Empty description="Không tìm thấy hồ sơ ứng viên phù hợp với bộ lọc" />
            </Card>
          ) : (
            filteredItems.map((app) => {
              const u = typeof app.user === 'object' ? (app.user as User) : null;
              const jobObj = typeof app.job === 'object' ? app.job : null;
              const name = u?.fullName || u?.email || 'Ứng viên';

              return (
                <div key={app._id} className="emp-cand-card">
                  <div className="emp-cand-card__main">
                    <SmartAvatar
                      src={u?.avatar}
                      name={name}
                      className="emp-cand-card__avatar"
                    />

                    <div className="emp-cand-card__info">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <strong className="emp-cand-card__name">{name}</strong>
                        {u?.desiredLevel && (
                          <Tag color="blue">{LEVEL_LABEL[u.desiredLevel] || u.desiredLevel}</Tag>
                        )}
                        {app.cvUrl && <Tag color="cyan">Đính kèm file CV</Tag>}
                      </div>
                      <div className="emp-cand-card__role">
                        {u?.desiredTitle || 'Ứng viên'}
                        {jobObj ? ` · Ứng tuyển: ${jobObj.title}` : ''}
                      </div>
                      <div className="emp-cand-card__meta">
                        {u?.desiredLocation && (
                          <span>
                            <EnvironmentOutlined /> {u.desiredLocation}
                          </span>
                        )}
                        <span>
                          <CalendarOutlined />{' '}
                          {new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString(
                            'vi-VN',
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="emp-cand-card__actions">
                    <Select<ApplicationStatus>
                      value={app.status}
                      style={{ width: 150 }}
                      onChange={(status) => statusMutation.mutate({ id: app._id, status })}
                      options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                    />
                    {u && (
                      <>
                        <Button
                          icon={<MailOutlined />}
                          onClick={() => setEmailTarget({ email: u.email, fullName: u.fullName })}
                        >
                          Email
                        </Button>
                        <Button
                          type="primary"
                          ghost
                          onClick={() => setPreviewCandidate({ id: u._id, cvUrl: app.cvUrl })}
                        >
                          Xem hồ sơ <ArrowRightOutlined />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Candidate Overview Modal matching Hình 3.13 */}
      <CandidateOverviewModal
        candidateId={previewCandidate?.id || null}
        attachedCvUrl={previewCandidate?.cvUrl}
        onClose={() => setPreviewCandidate(null)}
        onSendEmail={(target) => {
          setPreviewCandidate(null);
          setEmailTarget(target);
        }}
      />

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
            <Input.TextArea rows={5} placeholder="Thời gian, hình thức và địa điểm phỏng vấn..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={mailMutation.isPending} block>
            Gửi email ngay
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
