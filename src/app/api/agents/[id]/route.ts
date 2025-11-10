import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { getAgentBySlug, updateAgent, deleteAgent } from '@/lib/db/agents';
import { z } from 'zod';
import { sanitizeMarkdown, sanitizePlainText } from '@/lib/security/sanitize';
import { logUserAction, logError } from '@/lib/security/logger';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/agents/[id] - Get agent by slug
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const agent = await getAgentBySlug(id, session?.user?.id);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    logError(error, { action: 'get_agent', agentId: (await params).id });
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
      categoryId: z.string().cuid().optional(),
      statusId: z.string().cuid().optional(),
      phaseId: z.string().cuid().optional(),
      benefitId: z.string().cuid().optional(),
      opsStatusId: z.string().cuid().optional(),
      tagIds: z.array(z.string().cuid()).optional(),
      instructions: z.object({}).passthrough().optional(),
      configuration: z.object({}).passthrough().optional(),
      markdownContent: z.string().max(50000).optional(),
      data: z.string().max(100000).optional(),
      benefitsDesc: z.string().max(10000).optional(),
      isPublic: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    // Sanitize user-generated content
    const sanitizedData = {
      ...validatedData,
      name: validatedData.name ? sanitizePlainText(validatedData.name) : undefined,
      description: validatedData.description
        ? sanitizePlainText(validatedData.description)
        : undefined,
      markdownContent: validatedData.markdownContent
        ? sanitizeMarkdown(validatedData.markdownContent)
        : undefined,
      data: validatedData.data ? sanitizeMarkdown(validatedData.data) : undefined,
      benefitsDesc: validatedData.benefitsDesc
        ? sanitizeMarkdown(validatedData.benefitsDesc)
        : undefined,
    };

    const agent = await updateAgent(id, session.user.id, sanitizedData);

    logUserAction(session.user.id, 'update_agent', { agentId: id });

    return NextResponse.json(agent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logError(error, { action: 'update_agent', agentId: (await params).id });
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

    logUserAction(session.user.id, 'delete_agent', { agentId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logError(error, { action: 'delete_agent', agentId: (await params).id });
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
