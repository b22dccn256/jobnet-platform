'use client';

import {
  Suspense,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/common/AuthShell';

const shouldLogUi =
  typeof window !== 'undefined' && process.env.NODE_ENV !== 'production';

let currentNavigating = false;
let currentPendingPath: string | null = null;
let navStartTimestamp: number | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((fn) => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getNavigatingSnapshot() {
  return currentNavigating;
}

function getPendingPathSnapshot() {
  return currentPendingPath;
}

function getServerNavigatingSnapshot() {
  return false;
}

function getServerPendingPathSnapshot() {
  return null;
}

export function usePendingPath(): string | null {
  return useSyncExternalStore(
    subscribe,
    getPendingPathSnapshot,
    getServerPendingPathSnapshot,
  );
}

export function startRouteProgress(targetHref?: string) {
  if (typeof window === 'undefined') return;

  let nextPathname: string | null = null;
  let nextFull: string | null = null;

  if (targetHref) {
    try {
      const nextUrl = new URL(targetHref, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      const currentFull = `${window.location.pathname}${window.location.search}`;
      nextPathname = nextUrl.pathname;
      nextFull = `${nextUrl.pathname}${nextUrl.search}`;
      if (nextFull === currentFull) return;
    } catch {
      return;
    }
  }

  navStartTimestamp = performance.now();
  if (shouldLogUi) {
    console.info(`[UI -->] Chuyển trang${nextFull ? `: ${nextFull}` : '...'}`);
  }

  currentNavigating = true;
  currentPendingPath = nextPathname;
  if (nextPathname && nextPathname !== window.location.pathname) {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
  emitChange();

  if (safetyTimer) clearTimeout(safetyTimer);
  safetyTimer = setTimeout(() => {
    currentNavigating = false;
    currentPendingPath = null;
    emitChange();
  }, 15000);
}

function clearRouteProgress(pathname: string) {
  if (shouldLogUi && navStartTimestamp !== null) {
    const elapsed = Math.round(performance.now() - navStartTimestamp);
    console.info(`[UI <--] Đã mở trang ${pathname} (${elapsed}ms)`);
    navStartTimestamp = null;
  }
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
  if (currentNavigating || currentPendingPath !== null) {
    currentNavigating = false;
    currentPendingPath = null;
    emitChange();
  }
}

function DestinationPageSkeleton({ targetPath }: { targetPath: string }) {
  // 1. Auth pages (/login, /register, /forgot-password, /reset-password)
  if (
    targetPath === '/login' ||
    targetPath === '/register' ||
    targetPath === '/forgot-password' ||
    targetPath === '/reset-password'
  ) {
    const isRegister = targetPath === '/register';
    const title = isRegister
      ? 'Tạo tài khoản mới'
      : targetPath === '/forgot-password'
        ? 'Khôi phục mật khẩu'
        : 'Đăng nhập JobNet';
    const subtitle = isRegister
      ? 'Chọn vai trò phù hợp để bắt đầu cùng JobNet'
      : 'Tiếp tục hành trình nghề nghiệp của bạn';

    return (
      <AuthShell>
        <div className="auth-card__head">
          <h2 className="auth-card__title">{title}</h2>
          <p className="auth-card__subtitle">{subtitle}</p>
        </div>
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div className="app-skeleton" style={{ height: 42, borderRadius: 10 }} />
          <div className="app-skeleton" style={{ height: 44, borderRadius: 10 }} />
          <div className="app-skeleton" style={{ height: 44, borderRadius: 10 }} />
          {isRegister && <div className="app-skeleton" style={{ height: 44, borderRadius: 10 }} />}
          <div
            className="app-skeleton"
            style={{ height: 46, borderRadius: 10, marginTop: 6 }}
          />
        </div>
      </AuthShell>
    );
  }

  // 2. Job Detail page (/jobs/[id])
  if (targetPath.startsWith('/jobs/')) {
    return (
      <div className="container section">
        <div
          className="app-skeleton app-skeleton--short"
          style={{ marginBottom: 18, height: 18, width: 180 }}
        />
        <div className="job-detail-layout">
          <div className="app-skeleton-card" style={{ padding: 24 }}>
            <div
              className="app-skeleton app-skeleton--title"
              style={{ width: '68%', marginBottom: 14 }}
            />
            <div
              className="app-skeleton app-skeleton--line"
              style={{ width: '42%', marginBottom: 24 }}
            />
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
            <div className="app-skeleton app-skeleton--line" style={{ marginTop: 20 }} />
            <div className="app-skeleton app-skeleton--line app-skeleton--short" />
          </div>
          <div className="app-skeleton-card" style={{ padding: 20 }}>
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line app-skeleton--short" />
            <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
          </div>
        </div>
      </div>
    );
  }

  // 3. CV Studio (/cv)
  if (targetPath === '/cv' || targetPath.startsWith('/cv/')) {
    return (
      <div className="container section">
        <div
          className="app-skeleton-card"
          style={{ height: 170, marginBottom: 24, borderRadius: 18 }}
        />
        <div className="job-detail-layout">
          <div className="app-skeleton-card" style={{ padding: 22 }}>
            <div className="app-skeleton app-skeleton--title" style={{ width: '55%' }} />
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
            <div className="app-skeleton app-skeleton--line app-skeleton--short" />
          </div>
          <div className="app-skeleton-card" style={{ padding: 22 }}>
            <div className="app-skeleton app-skeleton--title" style={{ width: '45%' }} />
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line" />
            <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
          </div>
        </div>
      </div>
    );
  }

  // 4. Determine header title & subtitle for primary tabs
  const META_BY_PATH: Record<string, { title: string; subtitle: string }> = {
    '/jobs': {
      title: 'Tìm kiếm việc làm',
      subtitle: 'Tra cứu nhanh qua chỉ mục Elasticsearch (hỗ trợ tiếng Việt có dấu & không dấu)',
    },
    '/companies': {
      title: 'Danh sách doanh nghiệp tuyển dụng',
      subtitle: 'Khám phá hồ sơ công ty và theo dõi cơ hội việc làm mới',
    },
    '/chatbot': {
      title: 'Trợ lý AI hỗ trợ tìm việc',
      subtitle: 'Kết hợp phân tích quy tắc tiếng Việt và mô hình LLaMA 3.3 70B trên dữ liệu việc làm thực tế',
    },
    '/market-insights': {
      title: 'Phân tích & Xu hướng thị trường việc làm',
      subtitle: 'So sánh mức lương trung bình, trung vị theo ngành, kỹ năng nổi bật và nhu cầu tuyển dụng',
    },
    '/recommended': {
      title: 'Việc làm gợi ý phù hợp với hồ sơ của bạn',
      subtitle: 'Được xếp hạng tự động theo 9 tiêu chí (kỹ năng, kinh nghiệm, cấp bậc, mức lương, địa điểm...)',
    },
    '/applied': {
      title: 'Việc làm đã ứng tuyển',
      subtitle: 'Theo dõi tiến độ phản hồi hồ sơ từ doanh nghiệp',
    },
    '/saved': {
      title: 'Đã lưu & Theo dõi',
      subtitle: 'Quản lý các vị trí việc làm đã lưu và doanh nghiệp bạn đang theo dõi để nhận tin mới',
    },
  };

  const meta = META_BY_PATH[targetPath];

  return (
    <div className="container section">
      {meta ? (
        <div className="section__head">
          <div>
            <h1 className="section__title">{meta.title}</h1>
            <p className="section__subtitle">{meta.subtitle}</p>
          </div>
        </div>
      ) : (
        <div className="app-skeleton-head">
          <div className="app-skeleton app-skeleton--title" />
          <div className="app-skeleton app-skeleton--subtitle" />
        </div>
      )}

      {targetPath === '/jobs' && (
        <div
          className="app-skeleton-card"
          style={{ height: 68, marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {targetPath === '/chatbot' || targetPath === '/market-insights' ? (
        <div className="app-skeleton-card" style={{ padding: 24, minHeight: 360 }}>
          <div className="app-skeleton app-skeleton--line" style={{ width: '48%' }} />
          <div className="app-skeleton app-skeleton--line" style={{ height: 220, marginTop: 12 }} />
        </div>
      ) : (
        <div className="app-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="app-skeleton-card">
              <div className="app-skeleton app-skeleton--line" />
              <div className="app-skeleton app-skeleton--line app-skeleton--short" />
              <div className="app-skeleton app-skeleton--line app-skeleton--mid" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RouteMainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pendingPath = usePendingPath();
  const showDestinationSkeleton = Boolean(pendingPath && pendingPath !== pathname);

  return (
    <main className="site-main">
      {showDestinationSkeleton && pendingPath ? (
        <DestinationPageSkeleton targetPath={pendingPath} />
      ) : null}
      <div style={showDestinationSkeleton ? { display: 'none' } : undefined}>{children}</div>
    </main>
  );
}

function RouteProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigating = useSyncExternalStore(
    subscribe,
    getNavigatingSnapshot,
    getServerNavigatingSnapshot,
  );
  const mountedRef = useRef(false);

  const routeKey = `${pathname}?${searchParams?.toString() || ''}`;

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    clearRouteProgress(pathname);
  }, [routeKey, pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const el = event.target as HTMLElement | null;
      if (!el || el.closest('[data-no-nav="true"]')) return;

      const target = el.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      if (target.target && target.target !== '_self') return;
      if (target.hasAttribute('download')) return;

      startRouteProgress(href);
    };

    const handlePopState = () => startRouteProgress(window.location.pathname);

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (!navigating) return null;

  return (
    <div className="route-progress" role="progressbar" aria-label="Đang tải trang">
      <div className="route-progress__bar" />
    </div>
  );
}

export default function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <RouteProgressInner />
    </Suspense>
  );
}
