import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import { prisma } from '@/lib/db/client';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
  });

  return profile;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
