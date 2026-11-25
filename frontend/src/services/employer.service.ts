import { api } from '@/lib/axios';
import type {
  CandidateRecommendationItem,
  Company,
  JobRecommendationItem,
  PaginatedResponse,
  PremiumPackage,
  RecruiterPremium,
} from '@/types';

export const employerService = {
  getCompanies: (params?: { q?: string; industry?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Company>>('/companies', { params }).then((res) => res.data),

  getCompanyById: (id: string) =>
    api.get<Company>(`/companies/${id}`).then((res) => res.data),

  getMyCompany: () =>
    api.get<Company>('/companies/me').then((res) => res.data),

  createCompany: (payload: Partial<Company> & { name: string }) =>
    api.post<Company>('/companies', payload).then((res) => res.data),

  updateCompany: (id: string, payload: Partial<Company>) =>
    api.patch<Company>(`/companies/${id}`, payload).then((res) => res.data),

  getPackages: () =>
    api
      .get<PaginatedResponse<PremiumPackage>>('/premium-packages', { params: { limit: 20 } })
      .then((res) => res.data),

  getActivePremium: () =>
    api
      .get<{ active: boolean; subscription: RecruiterPremium | null }>('/recruiter-premium/active')
      .then((res) => res.data),

  getMyPremiumOrders: () =>
    api.get<PaginatedResponse<RecruiterPremium>>('/recruiter-premium/me').then((res) => res.data),

  createVnpayUrl: (packageId: string) =>
    api
      .post<{ mode: string; paymentRef: string; amount: number; paymentUrl: string }>(
        '/payments/vnpay/create',
        { packageId },
      )
      .then((res) => res.data),

  verifyVnpayReturn: (params: Record<string, string>) =>
    api
      .get<{ success: boolean; message: string; order?: RecruiterPremium }>(
        '/payments/vnpay/return',
        { params },
      )
      .then((res) => res.data),

  getRecommendedCandidates: (jobId: string, params?: { page?: number; limit?: number }) =>
    api
      .get<{ jobId: string; total: number; items: CandidateRecommendationItem[] }>(
        `/recommendation/jobs/${jobId}/candidates`,
        { params },
      )
      .then((res) => res.data),

  getRecommendedJobs: (params?: { page?: number; limit?: number }) =>
    api
      .get<{ total: number; items: JobRecommendationItem[] }>('/recommendation/jobs', { params })
      .then((res) => res.data),

  sendEmail: (payload: { to: string; subject: string; html: string }) =>
    api.post('/mail/send', payload).then((res) => res.data),
};
