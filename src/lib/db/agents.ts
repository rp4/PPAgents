import { prisma } from './client';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/security/logger';

export interface AgentFilters {
  search?: string;
  tags?: string[];
  statuses?: string[];
  phases?: string[];
  benefits?: string[];
  opsStatuses?: string[];
  category?: string;
  userId?: string;
}

export interface AgentSort {
  field: 'createdAt' | 'favoritesCount' | 'viewsCount';
  order: 'asc' | 'desc';
}

export async function getAgents({
  filters,
  sort = { field: 'createdAt', order: 'desc' },
  limit = 20,
  offset = 0,
}: {
  filters?: AgentFilters;
  sort?: AgentSort;
  limit?: number;
  offset?: number;
}) {
  // Enforce maximum limits to prevent abuse
  const MAX_LIMIT = 100;
  const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
  const safeOffset = Math.max(0, offset);
  const where: Prisma.AgentWhereInput = {
    isPublic: true,
  };

  // Apply filters
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { benefitsDesc: { contains: filters.search, mode: 'insensitive' } },
      { data: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters?.category) {
    where.category = { slug: filters.category };
  }

  if (filters?.statuses && filters.statuses.length > 0) {
    where.status = { slug: { in: filters.statuses } };
  }

  if (filters?.phases && filters.phases.length > 0) {
    where.phase = { slug: { in: filters.phases } };
  }

  if (filters?.benefits && filters.benefits.length > 0) {
    where.benefit = { slug: { in: filters.benefits } };
  }

  if (filters?.opsStatuses && filters.opsStatuses.length > 0) {
    where.opsStatus = { slug: { in: filters.opsStatuses } };
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.tags && filters.tags.length > 0) {
    where.agentTags = {
      some: {
        tag: {
          slug: { in: filters.tags },
        },
      },
    };
  }

  const orderBy: Prisma.AgentOrderByWithRelationInput = {
    [sort.field]: sort.order,
  };

  const [agentsRaw, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy,
      skip: safeOffset,
      take: safeLimit,
      select: {
        id: true,
        userId: true,
        name: true,
        slug: true,
        description: true,
        categoryId: true,
        statusId: true,
        phaseId: true,
        benefitId: true,
        opsStatusId: true,
        instructions: true,
        configuration: true,
        isPublic: true,
        isFeatured: true,
        favoritesCount: true,
        viewsCount: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        benefit: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        opsStatus: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        agentTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
    }),
    prisma.agent.count({ where }),
  ]);

  // Transform agents to match frontend expectations
  const agents = agentsRaw.map(agent => ({
    ...agent,
    profile: agent.user, // Alias user to profile for frontend compatibility
    favorites_count: agent.favoritesCount, // Map to snake_case for frontend
    views_count: agent.viewsCount,
    user_id: agent.userId,
    category_id: agent.categoryId,
    status_id: agent.statusId,
    phase_id: agent.phaseId,
    benefit_id: agent.benefitId,
    ops_status_id: agent.opsStatusId,
    is_public: agent.isPublic,
    is_featured: agent.isFeatured,
    created_at: agent.createdAt,
    updated_at: agent.updatedAt,
    agent_platforms: [], // Placeholder - platforms not yet implemented
  }));

  return { agents, total, hasMore: offset + agents.length < total };
}

export async function getAgentBySlug(slug: string, userId?: string) {
  logger.debug('Fetching agent by slug', { slug, hasUserId: !!userId });

  let agent;
  try {
    agent = await prisma.agent.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
            bio: true,
          },
        },
        category: true,
        status: true,
        phase: true,
        benefit: true,
        opsStatus: true,
        agentTags: {
          include: {
            tag: true,
          },
        },
        favorites: userId ? { where: { userId } } : false,
      },
    });
  } catch (error) {
    logger.error('Error fetching agent by slug', { slug, error });
    throw error;
  }

  if (!agent) {
    logger.debug('Agent not found', { slug });
    return null;
  }

  // Check access permissions
  if (!agent.isPublic && agent.userId !== userId) {
    logger.debug('Access denied to private agent', {
      slug,
      isPublic: agent.isPublic,
      isOwner: agent.userId === userId
    });
    return null;
  }

  logger.debug('Agent access granted', { slug, agentId: agent.id });

  // Transform the response to match frontend expectations
  // The frontend expects 'profile' but Prisma returns 'user'
  return {
    ...agent,
    profile: agent.user, // Alias user to profile for frontend compatibility
    user_id: agent.userId, // Add user_id for frontend compatibility
    user_favorited: agent.favorites && agent.favorites.length > 0, // Check if user has favorited
  };
}

