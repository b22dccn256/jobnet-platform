import { api } from '@/lib/axios';
import type { CandidateCvData, CvTemplateType, PaginatedResponse, User } from '@/types';

export type ProfileSectionName =
  | 'educations'
  | 'work-experiences'
  | 'projects'
  | 'courses'
  | 'languages'
  | 'health'
  | 'other-info';

export const cvService = {
  getMyCv: () => api.get<CandidateCvData>('/cv/me').then((res) => res.data),

  getCandidateCv: (userId: string) =>
    api.get<CandidateCvData>(`/cv/candidate/${userId}`).then((res) => res.data),

  updateSettings: (payload: {
    cvTemplate?: CvTemplateType;
    isCvPublic?: boolean;
    regenerateShareToken?: boolean;
    bio?: string;
    skills?: string[];
    desiredTitle?: string;
    desiredLevel?: string;
    desiredSalaryMin?: number;
    desiredLocation?: string;
  }) => api.patch<CandidateCvData>('/cv/me/settings', payload).then((res) => res.data),

  updateProfile: (payload: Partial<User>) =>
    api.patch<User>('/users/me', payload).then((res) => res.data),

  uploadFile: (file: File, folder: 'cv' | 'avatar' | 'company' = 'cv') => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<{ key: string; url: string | { url: string } }>(`/storage/upload?folder=${folder}`, formData)
      .then((res) => res.data);
  },

  downloadPdfBlob: async (path: string) => {
    const res = await api.get<Blob>(path, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'cv-jobnet.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  listSection: <T = Record<string, unknown>>(section: ProfileSectionName) =>
    api.get<PaginatedResponse<T>>(`/${section}`, { params: { limit: 50 } }).then((res) => res.data),

  createSectionItem: <T = Record<string, unknown>>(
    section: ProfileSectionName,
    payload: Record<string, unknown>,
  ) => api.post<T>(`/${section}`, payload).then((res) => res.data),

  updateSectionItem: <T = Record<string, unknown>>(
    section: ProfileSectionName,
    id: string,
    payload: Record<string, unknown>,
  ) => api.patch<T>(`/${section}/${id}`, payload).then((res) => res.data),

  deleteSectionItem: (section: ProfileSectionName, id: string) =>
    api.delete(`/${section}/${id}`).then((res) => res.data),
};
