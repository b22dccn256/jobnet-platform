'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setSession } from '@/store/authSlice';
import { authService, LoginPayload } from '@/services/auth.service';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const onFinish = async (values: LoginPayload) => {
    try {
      setLoading(true);
      const res = await authService.login(values);
      const data = res.data;
      dispatch(setSession(data));
      message.success('Đăng nhập thành công!');

      if (data.user.role === 'admin') {
        router.push('/admin/reports');
      } else if (data.user.role === 'employer') {
        router.push('/employer/dashboard');
      } else {
        router.push('/jobs');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại thông tin';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 180px)', padding: 24 }}>
      <Card style={{ width: 440, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8, color: '#1e293b' }}>Đăng nhập JobNet</Title>
          <Text type="secondary">Chào mừng bạn quay trở lại với cơ hội nghề nghiệp mới</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="name@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Mật khẩu</span>
                <Link href="/forgot-password" style={{ fontSize: 13, color: '#2563eb' }}>
                  Quên mật khẩu?
                </Link>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0', fontSize: 13, color: '#94a3b8' }}>hoặc</Divider>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Chưa có tài khoản? </Text>
          <Link href="/register" style={{ fontWeight: 600, color: '#2563eb' }}>
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </div>
  );
}
