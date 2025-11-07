import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

// GET /api/ops-statuses - Get all ops statuses
export async function GET() {
  try {
    const opsStatuses = await prisma.opsStatus.findMany({
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

    return NextResponse.json({ opsStatuses });
  } catch (error) {
    console.error('Error fetching ops statuses:', error);
    return NextResponse.json({ error: 'Failed to fetch ops statuses' }, { status: 500 });
  }
}
