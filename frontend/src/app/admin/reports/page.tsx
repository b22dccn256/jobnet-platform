'use client';

import { Button, Card, Statistic, Tag, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
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
        <Card>Đang tải số liệu báo cáo...</Card>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Card>
              <Statistic
                title="Tổng doanh thu qua VNPay"
                value={data.revenue}
                suffix="đ"
                valueStyle={{ color: '#10b981' }}
              />
              <Tag color="green" style={{ marginTop: 8 }}>
                {data.premiumOrders} giao dịch thành công
              </Tag>
            </Card>
            <Card>
              <Statistic title="Tổng tài khoản người dùng" value={data.users.total} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
                Ứng viên: {data.users.candidates} · NTD: {data.users.employers} · Admin:{' '}
                {data.users.admins}
              </p>
            </Card>
            <Card>
              <Statistic title="Tổng doanh nghiệp đăng ký" value={data.companies} />
            </Card>
            <Card>
              <Statistic title="Tổng đơn ứng tuyển" value={data.applications} />
            </Card>
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
                valueStyle={{ color: '#10b981' }}
              />
              <Statistic
                title="Đã từ chối"
                value={data.jobs.rejected}
                valueStyle={{ color: '#ef4444' }}
              />
              <Statistic title="Đã đóng" value={data.jobs.closed} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
