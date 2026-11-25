'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Tag } from 'antd';
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
  const router = useRouter();

  return (
    <div className="emp-subnav">
      <div className="emp-subnav__links">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onMouseEnter={() => router.prefetch(item.href)}
            className={`site-nav__link${pathname === item.href ? ' is-active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <Tag color="volcano" style={{ margin: 0 }}>
        Quản trị hệ thống
      </Tag>
    </div>
  );
}
