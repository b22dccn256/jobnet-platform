import { api } from '@/lib/axios';
import type { Category, Job, JobStatus, PaginatedResponse } from '@/types';

export interface JobQueryFilter {
  q?: string;
  category?: string;
  company?: string;
  location?: string;
  workMode?: string;
  level?: string;
  skills?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
}

export interface UpsertJobPayload {
  title: string;
  category?: string;
  description?: string;
  benefits?: string;
  requirements?: string;
  skills?: string[];
  location?: string;
  workMode?: 'onsite' | 'remote' | 'hybrid';
  level?: 'intern' | 'junior' | 'middle' | 'senior';
  education?: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
}

export const jobsService = {
  getJobs: (params?: JobQueryFilter) =>
    api.get<PaginatedResponse<Job>>('/jobs', { params }).then((res) => res.data),

  getJobById: (id: string) =>
    api.get<Job>(`/jobs/${id}`).then((res) => res.data),

  getCategories: () =>
    api
      .get<PaginatedResponse<Category>>('/categories', { params: { limit: 100 } })
      .then((res) => res.data),

  getMyJobs: (params?: { status?: JobStatus; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Job>>('/jobs/my', { params }).then((res) => res.data),

  createJob: (payload: UpsertJobPayload) =>
    api.post<Job>('/jobs', payload).then((res) => res.data),

  updateJob: (id: string, payload: Partial<UpsertJobPayload>) =>
    api.patch<Job>(`/jobs/${id}`, payload).then((res) => res.data),

  closeJob: (id: string) =>
    api.patch<Job>(`/jobs/${id}/close`).then((res) => res.data),

  deleteJob: (id: string) =>
    api.delete(`/jobs/${id}`).then((res) => res.data),
};
