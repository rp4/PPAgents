import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { getAgents, createAgent } from '@/lib/db/agents';
import { z } from 'zod';
import { sanitizeMarkdown, sanitizePlainText, sanitizeURL } from '@/lib/security/sanitize';
import { logger, logUserAction, logError } from '@/lib/security/logger';

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
    logError(error, { action: 'get_agents' });
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      name: z.string().min(3).max(100),
      description: z.string().min(10).max(1000),
      categoryId: z.string().cuid().optional(),
      statusId: z.string().cuid().optional(),
      phaseId: z.string().cuid().optional(),
      benefitId: z.string().cuid().optional(),
      opsStatusId: z.string().cuid().optional(),
      tagIds: z.array(z.string().cuid()).optional().default([]),
      instructions: z.object({}).passthrough().optional(),
      configuration: z.object({}).passthrough().optional(),
      markdownContent: z.string().max(50000).optional(),
      data: z.string().max(100000).optional(),
      benefitsDesc: z.string().max(10000).optional(),
      link: z.string().url().optional().or(z.literal('')),
    });

    const validatedData = schema.parse(body);

    // Sanitize user-generated content to prevent XSS
    const sanitizedLink = validatedData.link ? sanitizeURL(validatedData.link) : undefined;
    const sanitizedData = {
      ...validatedData,
      name: sanitizePlainText(validatedData.name),
      description: sanitizePlainText(validatedData.description),
      markdownContent: validatedData.markdownContent
        ? sanitizeMarkdown(validatedData.markdownContent)
        : undefined,
      data: validatedData.data ? sanitizeMarkdown(validatedData.data) : undefined,
      benefitsDesc: validatedData.benefitsDesc
        ? sanitizeMarkdown(validatedData.benefitsDesc)
        : undefined,
      link: sanitizedLink || undefined,
    };

    const agent = await createAgent({
      userId: session.user.id,
      ...sanitizedData,
    });

    logUserAction(session.user.id, 'create_agent', {
      agentId: agent.id,
      agentSlug: agent.slug,
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logError(error, { action: 'create_agent' });
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
