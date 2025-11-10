/**
 * Lookup Route Factory
 * Creates standardized GET handlers for lookup tables (categories, tags, statuses, etc.)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { handleApiError } from './error-handler';

type LookupModel = 'category' | 'tag' | 'status' | 'phase' | 'benefit' | 'opsStatus';

interface LookupConfig {
  model: LookupModel;
  select?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  wrapResponse?: boolean; // whether to wrap in { [modelName]: data }
  responseName?: string; // custom wrapper name
}

const defaultSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  orderIndex: true,
};

/**
 * Creates a standardized GET handler for lookup tables
 */
export function createLookupRoute(config: LookupConfig) {
  return async function GET() {
    try {
      const items = await (prisma[config.model] as any).findMany({
        select: config.select || {
          ...defaultSelect,
          ...(config.model === 'category' ? { icon: true } : { color: true }),
        },
        orderBy: config.orderBy || { orderIndex: 'asc' },
      });

      if (config.wrapResponse) {
        const wrapperName = config.responseName || `${config.model}s`;
        return NextResponse.json({ [wrapperName]: items, total: items.length });
      }

      return NextResponse.json(items);
    } catch (error) {
      return handleApiError(error, {
        action: `fetch_${config.model}s`,
      });
    }
  };
}
