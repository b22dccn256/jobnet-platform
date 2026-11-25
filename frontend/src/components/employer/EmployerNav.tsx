'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Space, Tag } from 'antd';
import {
  BulbOutlined,
  CrownOutlined,
  DashboardOutlined,
  FileAddOutlined,
  ProfileOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

const ITEMS = [
  { href: '/employer/dashboard', label: 'Tổng quan & Công ty', icon: <DashboardOutlined /> },
  { href: '/employer/jobs', label: 'Tin tuyển dụng', icon: <ProfileOutlined /> },
  { href: '/employer/jobs/new', label: 'Đăng tin mới', icon: <FileAddOutlined /> },
  { href: '/employer/candidates', label: 'Hồ sơ ứng tuyển', icon: <TeamOutlined /> },
  { href: '/employer/suggestions', label: 'Gợi ý ứng viên (105đ)', icon: <BulbOutlined /> },
  { href: '/employer/upgrade', label: 'Nâng cấp gói VNPay', icon: <CrownOutlined /> },
];

export default function EmployerNav() {
  const pathname = usePathname();
  const company = useSelector((state: RootState) => state.auth.company);

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
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`site-nav__link${active ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </Space>
      {company?.name && <Tag color="blue">{company.name}</Tag>}
    </div>
  );
}
