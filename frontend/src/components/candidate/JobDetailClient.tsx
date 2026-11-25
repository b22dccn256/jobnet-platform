'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  FilePdfOutlined,
  GlobalOutlined,
  HeartFilled,
  HeartOutlined,
  InboxOutlined,
  LaptopOutlined,
  SendOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import SmartAvatar from '@/components/common/SmartAvatar';

const CvPaperPreview = dynamic(() => import('@/components/candidate/CvPaperPreview'), {
  ssr: false,
  loading: () => <p>Đang tải bản xem trước CV...</p>,
});
import { getErrorMessage } from '@/lib/error';
import { formatSalary, LEVEL_LABEL, WORK_MODE_LABEL } from '@/lib/format';
import { applicationsService } from '@/services/applications.service';
import { cvService } from '@/services/cv.service';
import { jobsService } from '@/services/jobs.service';
import type { RootState } from '@/store';
import type { Category, Job } from '@/types';

export default function JobDetailClient({
  jobId,
  initialJob,
  fetchedAt,
}: {
  jobId: string;
  initialJob: Job | null;
  fetchedAt?: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [hydratedAt] = useState(() => (initialJob ? fetchedAt || Date.now() : undefined));
  const [applyOpen, setApplyOpen] = useState(false);
  const [previewCvOpen, setPreviewCvOpen] = useState(false);
  const [cvMode, setCvMode] = useState<'profile' | 'upload'>('profile');
  const [uploadedCvKey, setUploadedCvKey] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsService.getJobById(jobId),
    initialData: initialJob || undefined,
    initialDataUpdatedAt: hydratedAt,
    staleTime: 60_000,
  });

  const isCandidate = Boolean(accessToken && user?.role === 'candidate');

  const { data: likeState } = useQuery({
    queryKey: ['jobLiked', jobId],
    queryFn: () => applicationsService.checkLiked(jobId),
    enabled: isCandidate,
  });

  const { data: myCv } = useQuery({
    queryKey: ['myCv'],
    queryFn: () => cvService.getMyCv(),
    enabled: isCandidate && (applyOpen || previewCvOpen),
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
    mutationFn: () => {
      if (cvMode === 'upload' && !uploadedCvKey) {
        return Promise.reject(new Error('Vui lòng tải lên tệp CV (PDF, DOC, DOCX) trước khi nộp'));
      }
      return applicationsService.apply({
        jobId,
        coverLetter: coverLetter.trim() || undefined,
        cvUrl: cvMode === 'upload' ? uploadedCvKey : undefined,
      });
    },
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
  const categoryObj =
    typeof job.category === 'object' && job.category !== null ? (job.category as Category) : null;
  const companyName = companyObj?.name || job.companyName || 'Doanh nghiệp tuyển dụng';
  const companyLogo = companyObj?.logo || job.companyLogo;

  const deadlineDate = job.deadline ? new Date(job.deadline) : null;
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = daysLeft !== null && daysLeft < 0;

  return (
    <div className="container section">
      {/* Breadcrumb bar matching Hình 3.4 */}
      <div className="job-detail-topbar">
        <button type="button" className="job-detail-back" onClick={() => router.back()}>
          <ArrowLeftOutlined /> Quay lại
        </button>
        <div className="job-detail-crumb">
          <Link href="/jobs">Công việc</Link>
          <span>›</span>
          <span>Chi tiết tin tuyển dụng</span>
        </div>
      </div>

      {/* Header summary card */}
      <div className="job-detail-hero">
        <div className="job-detail-hero__main">
          <SmartAvatar src={companyLogo} name={companyName} className="job-detail-hero__logo" />
          <div>
            <h1 className="job-detail-hero__title">{job.title}</h1>
            <div className="job-detail-hero__meta">
              {companyObj ? (
                <Link href={`/companies/${companyObj._id}`} className="job-detail-hero__company">
                  <BankOutlined /> {companyName}
                </Link>
              ) : (
                <span className="job-detail-hero__company">
                  <BankOutlined /> {companyName}
                </span>
              )}
              {companyObj?.website && (
                <a href={companyObj.website} target="_blank" rel="noreferrer">
                  <GlobalOutlined /> {companyObj.website}
                </a>
              )}
              {job.location && (
                <span>
                  <EnvironmentOutlined /> {job.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="job-detail-hero__cta">
          <Space wrap>
            <Tooltip title="Sao chép liên kết việc làm">
              <Button
                size="large"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  message.success('Đã sao chép liên kết tin tuyển dụng');
                }}
              />
            </Tooltip>
            <Tooltip title={likeState?.liked ? 'Bỏ lưu tin' : 'Lưu công việc'}>
              <Button
                size="large"
                icon={
                  likeState?.liked ? (
                    <HeartFilled style={{ color: '#ef4444' }} />
                  ) : (
                    <HeartOutlined />
                  )
                }
                onClick={() => {
                  if (!isCandidate) return router.push('/login');
                  toggleLikeMutation.mutate();
                }}
              >
                {likeState?.liked ? 'Đã lưu' : 'Lưu tin'}
              </Button>
            </Tooltip>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              disabled={isExpired}
              onClick={() => {
                if (!accessToken) return router.push('/login');
                if (user?.role !== 'candidate') {
                  message.info('Chỉ tài khoản ứng viên mới có thể ứng tuyển');
                  return;
                }
                setApplyOpen(true);
              }}
            >
              {isExpired ? 'Đã hết hạn' : 'Ứng tuyển'}
            </Button>
          </Space>
          {deadlineDate && (
            <div className={`job-detail-hero__deadline${isExpired ? ' is-expired' : ''}`}>
              Hạn nộp: {deadlineDate.toLocaleDateString('vi-VN')}
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Body matching Hình 3.4 */}
      <div className="job-detail-grid">
        {/* Left: Detailed Sections */}
        <div className="job-detail-left">
          <div className="cv-card">
            {(categoryObj || (job.skills && job.skills.length > 0)) && (
              <div className="job-detail-section">
                <h3>Ngành nghề & Kỹ năng chuyên môn</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categoryObj && <Tag color="processing">{categoryObj.name}</Tag>}
                  {(job.skills || []).map((s) => (
                    <span key={s} className="skill-chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.description && (
              <div className="job-detail-section">
                <h3>Mô tả công việc</h3>
                <p className="cv-prose">{job.description}</p>
              </div>
            )}

            {job.requirements && (
              <div className="job-detail-section">
                <h3>Yêu cầu ứng viên</h3>
                <p className="cv-prose">{job.requirements}</p>
              </div>
            )}

            {job.benefits && (
              <div className="job-detail-section">
                <h3>Quyền lợi & Chế độ đãi ngộ</h3>
                <p className="cv-prose">{job.benefits}</p>
              </div>
            )}

            {(companyObj?.address || job.location) && (
              <div className="job-detail-section">
                <h3>Địa chỉ làm việc</h3>
                <p className="cv-prose">{companyObj?.address || job.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Job Overview Grid + Company Summary */}
        <aside className="job-detail-right">
          <div className="cv-card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Tổng quan công việc</h3>
            <div className="job-overview-grid">
              <div className="job-overview-stat">
                <EnvironmentOutlined className="job-overview-stat__icon" />
                <span className="job-overview-stat__label">Địa điểm</span>
                <strong>{job.location || 'Toàn quốc'}</strong>
              </div>
              <div className="job-overview-stat">
                <LaptopOutlined className="job-overview-stat__icon" />
                <span className="job-overview-stat__label">Hình thức</span>
                <strong>{WORK_MODE_LABEL[job.workMode] || job.workMode}</strong>
              </div>
              <div className="job-overview-stat">
                <TrophyOutlined className="job-overview-stat__icon" />
                <span className="job-overview-stat__label">Cấp bậc</span>
                <strong>{LEVEL_LABEL[job.level] || job.level}</strong>
              </div>
              <div className="job-overview-stat">
                <CalendarOutlined className="job-overview-stat__icon" />
                <span className="job-overview-stat__label">Ngày đăng</span>
                <strong>
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : 'Mới đăng'}
                </strong>
              </div>
              <div className="job-overview-stat">
                <DollarCircleOutlined className="job-overview-stat__icon" />
                <span className="job-overview-stat__label">Mức lương</span>
                <strong>{formatSalary(job.salaryMin, job.salaryMax)}</strong>
              </div>
              <div className="job-overview-stat">
                <BookOutlined className="job-overview-stat__icon" />
                <span className="job-overview-stat__label">Học vấn</span>
                <strong>{job.education || 'Không yêu cầu'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              <Tag color="blue" style={{ padding: '4px 10px', borderRadius: 6 }}>
                Trạng thái: Đang tuyển
              </Tag>
              {daysLeft !== null && (
                <Tag
                  color={daysLeft < 0 ? 'error' : daysLeft <= 7 ? 'warning' : 'magenta'}
                  icon={<ClockCircleOutlined />}
                  style={{ padding: '4px 10px', borderRadius: 6 }}
                >
                  {daysLeft < 0 ? 'Đã hết hạn' : `${daysLeft} ngày còn lại`}
                </Tag>
              )}
            </div>
          </div>

          {companyObj && (
            <div className="cv-card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <SmartAvatar
                  src={companyLogo}
                  name={companyName}
                  className="job-card__logo"
                  style={{ width: 48, height: 48, fontSize: 18 }}
                />
                <div style={{ minWidth: 0 }}>
                  <Link
                    href={`/companies/${companyObj._id}`}
                    style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}
                  >
                    {companyName}
                  </Link>
                  {companyObj.industry && (
                    <div style={{ fontSize: 12.5, color: '#64748b' }}>{companyObj.industry}</div>
                  )}
                </div>
              </div>

              <dl className="cv-kv-list">
                {companyObj.size && (
                  <div className="cv-kv-row">
                    <dt>Quy mô nhân sự:</dt>
                    <dd>{companyObj.size}</dd>
                  </div>
                )}
                {companyObj.address && (
                  <div className="cv-kv-row">
                    <dt>Địa chỉ:</dt>
                    <dd>{companyObj.address}</dd>
                  </div>
                )}
                {companyObj.website && (
                  <div className="cv-kv-row">
                    <dt>Website:</dt>
                    <dd>
                      <a
                        href={companyObj.website}
                        target="_blank"
                        rel="noreferrer"
                        className="cv-kv-link"
                        title={companyObj.website}
                      >
                        {companyObj.website.replace(/^https?:\/\//i, '')}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              <Link href={`/companies/${companyObj._id}`} style={{ display: 'block', marginTop: 14 }}>
                <Button block>Xem trang công ty</Button>
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Apply Modal matching Hình 3.5 */}
      <Modal
        title="Ứng tuyển công việc"
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        width={620}
        footer={null}
      >
        <div className="apply-modal">
          <div className="apply-modal__heading">
            <FilePdfOutlined style={{ color: '#2563eb' }} />
            <strong>Chọn CV để ứng tuyển ({job.title})</strong>
          </div>

          <Radio.Group
            value={cvMode}
            onChange={(e) => setCvMode(e.target.value)}
            style={{ width: '100%', display: 'grid', gap: 12 }}
          >
            <div className={`apply-cv-option${cvMode === 'profile' ? ' is-selected' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Radio value="profile">
                  <strong>Hồ sơ từ Profile của tôi trên JobNet</strong>
                </Radio>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setPreviewCvOpen(true)}
                >
                  Xem trước
                </Button>
              </div>
              {myCv && (
                <p className="apply-cv-option__hint">
                  Hoàn thiện {myCv.completeness}% · {myCv.profile.desiredTitle || myCv.profile.email}
                </p>
              )}
            </div>

            <div className={`apply-cv-option${cvMode === 'upload' ? ' is-selected' : ''}`}>
              <Radio value="upload">
                <strong>Tải lên hồ sơ ứng tuyển từ máy tính</strong>
              </Radio>
              <div style={{ marginTop: 10 }} onClick={() => setCvMode('upload')}>
                <Upload.Dragger
                  maxCount={1}
                  accept=".pdf,.doc,.docx"
                  showUploadList={false}
                  disabled={uploading}
                  beforeUpload={async (file) => {
                    try {
                      setCvMode('upload');
                      setUploading(true);
                      const res = await cvService.uploadFile(file, 'cv');
                      setUploadedCvKey(res.key);
                      setUploadedFileName(file.name);
                      message.success('Đã tải tệp CV lên hệ thống');
                    } catch (err) {
                      message.error(getErrorMessage(err, 'Tải tệp thất bại'));
                    } finally {
                      setUploading(false);
                    }
                    return false;
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: '#2563eb' }} />
                  </p>
                  <p style={{ margin: '4px 0', color: '#2563eb', fontWeight: 600 }}>
                    {uploading
                      ? 'Đang tải tệp lên...'
                      : uploadedFileName
                        ? `Đã chọn: ${uploadedFileName}`
                        : 'Nhấn để thêm tệp hoặc kéo thả tệp tại đây'}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                    Định dạng hỗ trợ: DOC, DOCX, PDF · Kích thước tối đa: 5MB
                  </p>
                </Upload.Dragger>
              </div>
            </div>
          </Radio.Group>

          <Form layout="vertical" style={{ marginTop: 18 }} onFinish={() => applyMutation.mutate()}>
            <div style={{ marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>Thư ứng tuyển</strong>
              <p style={{ margin: '2px 0 8px', fontSize: 12.5, color: '#64748b' }}>
                Thư ứng tuyển ngắn gọn giúp bạn tạo ấn tượng chuyên nghiệp với nhà tuyển dụng.
              </p>
            </div>
            <Input.TextArea
              rows={4}
              maxLength={2000}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Kính gửi Quý Công ty, tôi rất quan tâm tới vị trí này vì kinh nghiệm của tôi phù hợp với..."
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              {coverLetter.length} / 2000
            </div>

            <div className="apply-modal__footer">
              <Button size="large" onClick={() => setApplyOpen(false)}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={applyMutation.isPending}
                style={{ flex: 1 }}
              >
                Xác nhận ứng tuyển
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Quick CV Preview Modal */}
      <Modal
        title="Xem trước Hồ sơ CV trực tuyến của bạn"
        open={previewCvOpen}
        onCancel={() => setPreviewCvOpen(false)}
        width={880}
        footer={
          <Space>
            <Link href="/cv">
              <Button>Chỉnh sửa CV</Button>
            </Link>
            <Button type="primary" onClick={() => setPreviewCvOpen(false)}>
              Đóng
            </Button>
          </Space>
        }
      >
        {myCv ? (
          <div className="cv-preview-frame">
            <CvPaperPreview cv={myCv} />
          </div>
        ) : (
          <p>Đang tải dữ liệu CV...</p>
        )}
      </Modal>
    </div>
  );
}
