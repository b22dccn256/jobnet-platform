'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { store } from '@/store';
import { hydrateSession } from '@/store/authSlice';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    store.dispatch(hydrateSession());
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: '#2563eb',
              colorInfo: '#2563eb',
              colorSuccess: '#059669',
              colorWarning: '#d97706',
              colorError: '#dc2626',
              colorTextBase: '#0f172a',
              colorBgLayout: '#f8fafc',
              colorBgContainer: '#ffffff',
              colorBorder: '#e2e8f0',
              colorBorderSecondary: '#f1f5f9',
              borderRadius: 10,
              borderRadiusLG: 14,
              borderRadiusSM: 7,
              controlHeight: 38,
              controlHeightLG: 44,
              fontSize: 14,
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              boxShadowSecondary:
                '0 10px 28px -10px rgba(15, 23, 42, 0.14), 0 2px 6px -1px rgba(15, 23, 42, 0.06)',
            },
            components: {
              Card: {
                headerFontSize: 15.5,
                headerHeight: 52,
                paddingLG: 22,
              },
              Button: {
                fontWeight: 600,
                primaryShadow: '0 1px 2px rgba(37, 99, 235, 0.22)',
              },
              Table: {
                headerBg: '#f8fafc',
                headerColor: '#334155',
                headerSplitColor: '#e2e8f0',
                rowHoverBg: '#f8fbff',
                borderColor: '#f1f5f9',
              },
              Tag: {
                borderRadiusSM: 6,
              },
              Modal: {
                borderRadiusLG: 16,
              },
            },
          }}
        >
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}
