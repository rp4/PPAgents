import { createLookupRoute } from '@/lib/api/lookup-route-factory';

// GET /api/benefits - Get all benefits
export const GET = createLookupRoute({
  model: 'benefit',
  wrapResponse: true,
  responseName: 'benefits',
});
