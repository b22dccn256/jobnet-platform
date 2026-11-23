'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

const { Title, Text, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');

  const onFinish = async (values: { email: string }) => {
    try {
      setLoading(true);
      await authService.forgotPassword(values.email);
      setTargetEmail(values.email);
      setSubmitted(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 180px)', padding: 24 }}>
      <Card style={{ width: 440, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', borderRadius: 12 }}>
        {submitted ? (
          <Result
            status="success"
            title="Kiểm tra email của bạn"
            subTitle={
              <span>
                Nếu tài khoản <strong>{targetEmail}</strong> tồn tại trên hệ thống, link đặt lại mật khẩu đã được gửi đến hòm thư (vui lòng kiểm tra cả mục Spam/Thư rác).
              </span>
            }
            extra={[
              <Link href="/login" key="login">
                <Button type="primary" block>
                  Quay lại đăng nhập
                </Button>
              </Link>,
            ]}
          />
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ marginBottom: 8, color: '#1e293b' }}>Quên mật khẩu?</Title>
              <Paragraph type="secondary">
                Nhập địa chỉ email liên kết với tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
              </Paragraph>
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

              <Form.Item style={{ marginTop: 24 }}>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
                  Gửi liên kết khôi phục
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/login" style={{ fontSize: 14, color: '#64748b' }}>
                &larr; Quay lại trang đăng nhập
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
