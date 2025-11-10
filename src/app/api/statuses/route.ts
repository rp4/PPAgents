import { createLookupRoute } from '@/lib/api/lookup-route-factory';

// GET /api/statuses - Get all statuses
export const GET = createLookupRoute({
  model: 'status',
  wrapResponse: true,
  responseName: 'statuses',
});
