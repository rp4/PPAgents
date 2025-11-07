import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
      console.log('[useAgents] Fetching agents with params:', params);
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/agents?${searchParams.toString()}`);
      console.log('[useAgents] API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[useAgents] API error:', error);
        throw new Error(error.error || 'Failed to fetch agents');
      }

      const data = await response.json();
      console.log('[useAgents] Agents received:', data.agents?.length || 0);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAgent(slug: string, userId?: string) {
  return useQuery({
    queryKey: ['agent', slug, userId],
    queryFn: async () => {
      console.log('[useAgent] Fetching agent with slug:', slug);
      console.log('[useAgent] User ID:', userId);

      const response = await fetch(`/api/agents/${slug}`);
      console.log('[useAgent] API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[useAgent] API error:', error);
        throw new Error(error.error || 'Failed to fetch agent');
      }

      const data = await response.json();
      console.log('[useAgent] Agent data received:', data ? `${data.name} (${data.slug})` : 'null');
      return data;
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}

export function useUserAgents(userId: string, limit = 20) {
  return useQuery({
    queryKey: ['user-agents', userId, limit],
    queryFn: async () => {
      console.log('[useUserAgents] Fetching agents for user:', userId);
      const response = await fetch(`/api/agents?userId=${userId}&limit=${limit}`);
      console.log('[useUserAgents] API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[useUserAgents] API error:', error);
        throw new Error(error.error || 'Failed to fetch user agents');
      }

      const data = await response.json();
      console.log('[useUserAgents] User agents received:', data.agents?.length || 0);
      return data.agents || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      console.log('[useCreateAgent] Creating agent with data:', data);
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('[useCreateAgent] API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[useCreateAgent] API error:', error);
        throw new Error(error.error || 'Failed to create agent');
      }

      const agent = await response.json();
      console.log('[useCreateAgent] Agent created:', agent.slug);
      return agent;
    },
    onSuccess: (data) => {
      console.log('[useCreateAgent] onSuccess - Invalidating queries');
      // Invalidate agents list
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ agentId, updates }: { agentId: string; updates: any }) => {
      console.log('[useUpdateAgent] Updating agent:', agentId);
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      console.log('[useUpdateAgent] API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[useUpdateAgent] API error:', error);
        throw new Error(error.error || 'Failed to update agent');
      }

      const agent = await response.json();
      console.log('[useUpdateAgent] Agent updated:', agent.slug);
      return agent;
    },
    onSuccess: (data: any) => {
      console.log('[useUpdateAgent] onSuccess - Invalidating queries');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agent', data.slug] })
      queryClient.invalidateQueries({ queryKey: ['user-agents', data.userId] })
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (agentId: string) => {
      console.log('[useDeleteAgent] Deleting agent:', agentId);
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      console.log('[useDeleteAgent] API response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[useDeleteAgent] API error:', error);
        throw new Error(error.error || 'Failed to delete agent');
      }

      const result = await response.json();
      console.log('[useDeleteAgent] Agent deleted successfully');
      return result;
    },
    onSuccess: () => {
      console.log('[useDeleteAgent] onSuccess - Invalidating queries');
      // Invalidate agents list
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useIncrementViews() {
  return useMutation({
    mutationFn: async (agentId: string) => {
      console.log('[useIncrementViews] Incrementing views for agent:', agentId);
      // Note: This would need a dedicated API endpoint if we want to track views
      // For now, we'll skip this or create the endpoint
      return { success: true };
    },
    // Don't need to update cache for views
  })
}
