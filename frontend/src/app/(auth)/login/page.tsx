'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Divider, Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import AuthShell from '@/components/common/AuthShell';
import { getErrorMessage } from '@/lib/error';
import { HOME_BY_ROLE } from '@/lib/format';
import { authService, type LoginPayload } from '@/services/auth.service';
import { employerService } from '@/services/employer.service';
import { setCompany, setSession } from '@/store/authSlice';

const DEMO_ACCOUNTS = [
  { label: 'Ứng viên', email: 'candidate@jobnet.local' },
  { label: 'Nhà tuyển dụng', email: 'employer@jobnet.local' },
  { label: 'Quản trị viên', email: 'admin@jobnet.local' },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginPayload>();
  const router = useRouter();
  const dispatch = useDispatch();

  const onFinish = async (values: LoginPayload) => {
    try {
      setLoading(true);
      const res = await authService.login(values);
      const data = res.data;
      dispatch(setSession(data));

      if (data.user.role === 'employer') {
        const company = await employerService.getMyCompany().catch(() => null);
        dispatch(setCompany(company));
      }

      message.success('Đăng nhập thành công!');
      router.push(HOME_BY_ROLE[data.user.role] || '/jobs');
    } catch (err) {
      message.error(getErrorMessage(err, 'Email hoặc mật khẩu không chính xác'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="auth-card__head">
        <h2 className="auth-card__title">Đăng nhập JobNet</h2>
        <p className="auth-card__subtitle">Tiếp tục hành trình nghề nghiệp của bạn</p>
      </div>

      <div className="demo-login-bar">
        <span className="demo-login-bar__label">
          <ThunderboltOutlined /> Dùng nhanh tài khoản mẫu:
        </span>
        <div className="demo-login-bar__pills">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className="demo-login-pill"
              onClick={() => {
                form.setFieldsValue({ email: acc.email, password: '123456' });
              }}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Form.Item
          name="email"
          label="Địa chỉ Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="name@example.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="••••••••" />
        </Form.Item>

        <div className="auth-form__forgot">
          <Link href="/forgot-password">Quên mật khẩu?</Link>
        </div>

        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Đăng nhập
        </Button>
      </Form>

      <Divider plain>hoặc</Divider>

      <p className="auth-card__footer">
        Chưa có tài khoản? <Link href="/register">Tạo tài khoản mới</Link>
      </p>
    </AuthShell>
  );
}
