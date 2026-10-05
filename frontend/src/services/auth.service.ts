import { api } from '@/lib/axios';

// TODO: các hàm gọi API nhóm `/auth` (xem docs/API.md)
export const authService = {
  ping: () => api.get('/auth'),
};
