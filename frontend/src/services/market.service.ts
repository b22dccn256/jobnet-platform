import { api } from '@/lib/axios';

// TODO: các hàm gọi API nhóm `/market-insights` (xem docs/API.md)
export const marketService = {
  ping: () => api.get('/market-insights'),
};
