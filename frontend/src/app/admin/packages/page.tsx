'use client';

import { Button, Card, Form, Input, InputNumber, Popconfirm, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AdminNav from '@/components/admin/AdminNav';
import { getErrorMessage } from '@/lib/error';
import { adminService } from '@/services/admin.service';
import { employerService } from '@/services/employer.service';
import type { PremiumPackage } from '@/types';

export default function AdminPackagesPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['premiumPackages'],
    queryFn: () => employerService.getPackages(),
  });

  const createMutation = useMutation({
    mutationFn: adminService.createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumPackages'] });
      form.resetFields();
      message.success('Đã thêm gói dịch vụ mới');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể tạo gói')),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumPackages'] });
      message.success('Đã xóa gói dịch vụ');
    },
  });

  return (
    <div className="container section">
      <AdminNav />

      <div className="section__head" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="section__title">Quản lý gói dịch vụ Premium</h1>
          <p className="section__subtitle">
            Thiết lập mức phí, hạn mức tin đăng và quyền lợi mở khóa gợi ý ứng viên cho doanh nghiệp
          </p>
        </div>
      </div>

      <Card title="Tạo gói đăng tin Premium mới" style={{ borderRadius: 14, marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={(v) =>
            createMutation.mutate({
              name: v.name,
              price: v.price,
              durationDays: v.durationDays,
              postLimit: v.postLimit,
              features: String(v.featuresText || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        >
          <div className="form-grid-2">
            <Form.Item name="name" label="Tên gói" rules={[{ required: true, message: 'Nhập tên gói' }]}>
              <Input placeholder="VD: Gói SME Chuyên Nghiệp" />
            </Form.Item>
            <Form.Item name="price" label="Giá gói (VND)" rules={[{ required: true, message: 'Nhập giá gói' }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={100000} />
            </Form.Item>
            <Form.Item name="durationDays" label="Thời hạn (ngày)" initialValue={30}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item name="postLimit" label="Số lượt đăng tin" initialValue={15}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </div>
          <Form.Item name="featuresText" label="Quyền lợi (phân cách bởi dấu phẩy)">
            <Input placeholder="Đăng tối đa 15 tin, Mở khóa gợi ý ứng viên 105 điểm" />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Tạo gói dịch vụ
          </Button>
        </Form>
      </Card>

      <Card title="Danh sách các gói dịch vụ hiện hành" style={{ borderRadius: 14 }}>
        <Table<PremiumPackage>
          rowKey="_id"
          loading={isLoading}
          dataSource={data?.items || []}
          scroll={{ x: 680 }}
          columns={[
            {
              title: 'Tên gói',
              dataIndex: 'name',
              render: (v: string) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>,
            },
            {
              title: 'Giá (VND)',
              render: (_, r) => (
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#1d4ed8' }}>
                  {r.price.toLocaleString('vi-VN')} đ
                </span>
              ),
            },
            {
              title: 'Thời hạn',
              dataIndex: 'durationDays',
              render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v} ngày</span>,
            },
            {
              title: 'Lượt đăng',
              dataIndex: 'postLimit',
              render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v} tin</span>,
            },
            {
              title: 'Quyền lợi',
              render: (_, r) => (
                <Space size={[6, 6]} wrap>
                  {(r.features || []).map((f) => (
                    <Tag key={f} style={{ margin: 0 }}>
                      {f}
                    </Tag>
                  ))}
                </Space>
              ),
            },
            {
              title: 'Thao tác',
              width: 96,
              render: (_, r) => (
                <Popconfirm title="Xóa gói này?" onConfirm={() => deleteMutation.mutate(r._id)}>
                  <Button danger size="small" aria-label="Xóa gói dịch vụ" icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
