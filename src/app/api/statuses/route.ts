import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

// GET /api/statuses - Get all statuses
export async function GET() {
  try {
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

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 });
  }
}
