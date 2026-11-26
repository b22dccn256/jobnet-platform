'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Tag } from 'antd';
import {
  BulbOutlined,
  CrownOutlined,
  DashboardOutlined,
  FileAddOutlined,
  ProfileOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { usePendingPath } from '@/components/common/RouteProgressBar';
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
  const pendingPath = usePendingPath();
  const activePath = pendingPath || pathname;
  const router = useRouter();
  const company = useSelector((state: RootState) => state.auth.company);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="emp-subnav">
      <div className="emp-subnav__links">
        {ITEMS.map((item) => {
          const active =
            item.href === '/employer/jobs'
              ? activePath === '/employer/jobs' ||
                (activePath.startsWith('/employer/jobs/') && activePath !== '/employer/jobs/new')
              : activePath === item.href || activePath.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(item.href)}
              className={`site-nav__link${active ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {mounted && company?.name && (
        <Tag color="blue" style={{ margin: 0 }}>
          {company.name}
        </Tag>
      )}
    </div>
  );
}
