import { api } from '@/lib/axios';

// TODO: các hàm gọi API nhóm `/search` (xem docs/API.md)
export const searchService = {
  ping: () => api.get('/search'),
};
