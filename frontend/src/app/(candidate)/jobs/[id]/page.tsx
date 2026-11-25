import type { Metadata } from 'next';
import JobDetailClient from '@/components/candidate/JobDetailClient';
import type { Job } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchJobServer(id: string): Promise<Job | null> {
  try {
    const res = await fetch(`${API_BASE}/jobs/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

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
  return <JobDetailClient jobId={params.id} initialJob={initialJob} />;
}
