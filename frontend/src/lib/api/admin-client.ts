import { requestJson } from '@/lib/api/request';
import type { AdminOverviewResponse } from '@/lib/admin/admin-overview';

export const adminClient = {
    getOverview: async () =>
        requestJson<AdminOverviewResponse>('/api/admin/overview'),
};
