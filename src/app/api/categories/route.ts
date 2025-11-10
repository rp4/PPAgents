import { createLookupRoute } from '@/lib/api/lookup-route-factory';

// GET /api/categories - Get all categories
export const GET = createLookupRoute({
  model: 'category',
  wrapResponse: false,
});
