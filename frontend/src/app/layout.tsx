import type { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Providers from '@/providers/Providers';
import AppHeader from '@/components/common/Header';
import AppFooter from '@/components/common/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobNet – Nền tảng kết nối việc làm trực tuyến',
  description: 'Tìm kiếm việc làm nhanh chóng, chính xác với công nghệ AI và dữ liệu phân tích thị trường',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <Providers>
            <AppHeader />
            <main className="site-main">{children}</main>
            <AppFooter />
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
