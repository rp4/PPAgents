import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const profile = await prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedProfile = {
      id: profile.id,
      username: profile.username,
      full_name: profile.fullName,
      bio: profile.bio,
      avatar_url: profile.avatarUrl || profile.user.image,
      website: profile.website,
      github_url: profile.githubUrl,
      linkedin_url: profile.linkedinUrl,
      reputation_score: profile.reputationScore,
      is_verified: profile.isVerified,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    };

    return NextResponse.json(formattedProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
