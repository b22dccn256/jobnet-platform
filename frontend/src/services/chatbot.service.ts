import { api } from '@/lib/axios';
import type { Job } from '@/types';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  mode?: string;
  reply: string;
  filters?: Record<string, unknown>;
  jobs: Job[];
}

export const chatbotService = {
  chat: (message: string, history: ChatTurn[] = []) =>
    api.post<ChatResponse>('/chatbot/chat', { message, history }).then((res) => res.data),
};
