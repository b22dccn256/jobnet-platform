'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, message, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

const { Title, Paragraph } = Typography;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: { newPassword: string }) => {
    if (!token) {
      message.error('Mã xác thực không hợp lệ hoặc đã thiếu token!');
      return;
    }
    try {
      setLoading(true);
      await authService.resetPassword(token, values.newPassword);
      setSuccess(true);
      message.success('Đặt lại mật khẩu thành công!');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Mã xác thực đã hết hạn hoặc không hợp lệ';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Result
        status="warning"
        title="Liên kết không hợp lệ"
        subTitle="Không tìm thấy mã xác thực token trong liên kết. Vui lòng kiểm tra lại email hoặc yêu cầu liên kết mới."
        extra={
          <Link href="/forgot-password">
            <Button type="primary">Yêu cầu lại</Button>
          </Link>
        }
      />
    );
  }

  if (success) {
    return (
      <Result
        status="success"
        title="Đổi mật khẩu thành công!"
        subTitle="Mật khẩu của bạn đã được cập nhật an toàn. Vui lòng đăng nhập với mật khẩu mới."
        extra={
          <Button type="primary" onClick={() => router.push('/login')}>
            Đăng nhập ngay
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8, color: '#1e293b' }}>Thiết lập mật khẩu mới</Title>
        <Paragraph type="secondary">Nhập mật khẩu mới an toàn cho tài khoản của bạn</Paragraph>
      </div>

      <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
            { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Tối thiểu 6 ký tự" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Nhập lại mật khẩu mới" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
            Lưu mật khẩu mới
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 180px)', padding: 24 }}>
      <Card style={{ width: 440, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', borderRadius: 12 }}>
        <Suspense fallback={<div>Đang tải...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
