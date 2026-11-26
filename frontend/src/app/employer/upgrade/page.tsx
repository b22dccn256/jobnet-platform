'use client';

import { Button, Tag, message } from 'antd';
import { CheckCircleFilled, CrownOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
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

  const list = packages?.items || [];

  return (
    <div className="container section">
      <EmployerNav />

      <div className="section__head">
        <div>
          <h1 className="section__title">Nâng cấp gói dịch vụ Nhà tuyển dụng</h1>
          <p className="section__subtitle">
            Mở rộng hạn mức đăng tin và kích hoạt tính năng gợi ý ứng viên 105 điểm qua cổng VNPay
          </p>
        </div>
        {activeSub?.active && (
          <Tag color="success" icon={<CrownOutlined />} style={{ padding: '5px 12px' }}>
            Đang hiệu lực đến{' '}
            {activeSub.subscription?.endAt
              ? new Date(activeSub.subscription.endAt).toLocaleDateString('vi-VN')
              : ''}
          </Tag>
        )}
      </div>

      <div className="pricing-grid">
        {list.map((pkg, idx) => {
          const isFeatured = idx === 1 || (list.length === 1 && idx === 0);
          return (
            <article
              key={pkg._id}
              className={`pricing-card${isFeatured ? ' is-featured' : ''}`}
            >
              {isFeatured && <span className="pricing-card__ribbon">Được chọn nhiều nhất</span>}

              <div className="pricing-card__head">
                <h2 className="pricing-card__name">{pkg.name}</h2>
                <div className="pricing-card__price">
                  <strong>{pkg.price.toLocaleString('vi-VN')}</strong>
                  <span>VND</span>
                </div>
                <p className="pricing-card__meta">
                  Hiệu lực {pkg.durationDays} ngày · Tối đa {pkg.postLimit} tin đăng
                </p>
              </div>

              <ul className="pricing-card__features">
                {(pkg.features || []).map((f) => (
                  <li key={f}>
                    <CheckCircleFilled className="pricing-card__check" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="pricing-card__foot">
                <Button
                  type="default"
                  block
                  size="large"
                  loading={payMutation.isPending}
                  onClick={() => payMutation.mutate(pkg._id)}
                >
                  Thanh toán qua VNPay
                </Button>
                <p className="pricing-card__secure">
                  <SafetyCertificateOutlined /> Xác thực chữ ký số HMAC-SHA512
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
