'use client';

import { useEffect } from 'react';
import { Button, Card, Form, Input, Statistic, Tag, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card>
          <Statistic title="Tổng tin tuyển dụng đã đăng" value={jobs?.total || 0} />
        </Card>
        <Card>
          <Statistic title="Tổng hồ sơ ứng viên nhận được" value={apps?.total || 0} />
        </Card>
        <Card>
          <p style={{ margin: 0, color: '#64748b' }}>Trạng thái gói dịch vụ</p>
          <div style={{ marginTop: 8 }}>
            {activeSub?.active ? (
              <Tag color="green">
                Đang kích hoạt · Còn {activeSub.subscription?.remainingPosts} lượt đăng
              </Tag>
            ) : (
              <Tag>Chưa kích hoạt gói Premium</Tag>
            )}
          </div>
        </Card>
      </div>

      <Card
        title={company ? 'Cập nhật hồ sơ doanh nghiệp' : 'Khởi tạo hồ sơ doanh nghiệp (Bắt buộc trước khi đăng tin)'}
        style={{ borderRadius: 14 }}
      >
        {isLoading ? (
          <p>Đang tải...</p>
        ) : (
          <Form
            layout="vertical"
            initialValues={company || {}}
            onFinish={(v) => saveMutation.mutate(v)}
          >
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
                <Input placeholder="Hà Nội" />
              </Form.Item>
              <Form.Item name="website" label="Website">
                <Input placeholder="https://example.com" />
              </Form.Item>
              {company && (
                <Form.Item label="Logo công ty">
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
                    <Button icon={<UploadOutlined />}>Tải logo lên</Button>
                  </Upload>
                </Form.Item>
              )}
            </div>
            <Form.Item name="description" label="Giới thiệu doanh nghiệp">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              {company ? 'Cập nhật hồ sơ công ty' : 'Tạo hồ sơ công ty'}
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
