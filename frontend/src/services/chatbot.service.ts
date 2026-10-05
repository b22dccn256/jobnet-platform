import { api } from '@/lib/axios';

// TODO: các hàm gọi API nhóm `/chatbot` (xem docs/API.md)
export const chatbotService = {
  ping: () => api.get('/chatbot'),
};
