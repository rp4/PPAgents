/**
 * Data Transformation Utilities
 * Converts Prisma models to API response format
 */

import type { Comment, User, Profile, Agent } from '@prisma/client';

type CommentWithUser = Comment & {
  user: Pick<Profile, 'id' | 'username' | 'fullName' | 'avatarUrl'>;
  replies?: CommentWithUser[];
};

type ProfileData = Pick<Profile, 'id' | 'username' | 'fullName' | 'avatarUrl' | 'bio' | 'website' | 'githubUrl' | 'linkedinUrl' | 'reputationScore' | 'isVerified' | 'createdAt' | 'updatedAt'>;

/**
 * Transform Prisma comment to API format
 */
export function transformComment(comment: CommentWithUser): any {
  return {
    id: comment.id,
    content: comment.content,
    created_at: comment.createdAt.toISOString(),
    updated_at: comment.updatedAt.toISOString(),
    is_edited: comment.isEdited,
    profile: {
      id: comment.user.id,
      username: comment.user.username,
      full_name: comment.user.fullName,
      avatar_url: comment.user.avatarUrl,
    },
    replies: comment.replies?.map(transformComment) || [],
  };
}

/**
 * Transform Prisma agent to API format
 */
export function transformAgent(agent: any) {
  return {
    ...agent,
    profile: agent.user,
    favorites_count: agent.favoritesCount,
    views_count: agent.viewsCount,
    user_id: agent.userId,
    category_id: agent.categoryId,
    status_id: agent.statusId,
    phase_id: agent.phaseId,
    benefit_id: agent.benefitId,
    ops_status_id: agent.opsStatusId,
    is_public: agent.isPublic,
    is_featured: agent.isFeatured,
    created_at: agent.createdAt,
    updated_at: agent.updatedAt,
    agent_platforms: agent.agent_platforms || [],
  };
}

/**
 * Transform profile to API format
 */
export function transformProfile(profile: Partial<ProfileData>) {
  return {
    id: profile.id,
    username: profile.username,
    full_name: profile.fullName,
    bio: profile.bio,
    avatar_url: profile.avatarUrl,
    website: profile.website,
    github_url: profile.githubUrl,
    linkedin_url: profile.linkedinUrl,
    reputation_score: profile.reputationScore,
    is_verified: profile.isVerified,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

/**
 * Transform user for agent/comment display
 */
export function transformUserProfile(user: Pick<Profile, 'id' | 'username' | 'fullName' | 'avatarUrl'>) {
  return {
    id: user.id,
    username: user.username,
    full_name: user.fullName,
    avatar_url: user.avatarUrl,
  };
}
