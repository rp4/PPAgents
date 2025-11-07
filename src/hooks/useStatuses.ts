import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Status {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  agentCount?: number
}

export interface StatusesResponse {
  statuses: Status[]
  total: number
}

// Fetch all statuses
export function useStatuses() {
  return useQuery<StatusesResponse>({
    queryKey: ['statuses'],
    queryFn: async () => {
      const response = await fetch('/api/statuses')
      if (!response.ok) {
        throw new Error('Failed to fetch statuses')
      }
      return response.json()
    },
  })
}

// Fetch a single status by ID or slug
export function useStatus(idOrSlug: string) {
  return useQuery<Status>({
    queryKey: ['status', idOrSlug],
    queryFn: async () => {
      const response = await fetch(`/api/statuses/${idOrSlug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      return response.json()
    },
    enabled: !!idOrSlug,
  })
}

// Create a new status
export function useCreateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      const response = await fetch('/api/statuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create status')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] })
    },
  })
}

// Update a status
export function useUpdateStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Status> }) => {
      const response = await fetch(`/api/statuses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] })
      queryClient.invalidateQueries({ queryKey: ['status', id] })
    },
  })
}

// Delete a status
export function useDeleteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/statuses/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete status')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] })
    },
  })
}
