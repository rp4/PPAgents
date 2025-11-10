import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-helpers';
import { handleApiError } from '@/lib/api/error-handler';
import { toggleFavorite } from '@/lib/db/agents';

// POST /api/agents/[id]/favorite - Toggle favorite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return requireAuth(request, { params }, async (req, ctx, session) => {
    try {
      const result = await toggleFavorite(session.user.id, id);
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error, {
        action: 'toggle_favorite',
        logContext: { agentId: id, userId: session.user.id },
      });
    }
  });
}
