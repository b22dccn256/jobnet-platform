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

  try {
    const [jobsRes, catsRes] = await Promise.all([
      fetch(`${API_BASE}/jobs?${qs.toString()}`, { cache: 'no-store' }),
      fetch(`${API_BASE}/categories?limit=100`, { cache: 'no-store' }),
    ]);
    const initialJobs: PaginatedResponse<Job> = jobsRes.ok
      ? await jobsRes.json()
      : { items: [], total: 0, page: 1, limit: 10 };
    const catsJson: PaginatedResponse<Category> = catsRes.ok
      ? await catsRes.json()
      : { items: [], total: 0, page: 1, limit: 100 };
    return { initialJobs, categories: catsJson.items || [] };
  } catch {
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
