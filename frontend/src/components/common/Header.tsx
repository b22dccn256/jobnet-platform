'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Drawer, Dropdown, type MenuProps } from 'antd';
import {
  BankOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HeartOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProfileOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import { ROLE_LABEL } from '@/lib/format';
import type { UserRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/jobs', label: 'Việc làm', icon: <SearchOutlined /> },
  { href: '/companies', label: 'Công ty', icon: <BankOutlined /> },
  { href: '/chatbot', label: 'Trợ lý AI', icon: <RobotOutlined /> },
  { href: '/market-insights', label: 'Thị trường', icon: <BarChartOutlined /> },
];

const ROLE_LINKS: Record<UserRole, NavItem[]> = {
  candidate: [
    { href: '/cv', label: 'Hồ sơ CV của tôi', icon: <FileTextOutlined /> },
    { href: '/recommended', label: 'Việc làm gợi ý', icon: <SearchOutlined /> },
    { href: '/applied', label: 'Việc đã ứng tuyển', icon: <CheckCircleOutlined /> },
    { href: '/saved', label: 'Việc đã lưu', icon: <HeartOutlined /> },
  ],
  employer: [
    { href: '/employer/dashboard', label: 'Bảng điều khiển', icon: <DashboardOutlined /> },
    { href: '/employer/jobs', label: 'Tin tuyển dụng', icon: <ProfileOutlined /> },
  ],
  admin: [{ href: '/admin/reports', label: 'Trang quản trị', icon: <DashboardOutlined /> }],
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, accessToken, hydrated } = useSelector((state: RootState) => state.auth);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const isLoggedIn = Boolean(accessToken && user);
  const displayName = user?.fullName || user?.email || '';
  const initial = (displayName || 'U').charAt(0).toUpperCase();

  const go = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    dispatch(logout());
    go('/login');
  };

  const userMenuItems: MenuProps['items'] = user
    ? [
        ...ROLE_LINKS[user.role].map((item) => ({
          key: item.href,
          icon: item.icon,
          label: <Link href={item.href}>{item.label}</Link>,
        })),
        { type: 'divider' as const },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
      ]
    : [];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-logo" aria-label="JobNet – Trang chủ">
          JobNet<span>.</span>
        </Link>

        <nav className="site-nav" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`site-nav__link${isActivePath(pathname, item.href) ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          {!hydrated ? (
            <span className="site-header__placeholder" aria-hidden />
          ) : isLoggedIn && user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <button type="button" className="header-user" aria-label="Mở menu tài khoản">
                <Avatar size={34} style={{ backgroundColor: '#2563eb', flexShrink: 0 }}>
                  {initial}
                </Avatar>
                <span className="header-user__meta">
                  <span className="header-user__name">{displayName}</span>
                  <span className="header-user__role">{ROLE_LABEL[user.role]}</span>
                </span>
              </button>
            </Dropdown>
          ) : (
            <div className="site-header__auth">
              <Button type="text" onClick={() => go('/login')}>
                Đăng nhập
              </Button>
              <span className="site-header__register">
                <Button type="primary" onClick={() => go('/register')}>
                  Đăng ký
                </Button>
              </span>
              <span className="site-header__employer">
                <Button onClick={() => go('/register?role=employer')}>Nhà tuyển dụng</Button>
              </span>
            </div>
          )}

          <span className="site-header__burger">
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 18 }} />}
              aria-label="Mở menu điều hướng"
              onClick={() => setDrawerOpen(true)}
            />
          </span>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        width={320}
        rootClassName="mobile-drawer"
        title={
          <span className="site-logo">
            JobNet<span>.</span>
          </span>
        }
      >
        {isLoggedIn && user && (
          <div className="drawer-user">
            <Avatar size={40} style={{ backgroundColor: '#2563eb', flexShrink: 0 }}>
              {initial}
            </Avatar>
            <div className="drawer-user__meta">
              <span className="drawer-user__name">{displayName}</span>
              <span className="drawer-user__role">{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
        )}

        <p className="drawer-section-title">Khám phá</p>
        <nav className="drawer-nav" aria-label="Điều hướng di động">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={`drawer-nav__link${isActivePath(pathname, item.href) ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {isLoggedIn && user ? (
          <>
            <p className="drawer-section-title">Tài khoản</p>
            <nav className="drawer-nav" aria-label="Tài khoản">
              {ROLE_LINKS[user.role].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`drawer-nav__link${isActivePath(pathname, item.href) ? ' is-active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="drawer-actions">
              <Button danger block size="large" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
              </Button>
            </div>
          </>
        ) : (
          <div className="drawer-actions">
            <Button type="primary" block size="large" onClick={() => go('/register')}>
              Đăng ký tài khoản
            </Button>
            <Button block size="large" onClick={() => go('/login')}>
              Đăng nhập
            </Button>
            <Button block size="large" type="dashed" onClick={() => go('/register?role=employer')}>
              Dành cho nhà tuyển dụng
            </Button>
          </div>
        )}
      </Drawer>
    </header>
  );
}
