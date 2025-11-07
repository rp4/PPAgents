import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

// GET /api/benefits - Get all benefits
export async function GET() {
  try {
    const benefits = await prisma.benefit.findMany({
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

    return NextResponse.json({ benefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return NextResponse.json({ error: 'Failed to fetch benefits' }, { status: 500 });
  }
}
