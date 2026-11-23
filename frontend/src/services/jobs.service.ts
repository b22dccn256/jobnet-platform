import { api } from '@/lib/axios';
import type { Category, Job, PaginatedResponse } from '@/types';

export interface JobQueryFilter {
  q?: string;
  category?: string;
  location?: string;
  workMode?: string;
  level?: string;
  skills?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
}

export const jobsService = {
  getJobs: (params?: JobQueryFilter) =>
    api.get<PaginatedResponse<Job>>('/jobs', { params }).then((res) => res.data),

  getJobById: (id: string) =>
    api.get<Job>(`/jobs/${id}`).then((res) => res.data),

  getCategories: () =>
    api.get<PaginatedResponse<Category>>('/categories', { params: { limit: 100 } }).then((res) => res.data),
};
