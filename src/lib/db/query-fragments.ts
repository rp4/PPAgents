/**
 * Prisma Query Fragments
 * Reusable query selects and includes for consistent data fetching
 */

import { Prisma } from '@prisma/client';

/**
 * Standard user profile selection
 * Use for displaying user information in agents, comments, etc.
 */
export const userProfileSelect = Prisma.validator<Prisma.ProfileSelect>()({
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
  isVerified: true,
});

/**
 * Extended user profile with bio and social links
 */
export const userProfileExtendedSelect = Prisma.validator<Prisma.ProfileSelect>()({
  ...userProfileSelect,
  bio: true,
  website: true,
  githubUrl: true,
  linkedinUrl: true,
  reputationScore: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Standard agent relations
 * Use when fetching agent lists or individual agents
 */
export const agentRelations = Prisma.validator<Prisma.AgentInclude>()({
  user: {
    select: userProfileSelect,
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
});

/**
 * Agent selection fields for lists (lighter than full agent)
 */
export const agentListSelect = Prisma.validator<Prisma.AgentSelect>()({
  id: true,
  userId: true,
  name: true,
  slug: true,
  description: true,
  categoryId: true,
  statusId: true,
  phaseId: true,
  benefitId: true,
  opsStatusId: true,
  isPublic: true,
  isFeatured: true,
  favoritesCount: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Comment with user profile
 * Use when fetching comments
 */
export const commentWithUser = Prisma.validator<Prisma.CommentInclude>()({
  user: {
    select: userProfileSelect,
  },
});

/**
 * Comment with replies (recursive)
 */
export const commentWithReplies = Prisma.validator<Prisma.CommentInclude>()({
  user: {
    select: userProfileSelect,
  },
  replies: {
    include: {
      user: {
        select: userProfileSelect,
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
});

