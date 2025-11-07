'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Types
export interface Agent {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  categoryId?: string;
  instructions: any;
  configuration: any;
  sampleInputs: any[];
  sampleOutputs: any[];
  prerequisites: string[];
  markdownContent?: string;
  markdownFileUrl?: string;
  version: string;
  isPublic: boolean;
  isFeatured: boolean;
  complexityLevel?: string;
  estimatedTokens?: number;
  estimatedCost?: number;
  tags: string[];
  favoritesCount: number;
  downloadsCount: number;
  viewsCount: number;
  avgRating?: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  user?: any;
  category?: any;
  platforms?: any[];
}

export interface AgentFilters {
  search?: string;
  tag?: string;
  status?: string;
  category?: string;
  userId?: string;
  sortBy?: 'createdAt' | 'avgRating' | 'downloadsCount' | 'favoritesCount';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Fetch agents list
export function useAgents(filters?: AgentFilters) {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['agents', filters],
    queryFn: async () => {
      const response = await fetch(`/api/agents?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      return response.json();
    },
  });
}

// Fetch single agent
export function useAgent(slugOrId: string) {
  return useQuery({
    queryKey: ['agents', slugOrId],
    queryFn: async () => {
      const response = await fetch(`/api/agents/${slugOrId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Agent not found');
        }
        throw new Error('Failed to fetch agent');
      }
      return response.json();
    },
    enabled: !!slugOrId,
  });
}

// Create agent
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Agent>) => {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error Response:', error);
        throw new Error(error.error || error.message || 'Failed to create agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Update agent
export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Agent>) => {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', id] });
    },
  });
}

// Delete agent
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Toggle favorite
export function useToggleFavorite(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/agents/${agentId}/favorite`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle favorite');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', agentId] });
    },
  });
}

// Rate agent
export function useRateAgent(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ score, review }: { score: number; review?: string }) => {
      const response = await fetch(`/api/agents/${agentId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score, review }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rate agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', agentId] });
    },
  });
}

// Fetch tags
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      return response.json();
    },
  });
}

// Fetch statuses
export function useStatuses() {
  return useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const response = await fetch('/api/statuses');
      if (!response.ok) {
        throw new Error('Failed to fetch statuses');
      }
      return response.json();
    },
  });
}

// Fetch categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });
}

// Fetch phases
export function usePhases() {
  return useQuery({
    queryKey: ['phases'],
    queryFn: async () => {
      const response = await fetch('/api/phases');
      if (!response.ok) {
        throw new Error('Failed to fetch phases');
      }
      return response.json();
    },
  });
}

// Fetch benefits
export function useBenefits() {
  return useQuery({
    queryKey: ['benefits'],
    queryFn: async () => {
      const response = await fetch('/api/benefits');
      if (!response.ok) {
        throw new Error('Failed to fetch benefits');
      }
      return response.json();
    },
  });
}

// Fetch ops statuses
export function useOpsStatuses() {
  return useQuery({
    queryKey: ['opsStatuses'],
    queryFn: async () => {
      const response = await fetch('/api/ops-statuses');
      if (!response.ok) {
        throw new Error('Failed to fetch ops statuses');
      }
      return response.json();
    },
  });
}
