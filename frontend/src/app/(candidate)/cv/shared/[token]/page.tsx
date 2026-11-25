'use client';

import { Button, Card, Empty, Segmented, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CvPaperPreview from '@/components/candidate/CvPaperPreview';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/error';
import { cvService } from '@/services/cv.service';
import type { CandidateCvData, CvTemplateType } from '@/types';

export default function SharedCvPage({ params }: { params: { token: string } }) {
  const [template, setTemplate] = useState<CvTemplateType | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);

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
        <Card>
          <Empty description="Liên kết CV không tồn tại hoặc ứng viên đã tắt chế độ chia sẻ công khai." />
        </Card>
      </div>
    );
  }

  const activeTemplate = template || cv.profile.cvTemplate || 'modern';

  return (
    <div className="container section">
      <div className="section__head" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="section__title" style={{ marginBottom: 4 }}>
            Hồ sơ CV trực tuyến – {cv.profile.fullName || cv.profile.email}
          </h1>
          <p className="section__subtitle">
            {cv.profile.desiredTitle || 'Ứng viên trên nền tảng JobNet'}
          </p>
        </div>
        <Space wrap>
          <Segmented<CvTemplateType>
            value={activeTemplate}
            onChange={(v) => setTemplate(v)}
            options={[
              { value: 'modern', label: 'Hiện đại' },
              { value: 'classic', label: 'Cổ điển' },
              { value: 'minimal', label: 'Tối giản' },
            ]}
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={async () => {
              try {
                setDownloading(true);
                await cvService.downloadPdfBlob(
                  `/cv/shared/${params.token}/pdf?template=${activeTemplate}`,
                );
              } catch (err) {
                message.error(getErrorMessage(err, 'Không thể tải PDF'));
              } finally {
                setDownloading(false);
              }
            }}
          >
            Tải xuống PDF
          </Button>
        </Space>
      </div>

      <CvPaperPreview cv={cv} template={activeTemplate} />
    </div>
  );
}
