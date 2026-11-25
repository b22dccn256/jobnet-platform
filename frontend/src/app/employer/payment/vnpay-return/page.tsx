'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Card, Result, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/error';
import { employerService } from '@/services/employer.service';

function VnpayReturnResult() {
  const searchParams = useSearchParams();
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    paramsObj[key] = value;
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['vnpayReturn', paramsObj.vnp_TxnRef],
    queryFn: () => employerService.verifyVnpayReturn(paramsObj),
    enabled: Boolean(paramsObj.vnp_TxnRef),
    retry: false,
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <p style={{ marginTop: 12 }}>Đang xác thực chữ ký và số tiền giao dịch VNPay...</p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <Result
        status="error"
        title="Thanh toán không thành công"
        subTitle={
          error ? getErrorMessage(error, 'Xác thực giao dịch thất bại') : data?.message
        }
        extra={
          <Link href="/employer/upgrade">
            <Button type="primary">Quay lại chọn gói</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Result
      status="success"
      title="Kích hoạt gói dịch vụ thành công!"
      subTitle={data.message}
      extra={[
        <Link href="/employer/suggestions" key="suggest">
          <Button type="primary">Xem gợi ý ứng viên ngay</Button>
        </Link>,
        <Link href="/employer/dashboard" key="dash">
          <Button>Về bảng điều khiển</Button>
        </Link>,
      ]}
    />
  );
}

export default function VnpayReturnPage() {
  return (
    <div className="container section">
      <Card style={{ borderRadius: 16, maxWidth: 620, margin: '0 auto' }}>
        <Suspense fallback={<div>Đang xử lý kết quả thanh toán...</div>}>
          <VnpayReturnResult />
        </Suspense>
      </Card>
    </div>
  );
}
