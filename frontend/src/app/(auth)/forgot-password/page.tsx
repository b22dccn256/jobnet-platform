'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Form, Input, Result, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import AuthShell from '@/components/common/AuthShell';
import { getErrorMessage } from '@/lib/error';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const onFinish = async (values: { email: string }) => {
    try {
      setLoading(true);
      await authService.forgotPassword(values.email);
      setSubmittedEmail(values.email);
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể gửi yêu cầu khôi phục mật khẩu'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {submittedEmail ? (
        <Result
          status="success"
          title="Đã gửi hướng dẫn khôi phục"
          subTitle={`Nếu tài khoản ${submittedEmail} tồn tại, liên kết đặt lại mật khẩu đã được gửi vào hộp thư của bạn.`}
          extra={
            <Link href="/login">
              <Button type="primary" block>
                Quay lại đăng nhập
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="auth-card__head">
            <h2 className="auth-card__title">Quên mật khẩu?</h2>
            <p className="auth-card__subtitle">
              Nhập email đăng ký để nhận đường dẫn đặt lại mật khẩu an toàn
            </p>
          </div>

          <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
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

            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Gửi liên kết đặt lại
            </Button>
          </Form>

          <p className="auth-card__footer" style={{ marginTop: 18 }}>
            <Link href="/login">&larr; Quay lại đăng nhập</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
