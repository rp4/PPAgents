import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

// GET /api/phases - Get all phases
export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
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

    return NextResponse.json({ phases });
  } catch (error) {
    console.error('Error fetching phases:', error);
    return NextResponse.json({ error: 'Failed to fetch phases' }, { status: 500 });
  }
}
