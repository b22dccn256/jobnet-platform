import type { Metadata } from 'next';
import JobsSearchClient from '@/components/candidate/JobsSearchClient';
import type { Category, Job, PaginatedResponse } from '@/types';

export const metadata: Metadata = {
  title: 'Tìm kiếm việc làm | JobNet',
  description: 'Danh sách tin tuyển dụng đã kiểm duyệt dành cho ứng viên và doanh nghiệp SME.',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchInitialJobs(searchParams: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const key of ['q', 'category', 'location', 'workMode', 'level']) {
    if (searchParams[key]) qs.set(key, searchParams[key]!);
  }
  qs.set('limit', '10');

  const start = Date.now();
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[SSR -->] GET /jobs?${qs.toString()} & /categories`);
  }

  try {
    const [jobsRes, catsRes] = await Promise.all([
      fetch(`${API_BASE}/jobs?${qs.toString()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      }),
      fetch(`${API_BASE}/categories?limit=100`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(4000),
      }),
    ]);
    const initialJobs: PaginatedResponse<Job> = jobsRes.ok
      ? await jobsRes.json()
      : { items: [], total: 0, page: 1, limit: 10 };
    const catsJson: PaginatedResponse<Category> = catsRes.ok
      ? await catsRes.json()
      : { items: [], total: 0, page: 1, limit: 100 };
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[SSR <--] /jobs status=${jobsRes.status}, categories=${catsRes.status} (${Date.now() - start}ms)`,
      );
    }
    return { initialJobs, categories: catsJson.items || [] };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[SSR ERR] /jobs (${Date.now() - start}ms):`, (err as Error).message);
    }
    return {
      initialJobs: { items: [], total: 0, page: 1, limit: 10 },
      categories: [],
    };
  }
}

/** Server-Side Rendered (SSR) job listing page for SEO (Chapter 1 Section 1.4.1a). */
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const { initialJobs, categories } = await fetchInitialJobs(searchParams);

  return (
    <JobsSearchClient
      initialJobs={initialJobs}
      categories={categories}
      initialFilters={{
        q: searchParams.q,
        category: searchParams.category,
        location: searchParams.location,
        workMode: searchParams.workMode,
        level: searchParams.level,
      }}
    />
  );
}
