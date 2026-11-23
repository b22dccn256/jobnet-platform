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
              borderRadius: 8,
            },
          }}
        >
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}
