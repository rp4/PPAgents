// DEPRECATED: Database mutations moved to API routes
// This file is a stub for backward compatibility

export const createAgent = async () => {
  throw new Error('Use API route: POST /api/agents');
};

export const updateAgent = async () => {
  throw new Error('Use API route: PATCH /api/agents/[id]');
};

export const deleteAgent = async () => {
  throw new Error('Use API route: DELETE /api/agents/[id]');
};

export const incrementViews = async () => {
  throw new Error('Use API route: POST /api/agents/[id]/views');
};

export const trackDownload = async () => {
  throw new Error('Use API route: POST /api/agents/[id]/download');
};

export const createReport = async () => {
  throw new Error('Use API route: POST /api/agents/[id]/report');
};

export const toggleFavorite = async () => {
  throw new Error('Use API route: POST /api/agents/[id]/favorite');
};

export const addFavorite = async () => {
  throw new Error('Use API route: POST /api/agents/[id]/favorite');
};

export const removeFavorite = async () => {
  throw new Error('Use API route: DELETE /api/agents/[id]/favorite');
};

export const createOrUpdateRating = async () => {
  throw new Error('Use API route: POST /api/agents/[id]/rate');
};

export const deleteRating = async () => {
  throw new Error('Use API route: DELETE /api/agents/[id]/rate');
};
