import { createLookupRoute } from '@/lib/api/lookup-route-factory';

// GET /api/ops-statuses - Get all ops statuses
export const GET = createLookupRoute({
  model: 'opsStatus',
  wrapResponse: true,
  responseName: 'opsStatuses',
});
