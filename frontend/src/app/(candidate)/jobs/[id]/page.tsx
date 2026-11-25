import { cache } from 'react';
import type { Metadata } from 'next';
import JobDetailClient from '@/components/candidate/JobDetailClient';
import type { Job } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const fetchJobServer = cache(async (id: string): Promise<Job | null> => {
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[SSR <--] GET /jobs/${id} status=${res.status} (${Date.now() - start}ms)`);
    }
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[SSR ERR] GET /jobs/${id} (${Date.now() - start}ms):`, (err as Error).message);
    }
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const job = await fetchJobServer(params.id);
  if (!job) {
    return { title: 'Chi tiết việc làm | JobNet' };
  }
  const companyName =
    typeof job.company === 'object' && job.company !== null ? job.company.name : 'JobNet';
  return {
    title: `${job.title} – ${companyName} | JobNet`,
    description: job.description?.slice(0, 160) || `Ứng tuyển vị trí ${job.title} tại ${companyName}.`,
  };
}

/** Server-Side Rendered (SSR) job detail page for SEO (Chapter 1 Section 1.4.1a). */
export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const initialJob = await fetchJobServer(params.id);
  return <JobDetailClient jobId={params.id} initialJob={initialJob} fetchedAt={Date.now()} />;
}
