'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Form, Input, Result, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import AuthShell from '@/components/common/AuthShell';
import { getErrorMessage } from '@/lib/error';
import { authService } from '@/services/auth.service';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onFinish = async (values: { newPassword: string }) => {
    try {
      setLoading(true);
      await authService.resetPassword(token, values.newPassword);
      setSuccess(true);
      message.success('Đặt lại mật khẩu thành công!');
    } catch (err) {
      message.error(getErrorMessage(err, 'Mã xác thực không hợp lệ hoặc đã hết hạn'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Result
        status="warning"
        title="Thiếu mã xác thực"
        subTitle="Đường dẫn không hợp lệ. Vui lòng yêu cầu lại email đặt lại mật khẩu."
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
        title="Đổi mật khẩu thành công"
        subTitle="Vui lòng đăng nhập lại bằng mật khẩu mới của bạn."
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
      <div className="auth-card__head">
        <h2 className="auth-card__title">Thiết lập mật khẩu mới</h2>
        <p className="auth-card__subtitle">Nhập mật khẩu mới tối thiểu 6 ký tự</p>
      </div>

      <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 6, message: 'Tối thiểu 6 ký tự' },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng nhập lại mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Cập nhật mật khẩu
        </Button>
      </Form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div>Đang tải...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
