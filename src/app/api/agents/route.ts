import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { getAgents, createAgent } from '@/lib/db/agents';
import { z } from 'zod';

// GET /api/agents - List agents with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      statuses: searchParams.get('statuses')?.split(',').filter(Boolean) || undefined,
      phases: searchParams.get('phases')?.split(',').filter(Boolean) || undefined,
      benefits: searchParams.get('benefits')?.split(',').filter(Boolean) || undefined,
      opsStatuses: searchParams.get('opsStatuses')?.split(',').filter(Boolean) || undefined,
      category: searchParams.get('category') || undefined,
      userId: searchParams.get('userId') || undefined,
    };

    const sort = {
      field: (searchParams.get('sortBy') as any) || 'createdAt',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    };

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getAgents({ filters, sort, limit, offset });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    console.log('=== [API] POST /api/agents START ===');
    const session = await getServerSession(authOptions);
    console.log('[API] Session user ID:', session?.user?.id);
    console.log('[API] Session user email:', session?.user?.email);

    if (!session?.user?.id) {
      console.log('[API] ⚠️ RETURNING 401 - No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[API] Request body:', JSON.stringify(body, null, 2));

    // Validate input
    const schema = z.object({
      name: z.string().min(3).max(100),
      description: z.string().min(10).max(1000),
      categoryId: z.string().uuid().optional(),
      statusId: z.string().optional(),
      phaseId: z.string().optional(),
      benefitId: z.string().optional(),
      opsStatusId: z.string().optional(),
      tagIds: z.array(z.string().uuid()).optional().default([]),
      instructions: z.object({}).passthrough().optional(),
      configuration: z.object({}).passthrough().optional(),
      markdownContent: z.string().optional(),
      data: z.string().optional(),
      benefitsDesc: z.string().optional(),
      link: z.string().url().optional().or(z.literal('')),
    });

    console.log('[API] Validating request body...');
    const validatedData = schema.parse(body);
    console.log('[API] Validation successful');

    console.log('[API] Calling createAgent...');
    const agent = await createAgent({
      userId: session.user.id,
      ...validatedData,
    });
    console.log('[API] ✅ Agent created successfully');
    console.log('[API] Created agent ID:', agent.id);
    console.log('[API] Created agent slug:', agent.slug);
    console.log('[API] Created agent isPublic:', agent.isPublic);

    console.log('=== [API] POST /api/agents END (201) ===');
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[API] ❌ Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[API] ❌ Error creating agent:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('=== [API] POST /api/agents END (500) ===');
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
