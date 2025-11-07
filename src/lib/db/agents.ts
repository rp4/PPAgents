import { prisma } from './client';
import { Prisma } from '@prisma/client';

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
  field: 'createdAt' | 'avgRating' | 'downloadsCount' | 'favoritesCount';
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
  const where: Prisma.AgentWhereInput = {
    isPublic: true,
  };

  // Apply filters
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
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
      skip: offset,
      take: limit,
      include: {
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
  }));

  return { agents, total, hasMore: offset + agents.length < total };
}

export async function getAgentBySlug(slug: string, userId?: string) {
  console.log('[DB] getAgentBySlug - Looking for slug:', slug);
  console.log('[DB] getAgentBySlug - User ID:', userId);

  const agent = await prisma.agent.findUnique({
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
      ratings: userId ? { where: { userId } } : false,
    },
  });

  console.log('[DB] getAgentBySlug - Agent found in DB:', agent ? `Yes (ID: ${agent.id}, slug: ${agent.slug})` : 'No');

  if (agent) {
    console.log('[DB] getAgentBySlug - Agent.isPublic:', agent.isPublic);
    console.log('[DB] getAgentBySlug - Agent.userId:', agent.userId);
    console.log('[DB] getAgentBySlug - Requesting userId:', userId);
    console.log('[DB] getAgentBySlug - Is owner?:', agent.userId === userId);
  }

  if (!agent) {
    console.log('[DB] getAgentBySlug - Returning null: Agent not found in DB');
    return null;
  }

  // Check access permissions
  if (!agent.isPublic && agent.userId !== userId) {
    console.log('[DB] getAgentBySlug - Returning null: Agent is not public and user is not the owner');
    console.log('[DB] getAgentBySlug - Access denied because: isPublic =', agent.isPublic, ', userId mismatch =', agent.userId !== userId);
    return null;
  }

  console.log('[DB] getAgentBySlug - Access granted, returning agent');

  // Transform the response to match frontend expectations
  // The frontend expects 'profile' but Prisma returns 'user'
  return {
    ...agent,
    profile: agent.user, // Alias user to profile for frontend compatibility
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
  console.log('[DB] createAgent - Generated slug:', slug);
  console.log('[DB] createAgent - Agent name:', data.name);
  console.log('[DB] createAgent - User ID:', data.userId);

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

  console.log('[DB] createAgent - Agent created successfully in DB');
  console.log('[DB] createAgent - Agent ID:', agent.id);
  console.log('[DB] createAgent - Agent slug:', agent.slug);
  console.log('[DB] createAgent - Agent isPublic:', agent.isPublic);

  // Verify the agent was created and can be retrieved
  const verification = await prisma.agent.findUnique({
    where: { slug: agent.slug },
  });
  console.log('[DB] createAgent - Verification query result:', verification ? `Found (slug: ${verification.slug})` : 'NOT FOUND!');

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
    await prisma.favorite.delete({
      where: { id: existing.id },
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: { favoritesCount: { decrement: 1 } },
    });

    return { favorited: false };
  } else {
    // Add favorite
    await prisma.favorite.create({
      data: { userId, agentId },
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: { favoritesCount: { increment: 1 } },
    });

    return { favorited: true };
  }
}

export async function rateAgent(
  userId: string,
  agentId: string,
  score: number,
  review?: string
) {
  const rating = await prisma.rating.upsert({
    where: {
      userId_agentId: {
        userId,
        agentId,
      },
    },
    update: {
      score,
      review,
    },
    create: {
      userId,
      agentId,
      score,
      review,
    },
  });

  // Update agent average rating
  const ratings = await prisma.rating.findMany({
    where: { agentId },
    select: { score: true },
  });

  const avgRating = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      avgRating,
      totalRatings: ratings.length,
    },
  });

  return rating;
}
