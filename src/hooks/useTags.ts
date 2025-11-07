import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  agentCount?: number
}

export interface TagsResponse {
  tags: Tag[]
  total: number
}

// Fetch all tags
export function useTags() {
  return useQuery<TagsResponse>({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags')
      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }
      return response.json()
    },
  })
}

// Fetch a single tag by ID or slug
export function useTag(idOrSlug: string) {
  return useQuery<Tag>({
    queryKey: ['tag', idOrSlug],
    queryFn: async () => {
      const response = await fetch(`/api/tags/${idOrSlug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tag')
      }
      return response.json()
    },
    enabled: !!idOrSlug,
  })
}

// Create a new tag
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tag')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

// Update a tag
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tag> }) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tag')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['tag', id] })
    },
  })
}

// Delete a tag
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tag')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
