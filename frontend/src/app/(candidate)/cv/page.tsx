'use client';

import { useState } from 'react';
import {
  Button,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd';
import {
  BookOutlined,
  CameraOutlined,
  CheckCircleFilled,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  GlobalOutlined,
  HeartOutlined,
  PlusOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CvPaperPreview from '@/components/candidate/CvPaperPreview';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import {
  formatMonthYear,
  formatPeriod,
  formatSalary,
  LEVEL_LABEL,
  resolveAssetUrl,
} from '@/lib/format';
import { cvService, type ProfileSectionName } from '@/services/cv.service';
import type { CandidateCvData, CvTemplateType } from '@/types';

const SUB_TABS = [
  { id: 'sec-personal', label: 'Thông tin cá nhân' },
  { id: 'sec-education', label: 'Đào tạo' },
  { id: 'sec-experience', label: 'Kinh nghiệm làm việc' },
  { id: 'sec-projects', label: 'Dự án' },
  { id: 'sec-skills', label: 'Kỹ năng' },
  { id: 'sec-health', label: 'Thông tin y tế' },
  { id: 'sec-other', label: 'Thông tin khác' },
];

type ActiveModal =
  | null
  | { type: 'personal' }
  | { type: 'bio' }
  | { type: 'skills' }
  | { type: 'template' }
  | { type: 'education'; item?: CandidateCvData['educations'][number] }
  | { type: 'experience'; item?: CandidateCvData['workExperiences'][number] }
  | { type: 'project'; item?: CandidateCvData['projects'][number] }
  | { type: 'course'; item?: CandidateCvData['courses'][number] }
  | { type: 'language'; item?: CandidateCvData['languages'][number] }
  | { type: 'health'; item?: CandidateCvData['health'][number] }
  | { type: 'other'; item?: CandidateCvData['otherInfo'][number] };

const toDateInput = (val?: string) => {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export default function CandidateCvPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sec-personal');
  const [modal, setModal] = useState<ActiveModal>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CvTemplateType>('modern');
  const [downloading, setDownloading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: cv, isLoading } = useQuery({
    queryKey: ['myCv'],
    queryFn: () => cvService.getMyCv(),
  });

  const invalidateCv = () => queryClient.invalidateQueries({ queryKey: ['myCv'] });

  const settingsMutation = useMutation({
    mutationFn: cvService.updateSettings,
    onSuccess: () => {
      invalidateCv();
      message.success('Đã cập nhật cài đặt hồ sơ CV');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Cập nhật thất bại')),
  });

  const profileMutation = useMutation({
    mutationFn: cvService.updateProfile,
    onSuccess: () => {
      invalidateCv();
      message.success('Đã lưu thông tin hồ sơ');
      setModal(null);
    },
    onError: (err) => message.error(getErrorMessage(err, 'Cập nhật thất bại')),
  });

  const saveSectionMutation = useMutation({
    mutationFn: async ({
      section,
      id,
      payload,
    }: {
      section: ProfileSectionName;
      id?: string;
      payload: Record<string, unknown>;
    }) => {
      if (id) {
        return cvService.updateSectionItem(section, id, payload);
      }
      return cvService.createSectionItem(section, payload);
    },
    onSuccess: () => {
      invalidateCv();
      message.success('Đã lưu mục hồ sơ');
      setModal(null);
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể lưu thông tin')),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ section, id }: { section: ProfileSectionName; id: string }) =>
      cvService.deleteSectionItem(section, id),
    onSuccess: () => {
      invalidateCv();
      message.success('Đã xóa mục khỏi CV');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể xóa mục này')),
  });

  if (isLoading || !cv) {
    return (
      <div className="container section">
        <div className="app-skeleton-head">
          <div className="app-skeleton app-skeleton--title" />
          <div className="app-skeleton app-skeleton--subtitle" />
        </div>
        <div className="app-skeleton-grid">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="app-skeleton-card">
              <div className="app-skeleton app-skeleton--line" />
              <div className="app-skeleton app-skeleton--line app-skeleton--short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { profile } = cv;
  const displayName = profile.fullName || profile.email;
  const coverUrl = resolveAssetUrl(profile.coverImage);
  const healthItem = cv.health[0];
  const otherItem = cv.otherInfo[0];

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownloadPdf = async (tpl?: CvTemplateType) => {
    try {
      setDownloading(true);
      const chosen = tpl || profile.cvTemplate || 'modern';
      await cvService.downloadPdfBlob(`/cv/me/pdf?template=${chosen}`);
      message.success('Đã tải xuống file CV PDF');
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể xuất file PDF'));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!profile.isCvPublic || !cv.shareUrl) {
      const updated = await settingsMutation.mutateAsync({ isCvPublic: true });
      if (updated.shareUrl) {
        await navigator.clipboard.writeText(updated.shareUrl);
        message.success('Đã bật công khai & sao chép liên kết CV');
      }
      return;
    }
    await navigator.clipboard.writeText(cv.shareUrl);
    message.success('Đã sao chép liên kết chia sẻ CV');
  };

  return (
    <div className="cv-studio">
      {/* Sub-navigation bar modeled after Hình 3.2 */}
      <div className="cv-subnav">
        <div className="container cv-subnav__inner">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`cv-subnav__pill${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => scrollToSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container cv-studio__body">
        {/* Hero Cover Banner + Avatar + Actions */}
        <div
          className="cv-hero"
          style={
            coverUrl
              ? {
                  backgroundImage: `linear-gradient(115deg, rgba(15, 23, 42, 0.84) 10%, rgba(30, 58, 138, 0.68) 55%, rgba(15, 23, 42, 0.78) 100%), url("${coverUrl}")`,
                }
              : undefined
          }
        >
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={async (file) => {
              try {
                setUploadingCover(true);
                const res = await cvService.uploadFile(file, 'avatar');
                await profileMutation.mutateAsync({ coverImage: res.key });
              } catch (err) {
                message.error(getErrorMessage(err, 'Tải ảnh bìa thất bại'));
              } finally {
                setUploadingCover(false);
              }
              return false;
            }}
          >
            <Tooltip title="Đổi ảnh bìa hồ sơ">
              <button
                type="button"
                className="cv-hero__cover-btn"
                aria-label="Đổi ảnh bìa"
                disabled={uploadingCover}
              >
                <CameraOutlined />
              </button>
            </Tooltip>
          </Upload>

          <div className="cv-hero__content">
            <div className="cv-hero__left">
              <div className="cv-hero__avatar-box">
                <SmartAvatar
                  src={profile.avatar}
                  name={displayName}
                  className="cv-hero__avatar"
                />
                <Upload
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={async (file) => {
                    try {
                      setUploadingAvatar(true);
                      const res = await cvService.uploadFile(file, 'avatar');
                      await profileMutation.mutateAsync({ avatar: res.key });
                    } catch (err) {
                      message.error(getErrorMessage(err, 'Tải ảnh đại diện thất bại'));
                    } finally {
                      setUploadingAvatar(false);
                    }
                    return false;
                  }}
                >
                  <Tooltip title="Đổi ảnh đại diện">
                    <button
                      type="button"
                      className="cv-hero__avatar-cam"
                      aria-label="Đổi ảnh đại diện"
                      disabled={uploadingAvatar}
                    >
                      <CameraOutlined />
                    </button>
                  </Tooltip>
                </Upload>
              </div>

              <div className="cv-hero__info">
                <h1 className="cv-hero__name">{displayName}</h1>
                <button
                  type="button"
                  className="cv-hero__headline"
                  onClick={() => setModal({ type: 'personal' })}
                >
                  <EditOutlined />
                  <span>{profile.desiredTitle || 'Cập nhật vị trí ứng tuyển mong muốn'}</span>
                </button>

                <div className="cv-hero__status-row">
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [
                        {
                          key: 'public',
                          label: 'Đang tìm việc · Công khai CV',
                          onClick: () => settingsMutation.mutate({ isCvPublic: true }),
                        },
                        {
                          key: 'private',
                          label: 'Chế độ riêng tư · Ẩn link CV',
                          onClick: () => settingsMutation.mutate({ isCvPublic: false }),
                        },
                      ],
                    }}
                  >
                    <button type="button" className="cv-hero__status-pill">
                      <span>
                        {profile.isCvPublic ? 'Đang bật tìm việc (Công khai)' : 'Trạng thái: Riêng tư'}
                      </span>
                      <DownOutlined style={{ fontSize: 11 }} />
                    </button>
                  </Dropdown>

                  <span className="cv-hero__completeness-chip">
                    Hoàn thiện {cv.completeness}%
                  </span>
                </div>
              </div>
            </div>

            <div className="cv-hero__actions">
              <button type="button" className="cv-hero__ghost-btn" onClick={handleCopyShareLink}>
                <CopyOutlined /> Sao chép liên kết
              </button>
              <button
                type="button"
                className="cv-hero__ghost-btn"
                onClick={() => {
                  setPreviewTemplate(profile.cvTemplate || 'modern');
                  setModal({ type: 'template' });
                }}
              >
                <SwapOutlined /> Đổi mẫu CV
              </button>
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                loading={downloading}
                onClick={() => handleDownloadPdf()}
                className="cv-hero__download-btn"
              >
                Tải xuống CV
              </Button>
            </div>
          </div>
        </div>

        {/* Two-column profile body matching Hình 3.2 */}
        <div className="cv-grid">
          {/* LEFT COLUMN */}
          <div className="cv-grid__left">
            {/* Personal info card */}
            <section id="sec-personal" className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Thông tin cá nhân</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'personal' })}
                  aria-label="Chỉnh sửa thông tin cá nhân"
                >
                  <EditOutlined />
                </button>
              </div>

              <div className="cv-progress-box">
                <div className="cv-progress-box__top">
                  <span>Độ hoàn thiện hồ sơ</span>
                  <strong>{cv.completeness}%</strong>
                </div>
                <Progress percent={cv.completeness} showInfo={false} strokeColor="#2563eb" size="small" />
              </div>

              <dl className="cv-kv-list">
                <div className="cv-kv-row">
                  <dt>Giới tính:</dt>
                  <dd>
                    {profile.gender || 'Chưa cập nhật'}{' '}
                    {profile.gender && <SafetyCertificateOutlined className="cv-verified-icon" />}
                  </dd>
                </div>
                <div className="cv-kv-row">
                  <dt>Ngày sinh:</dt>
                  <dd>
                    {profile.dateOfBirth || 'Chưa cập nhật'}{' '}
                    {profile.dateOfBirth && <SafetyCertificateOutlined className="cv-verified-icon" />}
                  </dd>
                </div>
                <div className="cv-kv-row">
                  <dt>Số điện thoại:</dt>
                  <dd>
                    {profile.phone || 'Chưa cập nhật'}{' '}
                    {profile.phone && <SafetyCertificateOutlined className="cv-verified-icon" />}
                  </dd>
                </div>
                <div className="cv-kv-row">
                  <dt>Email:</dt>
                  <dd>
                    {profile.email} <CheckCircleFilled className="cv-verified-icon" />
                  </dd>
                </div>
                <div className="cv-kv-row">
                  <dt>Quốc gia:</dt>
                  <dd>
                    {profile.nationality || 'Việt Nam'}{' '}
                    <SafetyCertificateOutlined className="cv-verified-icon" />
                  </dd>
                </div>
                <div className="cv-kv-row">
                  <dt>Tỉnh/thành phố:</dt>
                  <dd>
                    {profile.desiredLocation || profile.address || 'Chưa cập nhật'}{' '}
                    {(profile.desiredLocation || profile.address) && (
                      <SafetyCertificateOutlined className="cv-verified-icon" />
                    )}
                  </dd>
                </div>
                <div className="cv-kv-row">
                  <dt>Cấp bậc:</dt>
                  <dd>
                    {profile.desiredLevel
                      ? LEVEL_LABEL[profile.desiredLevel] || profile.desiredLevel
                      : 'Chưa cập nhật'}
                  </dd>
                </div>
                <div className="cv-kv-row">
                  <dt>Lương kỳ vọng:</dt>
                  <dd>
                    {profile.desiredSalaryMin
                      ? formatSalary(profile.desiredSalaryMin)
                      : 'Thỏa thuận'}
                  </dd>
                </div>
                {profile.website && (
                  <div className="cv-kv-row">
                    <dt>Liên kết:</dt>
                    <dd>
                      <a href={profile.website} target="_blank" rel="noreferrer">
                        <GlobalOutlined /> Portfolio / GitHub
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Skills & Languages */}
            <section id="sec-skills" className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Kỹ năng & Ngoại ngữ</h2>
                <Space size={4}>
                  <Tooltip title="Thêm ngoại ngữ">
                    <button
                      type="button"
                      className="cv-card__icon-btn"
                      onClick={() => setModal({ type: 'language' })}
                    >
                      <PlusOutlined />
                    </button>
                  </Tooltip>
                  <Tooltip title="Cập nhật kỹ năng chuyên môn">
                    <button
                      type="button"
                      className="cv-card__icon-btn"
                      onClick={() => setModal({ type: 'skills' })}
                    >
                      <EditOutlined />
                    </button>
                  </Tooltip>
                </Space>
              </div>

              {profile.skills && profile.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {profile.skills.map((skill) => (
                    <span key={skill} className="skill-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="cv-card__empty-hint">
                  Thêm kỹ năng chuyên môn để hệ thống chấm điểm gợi ý việc làm chính xác hơn.
                </p>
              )}

              {cv.languages.length > 0 && (
                <div className="cv-sublist">
                  <div className="cv-sublist__label">Trình độ ngoại ngữ</div>
                  {cv.languages.map((lang) => (
                    <div key={lang._id} className="cv-mini-item">
                      <div>
                        <strong>{lang.name}</strong>
                        {lang.level && <span className="cv-mini-item__muted"> · {lang.level}</span>}
                      </div>
                      <Space size={4}>
                        <button
                          type="button"
                          className="cv-card__icon-btn"
                          onClick={() => setModal({ type: 'language', item: lang })}
                        >
                          <EditOutlined />
                        </button>
                        <Popconfirm
                          title="Xóa ngoại ngữ này?"
                          onConfirm={() =>
                            deleteItemMutation.mutate({ section: 'languages', id: lang._id! })
                          }
                        >
                          <button type="button" className="cv-card__icon-btn is-danger">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </Space>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Health card */}
            <section id="sec-health" className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Thông tin y tế</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'health', item: healthItem })}
                  aria-label="Cập nhật thông tin sức khỏe"
                >
                  {healthItem ? <EditOutlined /> : <PlusOutlined />}
                </button>
              </div>
              {healthItem ? (
                <dl className="cv-kv-list">
                  <div className="cv-kv-row">
                    <dt>Chiều cao:</dt>
                    <dd>{healthItem.height ? `${healthItem.height} cm` : '–'}</dd>
                  </div>
                  <div className="cv-kv-row">
                    <dt>Cân nặng:</dt>
                    <dd>{healthItem.weight ? `${healthItem.weight} kg` : '–'}</dd>
                  </div>
                  <div className="cv-kv-row">
                    <dt>Tình trạng:</dt>
                    <dd>{healthItem.note || 'Sức khỏe tốt'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="cv-card__empty-hint">
                  <HeartOutlined /> Chưa cập nhật thông tin chiều cao, cân nặng và sức khỏe.
                </p>
              )}
            </section>

            {/* Other info card matching Hình 3.2 */}
            <section id="sec-other" className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Thông tin khác</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'other', item: otherItem })}
                  aria-label="Cập nhật thông tin khác"
                >
                  {otherItem ? <EditOutlined /> : <PlusOutlined />}
                </button>
              </div>

              {otherItem ? (
                <div className="cv-other-content">
                  {otherItem.religion && (
                    <p className="cv-other-line">
                      <strong>Tôn giáo:</strong> {otherItem.religion}
                    </p>
                  )}
                  {otherItem.hometown && (
                    <p className="cv-other-line">
                      <strong>Quê quán:</strong> {otherItem.hometown}
                    </p>
                  )}
                  {otherItem.emergencyContact && (
                    <p className="cv-other-line">
                      <strong>Thông tin người liên hệ:</strong> {otherItem.emergencyContact}
                    </p>
                  )}
                  {otherItem.content && <p className="cv-prose">{otherItem.content}</p>}
                </div>
              ) : (
                <p className="cv-card__empty-hint">
                  Bổ sung quê quán, người liên hệ, hoạt động tình nguyện hoặc mục tiêu nghề nghiệp.
                </p>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="cv-grid__right">
            {/* Bio / Summary */}
            <section className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Giới thiệu bản thân</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'bio' })}
                  aria-label="Chỉnh sửa giới thiệu bản thân"
                >
                  <EditOutlined />
                </button>
              </div>
              {profile.bio ? (
                <p className="cv-prose">{profile.bio}</p>
              ) : (
                <p className="cv-card__empty-hint">
                  Tóm tắt thế mạnh, số năm kinh nghiệm và mục tiêu nghề nghiệp của bạn.
                </p>
              )}
            </section>

            {/* Courses / Certificates */}
            <section className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Khóa học / Chứng chỉ</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'course' })}
                  aria-label="Thêm khóa học hoặc chứng chỉ"
                >
                  <PlusOutlined />
                </button>
              </div>

              {cv.courses.length > 0 ? (
                <div className="cv-entry-list">
                  {cv.courses.map((c) => (
                    <div key={c._id} className="cv-entry">
                      <div className="cv-entry__body">
                        <div className="cv-entry__title-row">
                          <TrophyOutlined className="cv-entry__badge-icon" />
                          <strong>{c.name}</strong>
                        </div>
                        {(c.organization || c.date) && (
                          <p className="cv-entry__meta">
                            {c.organization && (
                              <span>
                                <strong>Tổ chức:</strong> {c.organization}
                              </span>
                            )}
                            {c.date && (
                              <span>
                                <strong>Thời gian:</strong> {formatMonthYear(c.date)}
                              </span>
                            )}
                          </p>
                        )}
                        {c.description && (
                          <p className="cv-entry__desc">
                            <strong>Mô tả:</strong> {c.description}
                          </p>
                        )}
                      </div>
                      <Space size={4}>
                        <button
                          type="button"
                          className="cv-card__icon-btn"
                          onClick={() => setModal({ type: 'course', item: c })}
                        >
                          <EditOutlined />
                        </button>
                        <Popconfirm
                          title="Xóa chứng chỉ này?"
                          onConfirm={() =>
                            deleteItemMutation.mutate({ section: 'courses', id: c._id! })
                          }
                        >
                          <button type="button" className="cv-card__icon-btn is-danger">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </Space>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có khóa học hoặc chứng chỉ"
                />
              )}
            </section>

            {/* Education */}
            <section id="sec-education" className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Đào tạo</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'education' })}
                  aria-label="Thêm quá trình đào tạo"
                >
                  <PlusOutlined />
                </button>
              </div>

              {cv.educations.length > 0 ? (
                <div className="cv-entry-list">
                  {cv.educations.map((e) => (
                    <div key={e._id} className="cv-entry">
                      <div className="cv-entry__body">
                        <div className="cv-entry__title-row">
                          <BookOutlined className="cv-entry__badge-icon" />
                          <strong>{e.school}</strong>
                        </div>
                        {e.degree && (
                          <p className="cv-entry__line">
                            <strong>Bằng cấp:</strong> {e.degree}
                          </p>
                        )}
                        {e.major && (
                          <p className="cv-entry__line">
                            <strong>Ngành học:</strong> {e.major}
                          </p>
                        )}
                        {(e.startDate || e.endDate) && (
                          <p className="cv-entry__period">{formatPeriod(e.startDate, e.endDate)}</p>
                        )}
                        {e.description && (
                          <p className="cv-entry__desc">
                            <strong>Mô tả:</strong> {e.description}
                          </p>
                        )}
                      </div>
                      <Space size={4}>
                        <button
                          type="button"
                          className="cv-card__icon-btn"
                          onClick={() => setModal({ type: 'education', item: e })}
                        >
                          <EditOutlined />
                        </button>
                        <Popconfirm
                          title="Xóa thông tin học vấn này?"
                          onConfirm={() =>
                            deleteItemMutation.mutate({ section: 'educations', id: e._id! })
                          }
                        >
                          <button type="button" className="cv-card__icon-btn is-danger">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </Space>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa cập nhật thông tin đào tạo"
                />
              )}
            </section>

            {/* Work Experience */}
            <section id="sec-experience" className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Kinh nghiệm làm việc</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'experience' })}
                  aria-label="Thêm kinh nghiệm làm việc"
                >
                  <PlusOutlined />
                </button>
              </div>

              {cv.workExperiences.length > 0 ? (
                <div className="cv-entry-list">
                  {cv.workExperiences.map((w) => (
                    <div key={w._id} className="cv-entry cv-entry--timeline">
                      <div className="cv-entry__body">
                        <div className="cv-entry__title-row">
                          <strong>{w.position}</strong>
                          <Tag color="blue" style={{ marginInlineStart: 6 }}>
                            {w.company}
                          </Tag>
                        </div>
                        {(w.startDate || w.endDate) && (
                          <p className="cv-entry__period">{formatPeriod(w.startDate, w.endDate)}</p>
                        )}
                        {w.description && <p className="cv-prose">{w.description}</p>}
                      </div>
                      <Space size={4}>
                        <button
                          type="button"
                          className="cv-card__icon-btn"
                          onClick={() => setModal({ type: 'experience', item: w })}
                        >
                          <EditOutlined />
                        </button>
                        <Popconfirm
                          title="Xóa kinh nghiệm làm việc này?"
                          onConfirm={() =>
                            deleteItemMutation.mutate({
                              section: 'work-experiences',
                              id: w._id!,
                            })
                          }
                        >
                          <button type="button" className="cv-card__icon-btn is-danger">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </Space>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có kinh nghiệm làm việc"
                />
              )}
            </section>

            {/* Projects */}
            <section id="sec-projects" className="cv-card">
              <div className="cv-card__head">
                <h2 className="cv-card__title">Dự án</h2>
                <button
                  type="button"
                  className="cv-card__icon-btn"
                  onClick={() => setModal({ type: 'project' })}
                  aria-label="Thêm dự án"
                >
                  <PlusOutlined />
                </button>
              </div>

              {cv.projects.length > 0 ? (
                <div className="cv-entry-list">
                  {cv.projects.map((p) => (
                    <div key={p._id} className="cv-entry">
                      <div className="cv-entry__body">
                        <div className="cv-entry__title-row">
                          <ProjectOutlined className="cv-entry__badge-icon" />
                          <strong>{p.name}</strong>
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: 12, marginLeft: 8 }}
                            >
                              <EyeOutlined /> Xem dự án
                            </a>
                          )}
                        </div>
                        {p.technologies && p.technologies.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0' }}>
                            {p.technologies.map((tech) => (
                              <span key={tech} className="skill-chip">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.description && <p className="cv-prose">{p.description}</p>}
                      </div>
                      <Space size={4}>
                        <button
                          type="button"
                          className="cv-card__icon-btn"
                          onClick={() => setModal({ type: 'project', item: p })}
                        >
                          <EditOutlined />
                        </button>
                        <Popconfirm
                          title="Xóa dự án này?"
                          onConfirm={() =>
                            deleteItemMutation.mutate({ section: 'projects', id: p._id! })
                          }
                        >
                          <button type="button" className="cv-card__icon-btn is-danger">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </Space>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa cập nhật dự án" />
              )}
            </section>
          </div>
        </div>
      </div>

      {/* ================= MODALS (theo Bảng 2.5 Kịch bản quản lý CV) ================= */}

      {/* 1. Personal Info Modal */}
      <Modal
        title="Cập nhật thông tin cá nhân & định hướng nghề nghiệp"
        open={modal?.type === 'personal'}
        onCancel={() => setModal(null)}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={{
            fullName: profile.fullName,
            phone: profile.phone,
            gender: profile.gender || 'Nam',
            dateOfBirth: profile.dateOfBirth,
            nationality: profile.nationality || 'Việt Nam',
            desiredLocation: profile.desiredLocation,
            address: profile.address,
            website: profile.website,
            desiredTitle: profile.desiredTitle,
            desiredLevel: profile.desiredLevel,
            desiredSalaryMin: profile.desiredSalaryMin,
          }}
          onFinish={(values) => profileMutation.mutate(values)}
        >
          <div className="form-grid-2">
            <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item name="desiredTitle" label="Vị trí ứng tuyển mong muốn">
              <Input placeholder="VD: Fullstack Developer" />
            </Form.Item>
            <Form.Item name="gender" label="Giới tính">
              <Select
                options={[
                  { value: 'Nam', label: 'Nam' },
                  { value: 'Nữ', label: 'Nữ' },
                  { value: 'Khác', label: 'Khác' },
                ]}
              />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <Input placeholder="VD: 07/02/1999" />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="0936857622" />
            </Form.Item>
            <Form.Item name="nationality" label="Quốc gia">
              <Input placeholder="Việt Nam" />
            </Form.Item>
            <Form.Item name="desiredLocation" label="Tỉnh / Thành phố làm việc">
              <Input placeholder="Hà Nội, Hồ Chí Minh, Đà Nẵng..." />
            </Form.Item>
            <Form.Item name="desiredLevel" label="Cấp bậc hiện tại">
              <Select
                allowClear
                options={[
                  { value: 'intern', label: 'Thực tập sinh (Intern)' },
                  { value: 'junior', label: 'Junior' },
                  { value: 'middle', label: 'Middle' },
                  { value: 'senior', label: 'Senior' },
                ]}
              />
            </Form.Item>
            <Form.Item name="desiredSalaryMin" label="Mức lương mong muốn tối thiểu (VND)">
              <InputNumber style={{ width: '100%' }} min={0} step={1000000} />
            </Form.Item>
            <Form.Item name="website" label="Website / GitHub / Portfolio">
              <Input placeholder="https://github.com/..." />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Địa chỉ chi tiết">
            <Input placeholder="Số nhà, quận/huyện, tỉnh/thành phố" />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={profileMutation.isPending}>
              Lưu thông tin
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 2. Bio Modal */}
      <Modal
        title="Giới thiệu bản thân"
        open={modal?.type === 'bio'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={{ bio: profile.bio }}
          onFinish={(v) => profileMutation.mutate({ bio: v.bio })}
        >
          <Form.Item name="bio" label="Tóm tắt kinh nghiệm & định hướng">
            <Input.TextArea
              rows={5}
              placeholder="Giới thiệu thế mạnh chuyên môn, công nghệ sử dụng và mục tiêu nghề nghiệp của bạn..."
            />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={profileMutation.isPending}>
              Lưu giới thiệu
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 3. Skills Modal */}
      <Modal
        title="Cập nhật kỹ năng chuyên môn"
        open={modal?.type === 'skills'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={{ skills: profile.skills || [] }}
          onFinish={(v) => profileMutation.mutate({ skills: v.skills || [] })}
        >
          <Form.Item
            name="skills"
            label="Nhập kỹ năng và nhấn Enter (VD: React, TypeScript, NestJS, Docker)"
          >
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="Thêm các kỹ năng..."
              options={[
                'TypeScript',
                'JavaScript',
                'React',
                'Next.js',
                'NestJS',
                'Node.js',
                'Python',
                'MongoDB',
                'PostgreSQL',
                'Docker',
                'Elasticsearch',
                'Figma',
              ].map((s) => ({ value: s, label: s }))}
            />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={profileMutation.isPending}>
              Lưu kỹ năng
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 4. Education Modal */}
      <Modal
        title={modal?.type === 'education' && modal.item ? 'Chỉnh sửa đào tạo' : 'Thêm quá trình đào tạo'}
        open={modal?.type === 'education'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={
            modal?.type === 'education' && modal.item
              ? {
                  ...modal.item,
                  startDate: toDateInput(modal.item.startDate),
                  endDate: toDateInput(modal.item.endDate),
                }
              : {}
          }
          onFinish={(v) =>
            saveSectionMutation.mutate({
              section: 'educations',
              id: modal?.type === 'education' ? modal.item?._id : undefined,
              payload: {
                school: v.school,
                degree: v.degree || undefined,
                major: v.major || undefined,
                startDate: v.startDate || undefined,
                endDate: v.endDate || undefined,
                description: v.description || undefined,
              },
            })
          }
        >
          <Form.Item name="school" label="Trường / Cơ sở đào tạo" rules={[{ required: true, message: 'Nhập tên trường' }]}>
            <Input placeholder="VD: Học viện Công nghệ Bưu chính Viễn thông" />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item name="degree" label="Bằng cấp">
              <Input placeholder="VD: Kỹ sư / Cử nhân / Thạc sĩ" />
            </Form.Item>
            <Form.Item name="major" label="Ngành học">
              <Input placeholder="VD: Công nghệ thông tin" />
            </Form.Item>
            <Form.Item name="startDate" label="Từ ngày">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="endDate" label="Đến ngày">
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả (GPA, thành tích, đồ án...)">
            <Input.TextArea rows={3} placeholder="VD: GPA 3.4/4.0, nghiên cứu khoa học..." />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saveSectionMutation.isPending}>
              Lưu đào tạo
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 5. Experience Modal */}
      <Modal
        title={
          modal?.type === 'experience' && modal.item
            ? 'Chỉnh sửa kinh nghiệm làm việc'
            : 'Thêm kinh nghiệm làm việc'
        }
        open={modal?.type === 'experience'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={
            modal?.type === 'experience' && modal.item
              ? {
                  ...modal.item,
                  startDate: toDateInput(modal.item.startDate),
                  endDate: toDateInput(modal.item.endDate),
                }
              : {}
          }
          onFinish={(v) =>
            saveSectionMutation.mutate({
              section: 'work-experiences',
              id: modal?.type === 'experience' ? modal.item?._id : undefined,
              payload: {
                position: v.position,
                company: v.company,
                startDate: v.startDate || undefined,
                endDate: v.endDate || undefined,
                description: v.description || undefined,
              },
            })
          }
        >
          <div className="form-grid-2">
            <Form.Item name="position" label="Vị trí đảm nhiệm" rules={[{ required: true, message: 'Nhập vị trí' }]}>
              <Input placeholder="VD: Backend NestJS Developer" />
            </Form.Item>
            <Form.Item name="company" label="Tên công ty" rules={[{ required: true, message: 'Nhập tên công ty' }]}>
              <Input placeholder="VD: Công ty Cổ phần FinTech Á Châu" />
            </Form.Item>
            <Form.Item name="startDate" label="Ngày bắt đầu">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="endDate" label="Ngày kết thúc (để trống nếu đang làm)">
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả trách nhiệm & kết quả đạt được">
            <Input.TextArea rows={4} placeholder="Xây dựng RESTful API, tối ưu truy vấn MongoDB & Elasticsearch..." />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saveSectionMutation.isPending}>
              Lưu kinh nghiệm
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 6. Project Modal */}
      <Modal
        title={modal?.type === 'project' && modal.item ? 'Chỉnh sửa dự án' : 'Thêm dự án cá nhân / thực tế'}
        open={modal?.type === 'project'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={
            modal?.type === 'project' && modal.item
              ? {
                  name: modal.item.name,
                  url: modal.item.url,
                  description: modal.item.description,
                  technologies: modal.item.technologies || [],
                }
              : { technologies: [] }
          }
          onFinish={(v) =>
            saveSectionMutation.mutate({
              section: 'projects',
              id: modal?.type === 'project' ? modal.item?._id : undefined,
              payload: {
                name: v.name,
                url: v.url || undefined,
                description: v.description || undefined,
                technologies: v.technologies || [],
              },
            })
          }
        >
          <div className="form-grid-2">
            <Form.Item name="name" label="Tên dự án" rules={[{ required: true, message: 'Nhập tên dự án' }]}>
              <Input placeholder="VD: Nền tảng tuyển dụng JobNet" />
            </Form.Item>
            <Form.Item name="url" label="Liên kết Demo / GitHub">
              <Input placeholder="https://github.com/..." />
            </Form.Item>
          </div>
          <Form.Item name="technologies" label="Công nghệ sử dụng (nhấn Enter sau mỗi công nghệ)">
            <Select mode="tags" tokenSeparators={[',']} placeholder="Next.js, NestJS, MongoDB..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả dự án & vai trò">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saveSectionMutation.isPending}>
              Lưu dự án
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 7. Course / Certificate Modal */}
      <Modal
        title={modal?.type === 'course' && modal.item ? 'Chỉnh sửa khóa học / chứng chỉ' : 'Thêm khóa học / chứng chỉ'}
        open={modal?.type === 'course'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={
            modal?.type === 'course' && modal.item
              ? { ...modal.item, date: toDateInput(modal.item.date) }
              : {}
          }
          onFinish={(v) =>
            saveSectionMutation.mutate({
              section: 'courses',
              id: modal?.type === 'course' ? modal.item?._id : undefined,
              payload: {
                name: v.name,
                organization: v.organization || undefined,
                date: v.date || undefined,
                description: v.description || undefined,
              },
            })
          }
        >
          <Form.Item name="name" label="Tên khóa học / Chứng chỉ" rules={[{ required: true, message: 'Nhập tên khóa học' }]}>
            <Input placeholder="VD: AWS Certified Cloud Practitioner / Khóa học ReactJS" />
          </Form.Item>
          <div className="form-grid-2">
            <Form.Item name="organization" label="Đơn vị cấp">
              <Input placeholder="Amazon Web Services / Coursera" />
            </Form.Item>
            <Form.Item name="date" label="Thời gian cấp">
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả ngắn">
            <Input.TextArea rows={2} placeholder="Nội dung đạt được..." />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saveSectionMutation.isPending}>
              Lưu chứng chỉ
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 8. Language Modal */}
      <Modal
        title={modal?.type === 'language' && modal.item ? 'Chỉnh sửa ngoại ngữ' : 'Thêm ngoại ngữ'}
        open={modal?.type === 'language'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={modal?.type === 'language' && modal.item ? modal.item : {}}
          onFinish={(v) =>
            saveSectionMutation.mutate({
              section: 'languages',
              id: modal?.type === 'language' ? modal.item?._id : undefined,
              payload: { name: v.name, level: v.level || undefined },
            })
          }
        >
          <Form.Item name="name" label="Ngoại ngữ" rules={[{ required: true, message: 'Nhập tên ngoại ngữ' }]}>
            <Input placeholder="VD: Tiếng Anh / Tiếng Nhật" />
          </Form.Item>
          <Form.Item name="level" label="Trình độ / Chứng chỉ">
            <Input placeholder="VD: IELTS 7.0 / TOEIC 800 / JLPT N3" />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saveSectionMutation.isPending}>
              Lưu ngoại ngữ
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 9. Health Modal */}
      <Modal
        title="Thông tin y tế / Sức khỏe"
        open={modal?.type === 'health'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={modal?.type === 'health' && modal.item ? modal.item : {}}
          onFinish={(v) =>
            saveSectionMutation.mutate({
              section: 'health',
              id: modal?.type === 'health' ? modal.item?._id : undefined,
              payload: {
                height: v.height || undefined,
                weight: v.weight || undefined,
                note: v.note || undefined,
              },
            })
          }
        >
          <div className="form-grid-2">
            <Form.Item name="height" label="Chiều cao (cm)">
              <InputNumber min={50} max={250} style={{ width: '100%' }} placeholder="172" />
            </Form.Item>
            <Form.Item name="weight" label="Cân nặng (kg)">
              <InputNumber min={20} max={250} style={{ width: '100%' }} placeholder="65" />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Ghi chú tình trạng sức khỏe">
            <Input.TextArea rows={2} placeholder="Sức khỏe tốt, sẵn sàng đi công tác..." />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saveSectionMutation.isPending}>
              Lưu thông tin y tế
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 10. Other Info Modal */}
      <Modal
        title="Thông tin khác & Người liên hệ"
        open={modal?.type === 'other'}
        onCancel={() => setModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          initialValues={modal?.type === 'other' && modal.item ? modal.item : { religion: 'Không' }}
          onFinish={(v) =>
            saveSectionMutation.mutate({
              section: 'other-info',
              id: modal?.type === 'other' ? modal.item?._id : undefined,
              payload: {
                religion: v.religion || undefined,
                hometown: v.hometown || undefined,
                emergencyContact: v.emergencyContact || undefined,
                content: v.content || 'Sẵn sàng học hỏi và thích nghi nhanh với môi trường làm việc mới.',
              },
            })
          }
        >
          <div className="form-grid-2">
            <Form.Item name="religion" label="Tôn giáo">
              <Input placeholder="Không" />
            </Form.Item>
            <Form.Item name="hometown" label="Quê quán">
              <Input placeholder="VD: Hải Phòng / Nam Định" />
            </Form.Item>
          </div>
          <Form.Item name="emergencyContact" label="Thông tin người liên hệ">
            <Input placeholder="SĐT hoặc họ tên người liên hệ khi cần" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Mục tiêu nghề nghiệp / Hoạt động tình nguyện / Ghi chú thêm"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung mô tả' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <div className="cv-modal-actions">
            <Button onClick={() => setModal(null)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saveSectionMutation.isPending}>
              Lưu thông tin khác
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 11. Live CV Template Switcher & A4 Preview Modal */}
      <Modal
        title="Chọn mẫu & Xem trước bản in CV (A4)"
        open={modal?.type === 'template'}
        onCancel={() => setModal(null)}
        width={920}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <Segmented<CvTemplateType>
              value={previewTemplate}
              onChange={(val) => setPreviewTemplate(val)}
              options={[
                { value: 'modern', label: 'Hiện đại (2 cột Executive)' },
                { value: 'classic', label: 'Cổ điển (Editorial Serif)' },
                { value: 'minimal', label: 'Tối giản (Swiss Clean)' },
              ]}
            />
            <Space>
              <Button
                onClick={() => {
                  settingsMutation.mutate({ cvTemplate: previewTemplate });
                  setModal(null);
                }}
              >
                Đặt làm mẫu mặc định
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={downloading}
                onClick={() => handleDownloadPdf(previewTemplate)}
              >
                Tải PDF mẫu này
              </Button>
            </Space>
          </div>
        }
      >
        <div className="cv-preview-frame">
          <CvPaperPreview cv={cv} template={previewTemplate} />
        </div>
      </Modal>
    </div>
  );
}
