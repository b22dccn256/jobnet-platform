import { api } from '@/lib/axios';
import type { Job } from '@/types';
import type { JobQueryFilter } from './jobs.service';

export interface SearchJobsResponse {
  q: string;
  items: Job[];
  total: number;
  page: number;
  limit: number;
  engine?: string;
}

export const searchService = {
  searchJobs: (params?: JobQueryFilter) =>
    api.get<SearchJobsResponse>('/search/jobs', { params }).then((res) => res.data),

  suggest: (q: string) =>
    api
      .get<{ prefix: string; suggestions: string[] }>('/search/suggest', { params: { q } })
      .then((res) => res.data),
};
