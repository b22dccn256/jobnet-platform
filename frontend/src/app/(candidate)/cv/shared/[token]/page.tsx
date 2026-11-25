'use client';

import { Button, Card, Divider, Tag, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/error';
import { cvService } from '@/services/cv.service';
import type { CandidateCvData } from '@/types';

export default function SharedCvPage({ params }: { params: { token: string } }) {
  const { data: cv, isLoading } = useQuery({
    queryKey: ['sharedCv', params.token],
    queryFn: () =>
      api.get<CandidateCvData>(`/cv/shared/${params.token}`).then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="container section">
        <Card>Đang tải hồ sơ CV được chia sẻ...</Card>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="container section">
        <Card>Liên kết CV không tồn tại hoặc đã bị tắt chia sẻ công khai.</Card>
      </div>
    );
  }

  return (
    <div className="container section">
      <Card
        title={`CV Ứng viên: ${cv.profile.fullName || cv.profile.email}`}
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() =>
              cvService
                .downloadPdfBlob(`/cv/shared/${params.token}/pdf`)
                .catch((err) => message.error(getErrorMessage(err, 'Không thể tải PDF')))
            }
          >
            Tải PDF
          </Button>
        }
        style={{ borderRadius: 16 }}
      >
        <p>
          <strong>Vị trí ứng tuyển:</strong> {cv.profile.desiredTitle || '–'} ·{' '}
          <strong>Email:</strong> {cv.profile.email}
        </p>
        {cv.profile.bio && <p>{cv.profile.bio}</p>}
        <div style={{ margin: '12px 0' }}>
          {(cv.profile.skills || []).map((s) => (
            <Tag key={s} color="blue">
              {s}
            </Tag>
          ))}
        </div>

        <Divider />
        <h3>Kinh nghiệm làm việc</h3>
        {cv.workExperiences.map((w, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <strong>{w.position}</strong> – {w.company}
            {w.description && <p style={{ margin: '4px 0 0', color: '#64748b' }}>{w.description}</p>}
          </div>
        ))}

        <Divider />
        <h3>Dự án</h3>
        {cv.projects.map((p, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <strong>{p.name}</strong>{' '}
            {(p.technologies || []).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        ))}

        <Divider />
        <h3>Học vấn</h3>
        {cv.educations.map((e, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <strong>{e.school}</strong> – {e.degree} {e.major}
          </div>
        ))}
      </Card>
    </div>
  );
}
