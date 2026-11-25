'use client';

import { Button, Card, Skeleton, Statistic, Tag, message } from 'antd';
import {
  BankOutlined,
  DollarCircleOutlined,
  FileDoneOutlined,
  SyncOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import AdminNav from '@/components/admin/AdminNav';
import { getErrorMessage } from '@/lib/error';
import { adminService } from '@/services/admin.service';

export default function AdminReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => adminService.getReports(),
  });

  const recalcMutation = useMutation({
    mutationFn: adminService.recalculateMarket,
    onSuccess: () => message.success('Đã tổng hợp lại chỉ số thị trường (trung bình & trung vị)'),
    onError: (err) => message.error(getErrorMessage(err, 'Không thể tổng hợp')),
  });

  return (
    <div className="container section">
      <AdminNav />

      <div className="section__head">
        <div>
          <h1 className="section__title">Báo cáo hoạt động & Doanh thu VNPay</h1>
          <p className="section__subtitle">Số liệu tổng hợp toàn hệ thống theo thời gian thực</p>
        </div>
        <Button
          icon={<SyncOutlined />}
          loading={recalcMutation.isPending}
          onClick={() => recalcMutation.mutate()}
        >
          Cập nhật thống kê thị trường
        </Button>
      </div>

      {isLoading || !data ? (
        <Card style={{ borderRadius: 14 }}>
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      ) : (
        <>
          <div className="sugg-kpi-grid">
            <div className="sugg-kpi-card">
              <span className="sugg-kpi-card__icon" style={{ background: '#059669' }}>
                <DollarCircleOutlined />
              </span>
              <div>
                <div className="sugg-kpi-card__label">Tổng doanh thu VNPay</div>
                <strong className="sugg-kpi-card__value">
                  {data.revenue.toLocaleString('vi-VN')} đ
                </strong>
                <div>
                  <Tag color="success" style={{ marginTop: 4 }}>
                    {data.premiumOrders} giao dịch thành công
                  </Tag>
                </div>
              </div>
            </div>

            <div className="sugg-kpi-card">
              <span className="sugg-kpi-card__icon">
                <TeamOutlined />
              </span>
              <div>
                <div className="sugg-kpi-card__label">Tài khoản người dùng</div>
                <strong className="sugg-kpi-card__value">{data.users.total}</strong>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  ỨV: {data.users.candidates} · NTD: {data.users.employers} · Admin: {data.users.admins}
                </div>
              </div>
            </div>

            <div className="sugg-kpi-card">
              <span className="sugg-kpi-card__icon" style={{ background: '#0284c7' }}>
                <BankOutlined />
              </span>
              <div>
                <div className="sugg-kpi-card__label">Doanh nghiệp đăng ký</div>
                <strong className="sugg-kpi-card__value">{data.companies}</strong>
              </div>
            </div>

            <div className="sugg-kpi-card">
              <span className="sugg-kpi-card__icon" style={{ background: '#7c3aed' }}>
                <FileDoneOutlined />
              </span>
              <div>
                <div className="sugg-kpi-card__label">Tổng đơn ứng tuyển</div>
                <strong className="sugg-kpi-card__value">{data.applications}</strong>
              </div>
            </div>
          </div>

          <Card title="Tình trạng tin tuyển dụng trên hệ thống" style={{ borderRadius: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 16,
              }}
            >
              <Statistic title="Tổng số tin" value={data.jobs.total} />
              <Statistic
                title="Chờ kiểm duyệt"
                value={data.jobs.pending}
                valueStyle={{ color: '#d97706' }}
              />
              <Statistic
                title="Đang hiển thị"
                value={data.jobs.approved}
                valueStyle={{ color: '#059669' }}
              />
              <Statistic
                title="Đã từ chối"
                value={data.jobs.rejected}
                valueStyle={{ color: '#dc2626' }}
              />
              <Statistic title="Đã đóng" value={data.jobs.closed} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
