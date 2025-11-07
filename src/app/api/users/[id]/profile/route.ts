import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/users/[id]/profile - Get user profile
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        githubUrl: true,
        linkedinUrl: true,
        reputationScore: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH /api/users/[id]/profile - Update user profile
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only update their own profile
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const schema = z.object({
      username: z.string().min(3).max(30).optional(),
      fullName: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      website: z.string().url().optional().or(z.literal('')),
      githubUrl: z.string().url().optional().or(z.literal('')),
      linkedinUrl: z.string().url().optional().or(z.literal('')),
      avatarUrl: z.string().url().optional().or(z.literal('')),
    });

    const validatedData = schema.parse(body);

    // Check username uniqueness if updating username
    if (validatedData.username) {
      const existing = await prisma.profile.findUnique({
        where: { username: validatedData.username },
      });

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    const profile = await prisma.profile.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        website: true,
        githubUrl: true,
        linkedinUrl: true,
        reputationScore: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
