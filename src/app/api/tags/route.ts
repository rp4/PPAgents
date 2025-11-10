import { createLookupRoute } from '@/lib/api/lookup-route-factory';

// GET /api/tags - Get all tags
export const GET = createLookupRoute({
  model: 'tag',
  select: {
    id: true,
    name: true,
    slug: true,
    description: true,
    icon: true,
    color: true,
  },
  orderBy: { name: 'asc' },
  wrapResponse: false,
});
