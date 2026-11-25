'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Space, Tag } from 'antd';
import {
  AuditOutlined,
  BarChartOutlined,
  CrownOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const ITEMS = [
  { href: '/admin/reports', label: 'Báo cáo & Doanh thu', icon: <BarChartOutlined /> },
  { href: '/admin/jobs-moderation', label: 'Kiểm duyệt tin đăng', icon: <AuditOutlined /> },
  { href: '/admin/users', label: 'Người dùng & Phân quyền', icon: <TeamOutlined /> },
  { href: '/admin/packages', label: 'Gói dịch vụ Premium', icon: <CrownOutlined /> },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        marginBottom: 24,
        borderRadius: 12,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
      }}
    >
      <Space wrap size={6}>
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`site-nav__link${pathname === item.href ? ' is-active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </Space>
      <Tag color="red">Quản trị hệ thống</Tag>
    </div>
  );
}
