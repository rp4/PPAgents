import { prisma } from '../../lib/db/client.js';

export async function listTags() {
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ tags }, null, 2),
      },
    ],
  };
}

export async function listStatuses() {
  const statuses = await prisma.status.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      orderIndex: true,
    },
    orderBy: {
      orderIndex: 'asc',
    },
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ statuses }, null, 2),
      },
    ],
  };
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
    orderBy: {
      orderIndex: 'asc',
    },
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ categories }, null, 2),
      },
    ],
  };
}
