import { api } from '@/lib/axios';
import type { MarketOverview } from '@/types';

export const marketService = {
  getOverview: () =>
    api.get<MarketOverview>('/market-insights/overview').then((res) => res.data),
};
