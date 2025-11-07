// DEPRECATED: Database queries moved to API routes
// This file is a stub for backward compatibility

export type GetAgentsParams = {
  search?: string
  platformId?: string
  categoryId?: string
  limit?: number
  offset?: number
}

export const getAgents = async () => [];
export const getAgent = async () => null;
export const getAgentBySlug = async () => null;
export const getUserAgents = async () => [];
export const getUserFavorites = async () => [];
export const checkUserFavorited = async () => false;
export const getAgentRatings = async () => [];
export const getUserRating = async () => null;
export const getCategories = async () => [];
export const getTags = async () => [];
export const getStatuses = async () => [];
export const getPlatforms = async () => []; // Deprecated, use getTags
export const getPlatformCounts = async () => ({});
