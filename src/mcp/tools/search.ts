import { prisma } from '../../lib/db/client.js';

interface SearchArgs {
  query?: string;
  tag?: string;
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export async function searchAgents(args: SearchArgs) {
  const { query, tag, status, category, limit = 20, offset = 0 } = args;

  const where: any = {
    isPublic: true,
  };

  // Search query
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Tag filter
  if (tag) {
    where.agentTags = {
      some: {
        tag: {
          slug: tag,
        },
      },
    };
  }

  // Status filter
  if (status) {
    where.status = {
      slug: status,
    };
  }

  // Category filter
  if (category) {
    where.category = {
      slug: category,
    };
  }

  const agents = await prisma.agent.findMany({
    where,
    take: Math.min(limit, 50),
    skip: offset,
    orderBy: [
      { favoritesCount: 'desc' },
      { avgRating: 'desc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      version: true,
      complexityLevel: true,
      favoritesCount: true,
      downloadsCount: true,
      avgRating: true,
      totalRatings: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
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
      agentTags: {
        select: {
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
  });

  const total = await prisma.agent.count({ where });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            agents: agents.map((agent) => ({
              ...agent,
              tags: agent.agentTags.map((at) => at.tag),
            })),
            total,
            limit,
            offset,
            hasMore: offset + agents.length < total,
          },
          null,
          2
        ),
      },
    ],
  };
}
