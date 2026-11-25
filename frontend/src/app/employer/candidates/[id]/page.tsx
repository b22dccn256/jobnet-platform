'use client';

import { Button, Card, Divider, Tag, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import { getErrorMessage } from '@/lib/error';
import { cvService } from '@/services/cv.service';

export default function EmployerCandidateDetailPage({ params }: { params: { id: string } }) {
  const { data: cv, isLoading } = useQuery({
    queryKey: ['candidateCv', params.id],
    queryFn: () => cvService.getCandidateCv(params.id),
  });

  return (
    <div className="container section">
      <EmployerNav />
      {isLoading || !cv ? (
        <Card>Đang tải hồ sơ ứng viên...</Card>
      ) : (
        <Card
          title={`Hồ sơ ứng viên: ${cv.profile.fullName || cv.profile.email}`}
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() =>
                cvService
                  .downloadPdfBlob(`/cv/candidate/${params.id}/pdf`)
                  .catch((err) => message.error(getErrorMessage(err, 'Không thể tải PDF')))
              }
            >
              Tải CV PDF
            </Button>
          }
          style={{ borderRadius: 14 }}
        >
          <p>
            <strong>Email:</strong> {cv.profile.email} · <strong>SĐT:</strong>{' '}
            {cv.profile.phone || 'Chưa cập nhật'} · <strong>Vị trí mong muốn:</strong>{' '}
            {cv.profile.desiredTitle || '–'}
          </p>
          {cv.profile.bio && <p style={{ color: '#334155' }}>{cv.profile.bio}</p>}

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
              {p.description && <p style={{ margin: '4px 0 0', color: '#64748b' }}>{p.description}</p>}
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
      )}
    </div>
  );
}
