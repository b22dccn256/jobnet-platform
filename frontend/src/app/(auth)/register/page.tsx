'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Radio, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setSession } from '@/store/authSlice';
import { authService, RegisterPayload } from '@/services/auth.service';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const onFinish = async (values: RegisterPayload) => {
    try {
      setLoading(true);
      const res = await authService.register(values);
      const data = res.data;
      if (data.accessToken) {
        dispatch(setSession(data));
      }
      message.success('Đăng ký tài khoản thành công!');

      if (values.role === 'employer') {
        router.push('/employer/dashboard');
      } else {
        router.push('/jobs');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Đăng ký thất bại, email có thể đã tồn tại';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 180px)', padding: 24 }}>
      <Card style={{ width: 480, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8, color: '#1e293b' }}>Tạo tài khoản mới</Title>
          <Text type="secondary">Gia nhập JobNet để tìm việc hoặc tiếp cận hàng ngàn ứng viên</Text>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          size="large"
          initialValues={{ role: 'candidate' }}
        >
          <Form.Item name="role" label="Bạn tham gia với tư cách:">
            <Radio.Group style={{ width: '100%', display: 'flex' }} buttonStyle="solid">
              <Radio.Button value="candidate" style={{ flex: 1, textAlign: 'center' }}>
                Người tìm việc (Ứng viên)
              </Radio.Button>
              <Radio.Button value="employer" style={{ flex: 1, textAlign: 'center' }}>
                Nhà tuyển dụng (Doanh nghiệp)
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Nguyễn Văn A" />
          </Form.Item>

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
            name="phone"
            label="Số điện thoại"
            rules={[{ required: false }]}
          >
            <Input prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="0912345678" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' },
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Ít nhất 6 ký tự" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
              Đăng ký tài khoản
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0', fontSize: 13, color: '#94a3b8' }}>hoặc</Divider>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Đã có tài khoản? </Text>
          <Link href="/login" style={{ fontWeight: 600, color: '#2563eb' }}>
            Đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
}
