import { api } from '@/lib/axios';

// TODO: các hàm gọi API nhóm `/applications` (xem docs/API.md)
export const applicationsService = {
  ping: () => api.get('/applications'),
};
