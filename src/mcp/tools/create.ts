import { prisma } from '../../lib/db/client.js';

interface CreateArgs {
  name: string;
  description: string;
  platform: string;
  category?: string;
  configuration?: object;
  instructions?: object;
  tags?: string[];
  markdownContent?: string;
}

export async function createAgent(args: CreateArgs) {
  const {
    name,
    description,
    platform,
    category,
    configuration,
    instructions,
    tags,
    markdownContent,
  } = args;

  // Validate required fields
  if (!name || name.length < 3 || name.length > 100) {
    throw new Error('Agent name must be between 3 and 100 characters');
  }

  if (!description || description.length < 10 || description.length > 1000) {
    throw new Error('Agent description must be between 10 and 1000 characters');
  }

  // Find platform
  const platformRecord = await prisma.platform.findUnique({
    where: { slug: platform },
  });

  if (!platformRecord) {
    throw new Error(`Platform not found: ${platform}`);
  }

  // Find category if provided
  let categoryRecord = null;
  if (category) {
    categoryRecord = await prisma.category.findUnique({
      where: { slug: category },
    });

    if (!categoryRecord) {
      throw new Error(`Category not found: ${category}`);
    }
  }

  // Generate slug
  const slug = generateSlug(name);

  // For MCP, we'll create agents as a system user
  // In production, you might want to have MCP authenticate and create under specific users
  // For now, we'll need to handle this - either create a system user or require user context

  // This is a simplified implementation - you'll need to add proper user handling
  throw new Error(
    'Agent creation via MCP requires authentication. Please use the web interface or API with proper credentials.'
  );

  // Uncomment and modify when you have proper user authentication in MCP:
  /*
  const agent = await prisma.agent.create({
    data: {
      userId: 'SYSTEM_USER_ID', // Replace with actual user ID from MCP auth
      name,
      slug,
      description,
      categoryId: categoryRecord?.id,
      configuration: configuration || {},
      instructions: instructions || {},
      tags: tags || [],
      markdownContent,
      platforms: {
        create: [
          {
            platformId: platformRecord.id,
            platformConfig: configuration || {},
          },
        ],
      },
    },
    include: {
      category: true,
      platforms: {
        include: {
          platform: true,
        },
      },
    },
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(agent, null, 2),
      },
    ],
  };
  */
}

function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}
