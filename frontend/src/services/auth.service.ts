import { api } from '@/lib/axios';
import type { AuthResponse, User, UserRole } from '@/types';

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: Extract<UserRole, 'candidate' | 'employer'>;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  register: (payload: RegisterPayload) => api.post('/auth/register', payload),
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  me: () => api.get<User>('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
};
