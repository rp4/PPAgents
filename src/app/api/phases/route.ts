import { createLookupRoute } from '@/lib/api/lookup-route-factory';

// GET /api/phases - Get all phases
export const GET = createLookupRoute({
  model: 'phase',
  wrapResponse: true,
  responseName: 'phases',
});
