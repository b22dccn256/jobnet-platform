'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Segmented, Space, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import CvPaperPreview from '@/components/candidate/CvPaperPreview';
import EmployerNav from '@/components/employer/EmployerNav';
import { getErrorMessage } from '@/lib/error';
import { cvService } from '@/services/cv.service';
import type { CvTemplateType } from '@/types';

export default function EmployerCandidateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [template, setTemplate] = useState<CvTemplateType | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);

  const { data: cv, isLoading } = useQuery({
    queryKey: ['candidateCv', params.id],
    queryFn: () => cvService.getCandidateCv(params.id),
  });

  const activeTemplate = template || cv?.profile?.cvTemplate || 'modern';

  return (
    <div className="container section">
      <EmployerNav />

      <div className="section__head" style={{ marginBottom: 18 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Quay lại
          </Button>
          <strong style={{ fontSize: 18 }}>
            Chi tiết CV ứng viên {cv?.profile?.fullName ? `– ${cv.profile.fullName}` : ''}
          </strong>
        </Space>

        {cv && (
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
                    `/cv/candidate/${params.id}/pdf?template=${activeTemplate}`,
                  );
                } catch (err) {
                  message.error(getErrorMessage(err, 'Không thể tải PDF'));
                } finally {
                  setDownloading(false);
                }
              }}
            >
              Tải CV PDF
            </Button>
          </Space>
        )}
      </div>

      {isLoading || !cv ? (
        <Card>Đang tải hồ sơ ứng viên...</Card>
      ) : (
        <CvPaperPreview cv={cv} template={activeTemplate} />
      )}
    </div>
  );
}
