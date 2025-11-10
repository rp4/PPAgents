'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Share2, ExternalLink, Edit, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load heavy components for better performance
const CommentSection = dynamic(
  () => import('@/components/agents/CommentSection').then(mod => ({ default: mod.CommentSection })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-32 bg-muted rounded"></div>
  }
)

const ShareDialog = dynamic(
  () => import('@/components/agents/ShareDialog').then(mod => ({ default: mod.ShareDialog })),
  { ssr: false }
)

const DeleteAgentDialog = dynamic(
  () => import('@/components/agents/DeleteAgentDialog').then(mod => ({ default: mod.DeleteAgentDialog })),
  { ssr: false }
)

import { useAgent } from '@/hooks/useAgents'
import { useIncrementViews } from '@/hooks/useAgents'
import { FavoriteButton } from '@/components/agents/FavoriteButton'
import { useSession, signIn } from 'next-auth/react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

// Helper function to convert color names to hex with opacity
const getColorStyles = (colorName: string) => {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    red: '#ef4444',
    yellow: '#eab308',
    gray: '#6b7280',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
  }

  const hexColor = colorMap[colorName.toLowerCase()] || '#6b7280'

  return {
    backgroundColor: hexColor + '20', // 20 = ~12% opacity in hex
    color: hexColor
  }
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: slug } = use(params)
  console.log('=== AgentDetailPage rendered ===')
  console.log('Slug from params:', slug)

  const router = useRouter()
  const { data: session, status } = useSession()
  const user = session?.user
  console.log('Session status:', status)
  console.log('User ID:', user?.id)

  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Fetch agent data
  const { data: agent, isLoading, error } = useAgent(slug, user?.id)
  console.log('Agent query state:', { isLoading, hasError: !!error, hasAgent: !!agent })
  if (agent) {
    console.log('Agent loaded:', {
      id: agent.id,
      slug: agent.slug,
      name: agent.name,
      updatedAt: agent.updatedAt,
      updated_at: (agent as any).updated_at,
      createdAt: agent.createdAt,
      created_at: (agent as any).created_at
    })
  }
  if (error) {
    console.error('Agent query error:', error)
  }
  const { mutate: incrementViews } = useIncrementViews()

  // Track view on mount
  useEffect(() => {
    if (agent?.id) {
      incrementViews(agent.id)
    }
  }, [agent?.id, incrementViews])

  // Handle share dialog
  const handleShare = () => {
    setShareDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/browse">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Platforms */}
            {agent.agent_platforms && agent.agent_platforms.length > 0 && (
              <>
                {agent.agent_platforms.map((ap: any) => (
                  <span
                    key={ap.platform_id}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium"
                  >
                    {ap.platform?.name || 'Unknown Platform'}
                  </span>
                ))}
              </>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-3">{agent.name}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {agent.description}
          </p>
        </div>

        {/* Tags */}
        {agent.agentTags && agent.agentTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {agent.agentTags.map((agentTag: any) => (
              <span
                key={agentTag.tag.id}
                className="text-xs bg-muted px-3 py-1.5 rounded-full hover:bg-muted/80 transition-colors"
                style={agentTag.tag.color ? { backgroundColor: agentTag.tag.color + '20', color: agentTag.tag.color } : undefined}
              >
                #{agentTag.tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex flex-wrap items-center gap-4 pb-6 border-b">
          {/* Author */}
          <Link
            href={`/profile/${agent.profile.username}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {agent.profile.avatar_url ? (
              <Image
                src={agent.profile.avatar_url}
                alt={agent.profile.full_name || agent.profile.username}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs">
                {agent.profile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium hover:underline">
              {agent.profile.full_name || agent.profile.username}
            </span>
          </Link>

          <span className="text-sm text-muted-foreground">
            Updated {agent.updatedAt ? new Date(agent.updatedAt).toLocaleDateString() : 'Recently'}
          </span>

          {/* Action Buttons */}
          <div className="ml-auto flex flex-wrap gap-3">
            {/* Edit and Delete buttons - only show to owner */}
            {user && agent.user_id === user.id && (
              <>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => router.push(`/agents/${slug}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:border-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" size="default" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <FavoriteButton
              agentId={agent.id}
              userId={user?.id}
              initialFavorited={agent.user_favorited}
              favoritesCount={agent.favorites_count}
            />
          </div>
        </div>

        {/* Metadata Badges */}
        {(agent.status || agent.phase || agent.benefit || agent.opsStatus) && (
          <div className="flex flex-wrap gap-3 pt-6">
            {agent.status && (
              <span
                className="text-sm px-5 py-2.5 rounded-full font-medium"
                style={getColorStyles(agent.status.color || 'gray')}
              >
                {agent.status.name}
              </span>
            )}
            {agent.phase && (
              <span
                className="text-sm px-5 py-2.5 rounded-full font-medium"
                style={getColorStyles(agent.phase.color || 'gray')}
              >
                {agent.phase.name}
              </span>
            )}
            {agent.benefit && (
              <span
                className="text-sm px-5 py-2.5 rounded-full font-medium"
                style={getColorStyles(agent.benefit.color || 'gray')}
              >
                {agent.benefit.name}
              </span>
            )}
            {agent.opsStatus && (
              <span
                className="text-sm px-5 py-2.5 rounded-full font-medium"
                style={getColorStyles(agent.opsStatus.color || 'gray')}
              >
                {agent.opsStatus.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {/* Agent Information */}
              <div>
                {(agent.data || agent.benefitsDesc || agent.link) ? (
                  <div className="space-y-6">
                    {agent.benefitsDesc && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{agent.benefitsDesc}</p>
                      </div>
                    )}
                    {agent.data && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{agent.data}</p>
                      </div>
                    )}
                    {agent.link && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">External Link</h3>
                        <a href={agent.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                          {agent.link}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No documentation available for this agent.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardContent className="pt-6">
              <CommentSection
                agentId={agent.id}
                userId={user?.id}
              />
            </CardContent>
          </Card>
      </div>

      {/* Share Dialog */}
      {agent && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          agent={agent}
        />
      )}

      {/* Delete Dialog */}
      {agent && (
        <DeleteAgentDialog
          agentId={agent.id}
          agentName={agent.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      )}
    </div>
  )
}
