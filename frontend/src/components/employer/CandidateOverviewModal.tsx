'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Modal, Skeleton, Space, message } from 'antd';
import {
  CloseOutlined,
  CloudDownloadOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FilePdfOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { LEVEL_LABEL, resolveAssetUrl } from '@/lib/format';
import { cvService } from '@/services/cv.service';

interface Props {
  candidateId: string | null;
  attachedCvUrl?: string;
  onClose: () => void;
  onSendEmail?: (target: { email: string; fullName?: string }) => void;
}

export default function CandidateOverviewModal({
  candidateId,
  attachedCvUrl,
  onClose,
  onSendEmail,
}: Props) {
  const [downloading, setDownloading] = useState(false);

  const { data: cv, isLoading } = useQuery({
    queryKey: ['candidateCv', candidateId],
    queryFn: () => cvService.getCandidateCv(candidateId!),
    enabled: Boolean(candidateId),
  });

  const profile = cv?.profile;
  const displayName = profile?.fullName || profile?.email || 'Ứng viên';
  const firstEdu = cv?.educations?.[0];
  const otherItem = cv?.otherInfo?.[0];

  const handleDownloadPdf = async () => {
    if (!candidateId) return;
    try {
      setDownloading(true);
      if (attachedCvUrl) {
        window.open(resolveAssetUrl(attachedCvUrl), '_blank', 'noopener,noreferrer');
      } else {
        await cvService.downloadPdfBlob(`/cv/candidate/${candidateId}/pdf`);
      }
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể tải CV PDF'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      open={Boolean(candidateId)}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={820}
      styles={{ content: { padding: 0, overflow: 'hidden', borderRadius: 16 } }}
    >
      {/* Gradient Header Bar matching Hình 3.13 */}
      <div className="cand-modal__banner">
        <span>Thông tin tổng quan ứng viên</span>
        <button type="button" className="cand-modal__close" onClick={onClose} aria-label="Đóng">
          <CloseOutlined />
        </button>
      </div>

      <div className="cand-modal__body">
        {isLoading || !cv || !profile ? (
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        ) : (
          <>
            <div className="cand-modal__top">
              <div className="cand-modal__person">
                <SmartAvatar
                  src={profile.avatar}
                  name={displayName}
                  className="cand-modal__avatar"
                />
                <div>
                  <h2 className="cand-modal__name">{displayName}</h2>
                  <p className="cand-modal__role">
                    {profile.desiredTitle || 'Ứng viên tìm việc'}
                  </p>
                </div>
              </div>

              <Space wrap>
                <Link href={`/employer/candidates/${profile._id}`} onClick={onClose}>
                  <Button icon={<ExportOutlined />}>Xem CV đầy đủ</Button>
                </Link>
                {onSendEmail && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => onSendEmail({ email: profile.email, fullName: profile.fullName })}
                  >
                    Gửi email
                  </Button>
                )}
              </Space>
            </div>

            <div className="cand-modal__grid">
              {/* Left Column */}
              <div className="cand-modal__left">
                <div className="cand-modal__section">
                  <h3>Tổng quan</h3>
                  <p className="cv-prose">
                    {profile.bio || 'Ứng viên chưa cập nhật phần giới thiệu tổng quan.'}
                  </p>
                  {profile.skills && profile.skills.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>
                        Kỹ năng & công cụ chính:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {profile.skills.map((s) => (
                          <span key={s} className="skill-chip">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {cv.workExperiences.length > 0 && (
                  <div className="cand-modal__section">
                    <h3>Kinh nghiệm gần đây</h3>
                    {cv.workExperiences.slice(0, 2).map((w, idx) => (
                      <div key={w._id || idx} style={{ marginBottom: 10 }}>
                        <strong>{w.position}</strong> ·{' '}
                        <span style={{ color: '#2563eb', fontWeight: 500 }}>{w.company}</span>
                        {w.description && (
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#475569' }}>
                            {w.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {otherItem?.content && (
                  <div className="cand-modal__section">
                    <h3>Chia sẻ cá nhân</h3>
                    <p className="cv-prose">{otherItem.content}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="cand-modal__right">
                <div className="cand-modal__box">
                  <div className="cand-modal__facts">
                    <div>
                      <span>NGÀY SINH</span>
                      <strong>{profile.dateOfBirth || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span>QUỐC TỊCH</span>
                      <strong>{profile.nationality || 'Việt Nam'}</strong>
                    </div>
                    <div>
                      <span>GIỚI TÍNH</span>
                      <strong>{profile.gender || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span>CẤP BẬC</span>
                      <strong>
                        {profile.desiredLevel
                          ? LEVEL_LABEL[profile.desiredLevel] || profile.desiredLevel
                          : 'Junior'}
                      </strong>
                    </div>
                    <div>
                      <span>KINH NGHIỆM</span>
                      <strong>{cv.workExperiences.length} vị trí</strong>
                    </div>
                    <div>
                      <span>HỌC VẤN</span>
                      <strong>{firstEdu?.degree || firstEdu?.school || 'Đại học'}</strong>
                    </div>
                  </div>
                </div>

                <div className="cand-modal__box cand-modal__cv-download">
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Tải CV</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <FilePdfOutlined style={{ fontSize: 24, color: '#2563eb' }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: 13.5 }}>{displayName}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {attachedCvUrl ? 'Tệp CV đính kèm' : 'PDF Hồ sơ trực tuyến'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<CloudDownloadOutlined />}
                    loading={downloading}
                    onClick={handleDownloadPdf}
                    aria-label="Tải xuống CV"
                  />
                </div>

                <div className="cand-modal__box">
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Thông tin liên hệ</div>
                  <div className="cand-modal__contacts">
                    <div>
                      <MailOutlined />
                      <div>
                        <span>EMAIL</span>
                        <strong>{profile.email}</strong>
                      </div>
                    </div>
                    {profile.phone && (
                      <div>
                        <PhoneOutlined />
                        <div>
                          <span>ĐIỆN THOẠI</span>
                          <strong>{profile.phone}</strong>
                        </div>
                      </div>
                    )}
                    {(profile.address || profile.desiredLocation) && (
                      <div>
                        <EnvironmentOutlined />
                        <div>
                          <span>ĐỊA CHỈ</span>
                          <strong>{profile.address || profile.desiredLocation}</strong>
                        </div>
                      </div>
                    )}
                    {profile.website && (
                      <div>
                        <GlobalOutlined />
                        <div>
                          <span>WEBSITE</span>
                          <strong>{profile.website}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
