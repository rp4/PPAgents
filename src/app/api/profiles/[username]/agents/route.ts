import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find the profile first
    const profile = await prisma.profile.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch user's agents
    const agents = await prisma.agent.findMany({
      where: {
        userId: profile.id,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
            avatarUrl: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching user agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
