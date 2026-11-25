'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Form, Input, Space, Tag, Upload, message } from 'antd';
import {
  CrownOutlined,
  FileAddOutlined,
  ProfileOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import SmartAvatar from '@/components/common/SmartAvatar';
import EmployerNav from '@/components/employer/EmployerNav';
import { getErrorMessage } from '@/lib/error';
import { applicationsService } from '@/services/applications.service';
import { cvService } from '@/services/cv.service';
import { employerService } from '@/services/employer.service';
import { jobsService } from '@/services/jobs.service';
import { setCompany } from '@/store/authSlice';

export default function EmployerDashboardPage() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['myCompany'],
    queryFn: () => employerService.getMyCompany().catch(() => null),
  });

  useEffect(() => {
    if (company !== undefined) {
      dispatch(setCompany(company));
    }
  }, [company, dispatch]);

  const { data: jobs } = useQuery({
    queryKey: ['employerJobsSummary'],
    queryFn: () => jobsService.getMyJobs({ limit: 1 }),
  });

  const { data: apps } = useQuery({
    queryKey: ['employerAppsSummary'],
    queryFn: () => applicationsService.getEmployerApplications({ limit: 1 }),
  });

  const { data: activeSub } = useQuery({
    queryKey: ['activePremium'],
    queryFn: () => employerService.getActivePremium(),
  });

  const saveMutation = useMutation({
    mutationFn: (values: {
      name: string;
      industry?: string;
      size?: string;
      address?: string;
      website?: string;
      description?: string;
      logo?: string;
    }) =>
      company
        ? employerService.updateCompany(company._id, values)
        : employerService.createCompany(values),
    onSuccess: (saved) => {
      dispatch(setCompany(saved));
      queryClient.invalidateQueries({ queryKey: ['myCompany'] });
      message.success('Đã lưu hồ sơ doanh nghiệp');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể lưu hồ sơ công ty')),
  });

  return (
    <div className="container section">
      <EmployerNav />

      <div className="section__head">
        <div>
          <h1 className="section__title">Bảng điều khiển Nhà tuyển dụng</h1>
          <p className="section__subtitle">
            Quản lý thương hiệu tuyển dụng, hạn mức đăng tin và hiệu quả thu hút hồ sơ
          </p>
        </div>
        <Link href="/employer/jobs/new">
          <Button type="primary" icon={<FileAddOutlined />}>
            Đăng tin mới
          </Button>
        </Link>
      </div>

      <div className="sugg-kpi-grid">
        <div className="sugg-kpi-card">
          <span className="sugg-kpi-card__icon">
            <ProfileOutlined />
          </span>
          <div>
            <div className="sugg-kpi-card__label">Tin tuyển dụng đã đăng</div>
            <strong className="sugg-kpi-card__value">{jobs?.total ?? 0}</strong>
          </div>
        </div>

        <div className="sugg-kpi-card">
          <span className="sugg-kpi-card__icon" style={{ background: '#059669' }}>
            <TeamOutlined />
          </span>
          <div>
            <div className="sugg-kpi-card__label">Hồ sơ ứng viên nhận được</div>
            <strong className="sugg-kpi-card__value">{apps?.total ?? 0}</strong>
          </div>
        </div>

        <div className="sugg-kpi-card">
          <span className="sugg-kpi-card__icon" style={{ background: '#d97706' }}>
            <CrownOutlined />
          </span>
          <div>
            <div className="sugg-kpi-card__label">Gói dịch vụ đăng tin</div>
            <div style={{ marginTop: 4 }}>
              {activeSub?.active ? (
                <Tag color="success" style={{ margin: 0 }}>
                  Còn {activeSub.subscription?.remainingPosts} lượt đăng
                </Tag>
              ) : (
                <Link href="/employer/upgrade">
                  <Tag color="warning" style={{ margin: 0, cursor: 'pointer' }}>
                    Nâng cấp gói Premium &rarr;
                  </Tag>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <Card
        title={
          company
            ? 'Hồ sơ thương hiệu doanh nghiệp'
            : 'Khởi tạo hồ sơ doanh nghiệp (Bắt buộc trước khi đăng tin)'
        }
        style={{ borderRadius: 14 }}
      >
        {isLoading ? (
          <p>Đang tải thông tin doanh nghiệp...</p>
        ) : (
          <Form
            layout="vertical"
            initialValues={company || {}}
            onFinish={(v) => saveMutation.mutate(v)}
          >
            {company && (
              <div className="company-logo-row">
                <SmartAvatar
                  src={company.logo}
                  name={company.name}
                  className="job-card__logo"
                  style={{ width: 64, height: 64, fontSize: 24, borderRadius: 14 }}
                />
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>{company.name}</strong>
                  <Upload
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={async (file) => {
                      try {
                        const up = await cvService.uploadFile(file, 'company');
                        saveMutation.mutate({ name: company.name, logo: up.key });
                      } catch (err) {
                        message.error(getErrorMessage(err, 'Tải logo thất bại'));
                      }
                      return false;
                    }}
                  >
                    <Button size="small" icon={<UploadOutlined />}>
                      Đổi logo công ty
                    </Button>
                  </Upload>
                </div>
              </div>
            )}

            <div className="form-grid-2">
              <Form.Item name="name" label="Tên doanh nghiệp" rules={[{ required: true }]}>
                <Input placeholder="Công ty TNHH Giải pháp Số SME" />
              </Form.Item>
              <Form.Item name="industry" label="Lĩnh vực hoạt động">
                <Input placeholder="Công nghệ thông tin" />
              </Form.Item>
              <Form.Item name="size" label="Quy mô nhân sự">
                <Input placeholder="20 - 50 nhân viên" />
              </Form.Item>
              <Form.Item name="address" label="Địa chỉ trụ sở">
                <Input placeholder="Quận Cầu Giấy, Hà Nội" />
              </Form.Item>
              <Form.Item name="website" label="Website chính thức">
                <Input placeholder="https://example.com" />
              </Form.Item>
            </div>
            <Form.Item name="description" label="Giới thiệu doanh nghiệp & văn hóa">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                {company ? 'Lưu hồ sơ công ty' : 'Tạo hồ sơ công ty'}
              </Button>
              {company && (
                <Link href={`/companies/${company._id}`}>
                  <Button>Xem trang công khai</Button>
                </Link>
              )}
            </Space>
          </Form>
        )}
      </Card>
    </div>
  );
}
