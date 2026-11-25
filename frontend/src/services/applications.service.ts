import { api } from '@/lib/axios';
import type {
  Application,
  ApplicationStatus,
  Company,
  Job,
  PaginatedResponse,
} from '@/types';

export const applicationsService = {
  apply: (payload: { jobId: string; cvUrl?: string; coverLetter?: string }) =>
    api.post<Application>('/applications', payload).then((res) => res.data),

  getMyApplications: (params?: { status?: ApplicationStatus; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Application>>('/applications/me', { params }).then((res) => res.data),

  getEmployerApplications: (params?: {
    jobId?: string;
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<PaginatedResponse<Application>>('/applications/employer', { params })
      .then((res) => res.data),

  getApplicationById: (id: string) =>
    api.get<Application>(`/applications/${id}`).then((res) => res.data),

  updateStatus: (
    id: string,
    payload: { status: ApplicationStatus; notifyByEmail?: boolean; note?: string },
  ) => api.patch<Application>(`/applications/${id}/status`, payload).then((res) => res.data),

  withdraw: (id: string) =>
    api.delete(`/applications/${id}`).then((res) => res.data),

  getLikedJobs: (params?: { page?: number; limit?: number }) =>
    api
      .get<PaginatedResponse<{ _id: string; job: Job; createdAt?: string }>>('/job-likes/me', {
        params,
      })
      .then((res) => res.data),

  checkLiked: (jobId: string) =>
    api.get<{ liked: boolean }>(`/job-likes/check/${jobId}`).then((res) => res.data),

  likeJob: (jobId: string) =>
    api.post(`/job-likes/${jobId}`).then((res) => res.data),

  unlikeJob: (jobId: string) =>
    api.delete(`/job-likes/${jobId}`).then((res) => res.data),

  getFollowedCompanies: (params?: { page?: number; limit?: number }) =>
    api
      .get<PaginatedResponse<{ _id: string; company: Company }>>('/company-follows/me', { params })
      .then((res) => res.data),

  checkFollowing: (companyId: string) =>
    api.get<{ following: boolean }>(`/company-follows/check/${companyId}`).then((res) => res.data),

  getFollowersCount: (companyId: string) =>
    api
      .get<{ companyId: string; followersCount: number }>(
        `/company-follows/company/${companyId}/count`,
      )
      .then((res) => res.data),

  followCompany: (companyId: string) =>
    api.post(`/company-follows/${companyId}`).then((res) => res.data),

  unfollowCompany: (companyId: string) =>
    api.delete(`/company-follows/${companyId}`).then((res) => res.data),
};
