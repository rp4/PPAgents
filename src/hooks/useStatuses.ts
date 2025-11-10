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

