import { api } from '@/lib/axios';
import type {
  AdminReport,
  Category,
  Job,
  JobStatus,
  PaginatedResponse,
  PremiumPackage,
  User,
  UserRole,
} from '@/types';

export const adminService = {
  getReports: () => api.get<AdminReport>('/admin/reports').then((res) => res.data),

  getUsers: (params?: { q?: string; role?: UserRole; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then((res) => res.data),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch<User>(`/admin/users/${id}/status`, { isActive }).then((res) => res.data),

  updateUserRole: (id: string, role: UserRole) =>
    api.patch<User>(`/admin/users/${id}/role`, { role }).then((res) => res.data),

  getJobs: (params?: { q?: string; status?: JobStatus; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Job>>('/admin/jobs', { params }).then((res) => res.data),

  moderateJob: (id: string, payload: { approve: boolean; reason?: string }) =>
    api.patch<Job>(`/admin/jobs/${id}/moderate`, payload).then((res) => res.data),

  createPackage: (payload: Omit<PremiumPackage, '_id'>) =>
    api.post<PremiumPackage>('/premium-packages', payload).then((res) => res.data),

  updatePackage: (id: string, payload: Partial<PremiumPackage>) =>
    api.patch<PremiumPackage>(`/premium-packages/${id}`, payload).then((res) => res.data),

  deletePackage: (id: string) =>
    api.delete(`/premium-packages/${id}`).then((res) => res.data),

  createCategory: (payload: { name: string; description?: string }) =>
    api.post<Category>('/categories', payload).then((res) => res.data),

  recalculateMarket: () =>
    api.post('/market-insights/recalculate').then((res) => res.data),
};
