import { api } from '@/lib/axios';

// TODO: các hàm gọi API nhóm `/jobs` (xem docs/API.md)
export const jobsService = {
  ping: () => api.get('/jobs'),
};
