import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// API client functions
async function getAgentComments(agentId: string) {
  const response = await fetch(`/api/agents/${agentId}/comments`)
  if (!response.ok) throw new Error('Failed to fetch comments')
  return response.json()
}

async function createComment(comment: { agentId: string; content: string; parentId?: string }) {
  const response = await fetch(`/api/agents/${comment.agentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: comment.content, parentId: comment.parentId }),
  })
  if (!response.ok) throw new Error('Failed to create comment')
  return response.json()
}

async function updateComment(commentId: string, content: string, userId: string) {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) throw new Error('Failed to update comment')
  return response.json()
}

async function deleteComment(commentId: string, userId: string) {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete comment')
  return response.json()
}

// ============================================
// QUERY HOOKS
// ============================================

export function useAgentComments(agentId: string) {
  return useQuery({
    queryKey: ['comments', agentId],
    queryFn: () => getAgentComments(agentId),
    enabled: !!agentId,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (comment: { agentId: string; content: string; parentId?: string }) => createComment(comment),
    onSuccess: (data: any) => {
      // Invalidate comments for this agent
      queryClient.invalidateQueries({ queryKey: ['comments', data.agentId] })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      content,
      userId,
      agentId,
    }: {
      commentId: string
      content: string
      userId: string
      agentId: string
    }) => updateComment(commentId, content, userId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.agentId] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      userId,
      agentId,
    }: {
      commentId: string
      userId: string
      agentId: string
    }) => deleteComment(commentId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.agentId] })
    },
  })
}
