import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);

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

    // Only allow users to see their own favorites
    if (!session?.user?.id || session.user.id !== profile.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch user's favorite agents
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: profile.id,
      },
      include: {
        agent: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Extract just the agents
    const agents = favorites.map((fav) => fav.agent);

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
