'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

// Create agent
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentData: any) => {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create agent');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