export async function createAgent(data: {
  userId: string;
  name: string;
  description: string;
  categoryId?: string;
  statusId?: string;
  phaseId?: string;
  benefitId?: string;
  opsStatusId?: string;
  tagIds: string[];
  instructions?: object;
  configuration?: object;
  markdownContent?: string;
  data?: string;
  benefitsDesc?: string;
  link?: string;
}) {
  const slug = generateSlug(data.name);
  logger.info('Creating agent', { slug, name: data.name, userId: data.userId });

  const agent = await prisma.agent.create({
    data: {
      userId: data.userId,
      name: data.name,
      slug,
      description: data.description,
      categoryId: data.categoryId,
      statusId: data.statusId,
      phaseId: data.phaseId,
      benefitId: data.benefitId,
      opsStatusId: data.opsStatusId,
      instructions: data.instructions || {},
      configuration: data.configuration || {},
      markdownContent: data.markdownContent,
      data: data.data,
      benefitsDesc: data.benefitsDesc,
      link: data.link,
      agentTags: {
        create: data.tagIds.map((tagId) => ({
          tagId,
        })),
      },
    },
    include: {
      category: true,
      status: true,
      phase: true,
      benefit: true,
      opsStatus: true,
      agentTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  logger.info('Agent created successfully', { agentId: agent.id, slug: agent.slug });

  return agent;
}

export async function updateAgent(
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    description: string;
    categoryId: string;
    statusId: string;
    phaseId: string;
    benefitId: string;
    opsStatusId: string;
    instructions: object;
    configuration: object;
    markdownContent: string;
    data: string;
    benefitsDesc: string;
    link: string;
    isPublic: boolean;
  }>
) {
  // Verify ownership
  const agent = await prisma.agent.findUnique({
    where: { id },
  });

  if (!agent || agent.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return await prisma.agent.update({
    where: { id },
    data,
  });
}

export async function updateAgentTags(
  agentId: string,
  userId: string,
  tagIds: string[]
) {
  // Verify ownership
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent || agent.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Delete existing tags and create new ones
  await prisma.agentTag.deleteMany({
    where: { agentId },
  });

  await prisma.agentTag.createMany({
    data: tagIds.map((tagId) => ({
      agentId,
      tagId,
    })),
  });
}

export async function deleteAgent(id: string, userId: string) {
  // Verify ownership
  const agent = await prisma.agent.findUnique({
    where: { id },
  });

  if (!agent || agent.userId !== userId) {
    throw new Error('Unauthorized');
  }

  await prisma.agent.delete({
    where: { id },
  });
}

export async function incrementAgentViews(id: string) {
  await prisma.agent.update({
    where: { id },
    data: {
      viewsCount: {
        increment: 1,
      },
    },
  });
}

// Helper function to generate slug
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

export async function toggleFavorite(userId: string, agentId: string) {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_agentId: {
        userId,
        agentId,
      },
    },
  });

  if (existing) {
    // Remove favorite
    await prisma.$transaction([
      prisma.favorite.delete({
        where: { id: existing.id },
      }),
      prisma.agent.update({
        where: { id: agentId },
        data: { favoritesCount: { decrement: 1 } },
      }),
    ]);

    return { favorited: false };
  } else {
    // Add favorite
    await prisma.$transaction([
      prisma.favorite.create({
        data: { userId, agentId },
      }),
      prisma.agent.update({
        where: { id: agentId },
        data: { favoritesCount: { increment: 1 } },
      }),
    ]);

    return { favorited: true };
  }
}

