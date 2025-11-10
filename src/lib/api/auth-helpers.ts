/**
 * Authentication Helpers for API Routes
 * Provides consistent authentication and authorization patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import type { Session } from 'next-auth';

export interface AuthenticatedHandler<T = any> {
  (request: NextRequest, context: T, session: Session): Promise<NextResponse>;
}

/**
 * Requires authentication for API route
 * Returns 401 if not authenticated, otherwise calls handler with session
 */
export async function requireAuth<T = any>(
  request: NextRequest,
  context: T,
  handler: AuthenticatedHandler<T>
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(request, context, session);
}

/**
 * Requires ownership of a resource
 * Returns 403 if user doesn't own the resource
 */
export function requireOwnership(
  userId: string,
  ownerId: string,
  errorMessage = 'You do not have permission to perform this action'
): NextResponse | null {
  if (userId !== ownerId) {
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }
  return null;
}

/**
 * Get session or return null (for optional auth)
 */
export async function getOptionalSession() {
  return await getServerSession(authOptions);
}

/**
 * Get authenticated user ID or throw error
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return session.user.id;
}
