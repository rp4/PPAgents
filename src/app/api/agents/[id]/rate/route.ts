import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { rateAgent } from '@/lib/db/agents';
import { z } from 'zod';

interface RouteContext {
  params: {
    id: string;
  };
}

// POST /api/agents/[id]/rate - Rate an agent
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const schema = z.object({
      score: z.number().int().min(1).max(5),
      review: z.string().max(1000).optional(),
    });

    const { score, review } = schema.parse(body);

    const rating = await rateAgent(session.user.id, params.id, score, review);

    return NextResponse.json(rating);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error rating agent:', error);
    return NextResponse.json({ error: 'Failed to rate agent' }, { status: 500 });
  }
}
