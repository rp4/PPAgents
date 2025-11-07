import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { getAgentBySlug, updateAgent, deleteAgent } from '@/lib/db/agents';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/agents/[id] - Get agent by slug
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    console.log('=== [API] GET /api/agents/[id] START ===');
    console.log('[API] GET /api/agents/[id] - Slug/ID:', id);
    console.log('[API] GET /api/agents/[id] - Request URL:', request.url);

    const session = await getServerSession(authOptions);
    console.log('[API] Session exists:', !!session);
    console.log('[API] Session user ID:', session?.user?.id);
    console.log('[API] Session user email:', session?.user?.email);

    console.log('[API] Calling getAgentBySlug...');
    const agent = await getAgentBySlug(id, session?.user?.id);
    console.log('[API] getAgentBySlug returned:', agent ? `Agent object (id: ${agent.id}, slug: ${agent.slug}, name: ${agent.name})` : 'null');

    if (!agent) {
      console.log('[API] ⚠️ RETURNING 404 - Agent not found or access denied');
      console.log('=== [API] GET /api/agents/[id] END (404) ===');
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    console.log('[API] ✅ RETURNING 200 - Agent found successfully');
    console.log('=== [API] GET /api/agents/[id] END (200) ===');
    return NextResponse.json(agent);
  } catch (error) {
    console.error('[API] ❌ ERROR in GET /api/agents/[id]:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.log('=== [API] GET /api/agents/[id] END (500) ===');
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

// PATCH /api/agents/[id] - Update agent
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      name: z.string().min(3).max(100).optional(),
      description: z.string().min(10).max(1000).optional(),
      categoryId: z.string().uuid().optional(),
      statusId: z.string().uuid().optional(),
      tagIds: z.array(z.string().uuid()).optional(),
      instructions: z.object({}).passthrough().optional(),
      configuration: z.object({}).passthrough().optional(),
      markdownContent: z.string().optional(),
      isPublic: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    const agent = await updateAgent(id, session.user.id, validatedData);

    return NextResponse.json(agent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteAgent(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
