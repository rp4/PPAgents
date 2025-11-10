import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// API client functions
async function getUserFavorites(userId: string, limit = 20, offset = 0) {
  const response = await fetch(`/api/users/${userId}/favorites?limit=${limit}&offset=${offset}`)
  if (!response.ok) throw new Error('Failed to fetch favorites')
  return response.json()
}

async function checkUserFavorited(agentId: string, userId: string) {
  const response = await fetch(`/api/agents/${agentId}/favorite`)
  if (!response.ok) return false
  const data = await response.json()
  return data.favorited
}

async function toggleFavorite(agentId: string, userId: string) {
  const response = await fetch(`/api/agents/${agentId}/favorite`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to toggle favorite')
  return response.json()
}

async function addFavorite(agentId: string, userId: string) {
  return toggleFavorite(agentId, userId)
}

async function removeFavorite(agentId: string, userId: string) {
  return toggleFavorite(agentId, userId)
}

// ============================================
// QUERY HOOKS
// ============================================

export function useUserFavorites(userId: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['favorites', userId, limit, offset],
    queryFn: () => getUserFavorites(userId, limit, offset),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAgentFavoriteStatus(agentId: string, userId?: string) {
  return useQuery({
    queryKey: ['favorite-status', agentId, userId],
    queryFn: () => {
      if (!userId) return false
      return checkUserFavorited(agentId, userId)
    },
    enabled: !!agentId,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agentId, userId }: { agentId: string; userId: string }) =>
      toggleFavorite(agentId, userId),
    onMutate: async ({ agentId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorite-status', agentId, userId] })
      await queryClient.cancelQueries({ queryKey: ['agent', agentId] })

      // Snapshot previous value
      const previousStatus = queryClient.getQueryData<boolean>(['favorite-status', agentId, userId])

      // Optimistically update
      queryClient.setQueryData<boolean>(['favorite-status', agentId, userId], (old) => !old)

      return { previousStatus }
    },
    onError: (err, { agentId, userId }, context) => {
      // Rollback on error
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(['favorite-status', agentId, userId], context.previousStatus)
      }
    },
    onSuccess: (data, { agentId, userId }) => {
      // Update queries
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
      queryClient.setQueryData(['favorite-status', agentId, userId], data.favorited)
    },
  })
}

export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agentId, userId }: { agentId: string; userId: string }) =>
      addFavorite(agentId, userId),
    onSuccess: (_, { agentId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['favorite-status', agentId, userId] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
    },
  })
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agentId, userId }: { agentId: string; userId: string }) =>
      removeFavorite(agentId, userId),
    onSuccess: (_, { agentId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['favorite-status', agentId, userId] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
    },
  })
}
