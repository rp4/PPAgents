'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { api } from '@/lib/api/client'

interface CommentSectionProps {
  agentId: string
  userId?: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  is_edited: boolean
  profile: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}

export function CommentSection({
  agentId,
  userId,
}: CommentSectionProps) {
  const router = useRouter()
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await api.comments.list(agentId)
        setComments(data)
      } catch (error: any) {
        console.error('Error fetching comments:', error)
      } finally {
        setCommentsLoading(false)
      }
    }

    fetchComments()
  }, [agentId])

  const handleSubmit = async () => {
    if (!userId) {
      router.push('/auth/signin')
      return
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setIsSubmitting(true)

    try {
      const newComment = await api.comments.create(agentId, {
        content: commentText.trim(),
      })
      setComments([newComment, ...comments])
      toast.success('Comment submitted successfully!')
      setCommentText('')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <h3 className="text-xl font-semibold">Comments</h3>

      {/* Comment Form */}
      {userId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add a Comment</CardTitle>
            <CardDescription>
              Share your thoughts or questions about this agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Comment Text */}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              className="w-full min-h-[120px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={2000}
              aria-label="Comment text"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {commentText.length}/2000 characters
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!commentText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  'Submit Comment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p className="mb-4">Sign in to leave a comment</p>
              <Button onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          <MessageSquare className="h-5 w-5 inline mr-2" aria-hidden="true" />
          All Comments ({comments.length})
        </h3>
        {commentsLoading ? (
          <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
            <span className="inline-block animate-spin mr-2">⏳</span>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                <p className="font-medium mb-1">No comments yet</p>
                <p>Be the first to share your thoughts on this agent!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.profile.avatar_url ? (
                      <Image
                        src={comment.profile.avatar_url}
                        alt={comment.profile.full_name || comment.profile.username}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                        {comment.profile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">
                          {comment.profile.full_name || comment.profile.username}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    {comment.content && (
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
