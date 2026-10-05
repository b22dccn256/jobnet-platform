import { api } from '@/lib/axios';

// TODO: các hàm gọi API nhóm `/employer` (xem docs/API.md)
export const employerService = {
  ping: () => api.get('/employer'),
};
