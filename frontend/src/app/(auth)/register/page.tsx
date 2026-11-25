'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Divider, Form, Input, message } from 'antd';
import {
  BankOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import AuthShell from '@/components/common/AuthShell';
import { getErrorMessage } from '@/lib/error';
import { HOME_BY_ROLE } from '@/lib/format';
import { authService, type RegisterPayload } from '@/services/auth.service';
import { setSession } from '@/store/authSlice';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'employer' ? 'employer' : 'candidate';
  const [role, setRole] = useState<'candidate' | 'employer'>(initialRole);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const onFinish = async (values: Omit<RegisterPayload, 'role'>) => {
    try {
      setLoading(true);
      const res = await authService.register({ ...values, role });
      const data = res.data as {
        id: string;
        email: string;
        fullName?: string;
        role: 'candidate' | 'employer';
        accessToken?: string;
      };
      if (data.accessToken) {
        dispatch(
          setSession({
            accessToken: data.accessToken,
            user: { id: data.id, email: data.email, fullName: data.fullName, role: data.role },
          }),
        );
      }
      message.success('Đăng ký tài khoản thành công!');
      router.push(HOME_BY_ROLE[role]);
    } catch (err) {
      message.error(getErrorMessage(err, 'Đăng ký thất bại, email có thể đã tồn tại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card__head">
        <h2 className="auth-card__title">Tạo tài khoản mới</h2>
        <p className="auth-card__subtitle">Chọn vai trò phù hợp để bắt đầu cùng JobNet</p>
      </div>

      <div className="role-selector" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`role-option${role === 'candidate' ? ' is-active' : ''}`}
          onClick={() => setRole('candidate')}
        >
          <UserOutlined className="role-option__icon" />
          <span className="role-option__title">Ứng viên</span>
          <span className="role-option__desc">Tạo CV, tìm việc & chat AI</span>
        </button>
        <button
          type="button"
          className={`role-option${role === 'employer' ? ' is-active' : ''}`}
          onClick={() => setRole('employer')}
        >
          <BankOutlined className="role-option__icon" />
          <span className="role-option__title">Nhà tuyển dụng</span>
          <span className="role-option__desc">Đăng tin & gợi ý ứng viên</span>
        </button>
      </div>

      <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <div className="form-grid-2">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Nhập họ tên' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="0912345678" />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="name@example.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, message: 'Nhập mật khẩu' },
            { min: 6, message: 'Tối thiểu 6 ký tự' },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Tối thiểu 6 ký tự" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Đăng ký tài khoản
        </Button>
      </Form>

      <Divider plain>hoặc</Divider>

      <p className="auth-card__footer">
        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div>Đang tải...</div>}>
        <RegisterFormContent />
      </Suspense>
    </AuthShell>
  );
}
