import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '@/lib/api/client';

// ============================================
// QUERY HOOKS
// ============================================

export interface GetAgentsParams {
  search?: string;
  tags?: string;
  statuses?: string;
  phases?: string;
  benefits?: string;
  opsStatuses?: string;
  category?: string;
  userId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function useAgents(params: GetAgentsParams = {}) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: async () => {
      const searchParams: Record<string, string> = {};

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams[key] = String(value);
        }
      });

      return api.agents.list(searchParams);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAgent(slug: string, userId?: string) {
  return useQuery({
    queryKey: ['agent', slug, userId],
    queryFn: async () => {
      return api.agents.get(slug);
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return api.agents.create(data);
    },
    onSuccess: (data) => {
      // Invalidate agents list
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, updates }: { agentId: string; updates: any }) => {
      return api.agents.update(agentId, updates);
    },
    onSuccess: (data: any) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['user-agents', data.userId] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      return api.agents.delete(agentId);
    },
    onSuccess: () => {
      // Invalidate agents list
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useFavoriteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      return api.agents.favorite(agentId);
    },
    onSuccess: (_data, agentId) => {
      // Invalidate agent detail to refresh favorite status
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
  });
}

export function useRateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      score,
      review,
    }: {
      agentId: string;
      score: number;
      review?: string;
    }) => {
      return api.agents.rate(agentId, { score, review });
    },
    onSuccess: (_data, { agentId }) => {
      // Invalidate agent detail to refresh rating
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
  });
}

export function useIncrementViews() {
  return useMutation({
    mutationFn: async (agentId: string) => {
      // Note: This would need a dedicated API endpoint if we want to track views
      // For now, we'll skip this or create the endpoint
      return { success: true };
    },
    // Don't need to update cache for views
  });
}
