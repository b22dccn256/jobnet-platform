'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const shouldLogUi =
  typeof window !== 'undefined' && process.env.NODE_ENV !== 'production';

function RouteProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navStartRef = useRef<number | null>(null);

  const routeKey = `${pathname}?${searchParams?.toString() || ''}`;

  useEffect(() => {
    if (shouldLogUi && navStartRef.current !== null) {
      const elapsed = Math.round(performance.now() - navStartRef.current);
      console.info(`[UI <--] Đã mở trang ${pathname} (${elapsed}ms)`);
      navStartRef.current = null;
    }
    setNavigating(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [routeKey, pathname]);

  useEffect(() => {
    const startProgress = (targetPath?: string) => {
      navStartRef.current = performance.now();
      if (shouldLogUi) {
        console.info(`[UI -->] Chuyển trang${targetPath ? `: ${targetPath}` : '...'}`);
      }
      setNavigating(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setNavigating(false);
      }, 15000);
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = (event.target as HTMLElement | null)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      if (target.target && target.target !== '_self') return;
      if (target.hasAttribute('download')) return;

      try {
        const nextUrl = new URL(href, window.location.href);
        if (nextUrl.origin !== window.location.origin) return;
        const current = `${window.location.pathname}${window.location.search}`;
        const next = `${nextUrl.pathname}${nextUrl.search}`;
        if (next === current) return;
        startProgress(next);
      } catch {
        // Ignore malformed URLs
      }
    };

    const handlePopState = () => startProgress(window.location.pathname);

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
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
