'use client';

import { Button, Card, Tag, message } from 'antd';
import { CheckCircleOutlined, CrownOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import { getErrorMessage } from '@/lib/error';
import { employerService } from '@/services/employer.service';

export default function EmployerUpgradePage() {
  const { data: packages } = useQuery({
    queryKey: ['premiumPackages'],
    queryFn: () => employerService.getPackages(),
  });

  const { data: activeSub } = useQuery({
    queryKey: ['activePremium'],
    queryFn: () => employerService.getActivePremium(),
  });

  const payMutation = useMutation({
    mutationFn: employerService.createVnpayUrl,
    onSuccess: (res) => {
      window.location.href = res.paymentUrl;
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể khởi tạo thanh toán VNPay')),
  });

  return (
    <div className="container section">
      <EmployerNav />

      <div className="section__head">
        <div>
          <h1 className="section__title">Nâng cấp gói dịch vụ Nhà tuyển dụng (VNPay)</h1>
          <p className="section__subtitle">
            Mở rộng hạn mức đăng tin và kích hoạt tính năng gợi ý ứng viên thông minh 105 điểm
          </p>
        </div>
        {activeSub?.active && (
          <Tag color="green" icon={<CrownOutlined />}>
            Đang có gói hiệu lực đến{' '}
            {activeSub.subscription?.endAt
              ? new Date(activeSub.subscription.endAt).toLocaleDateString('vi-VN')
              : ''}
          </Tag>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: 20,
        }}
      >
        {(packages?.items || []).map((pkg) => (
          <Card
            key={pkg._id}
            title={pkg.name}
            style={{ borderRadius: 14, display: 'flex', flexDirection: 'column' }}
          >
            <p style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', margin: '0 0 8px' }}>
              {pkg.price.toLocaleString('vi-VN')} đ
            </p>
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              Thời hạn {pkg.durationDays} ngày · Tối đa {pkg.postLimit} tin tuyển dụng
            </p>
            <ul style={{ paddingLeft: 18, marginBottom: 20, color: '#334155' }}>
              {(pkg.features || []).map((f) => (
                <li key={f} style={{ marginBottom: 6 }}>
                  <CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              type="primary"
              block
              size="large"
              loading={payMutation.isPending}
              onClick={() => payMutation.mutate(pkg._id)}
            >
              Thanh toán qua VNPay
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
