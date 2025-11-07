import { prisma } from '../../lib/db/client.js';

interface GetArgs {
  id?: string;
  slug?: string;
}

export async function getAgent(args: GetArgs) {
  const { id, slug } = args;

  if (!id && !slug) {
    throw new Error('Either id or slug must be provided');
  }

  const agent = await prisma.agent.findUnique({
    where: id ? { id } : { slug },
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
      platforms: {
        include: {
          platform: true,
        },
      },
    },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  if (!agent.isPublic) {
    throw new Error('Agent is private');
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            ...agent,
            platforms: agent.platforms.map((p) => ({
              ...p.platform,
              config: p.platformConfig,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
}
