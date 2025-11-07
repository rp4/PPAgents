'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Download, Share2, Flag, ExternalLink, Edit, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Lazy load heavy components for better performance
const DocumentViewer = dynamic(
  () => import('@/components/documents/DocumentViewer').then(mod => ({ default: mod.DocumentViewer })),
  { ssr: false }
)

const PaywallBanner = dynamic(
  () => import('@/components/documents/PaywallBanner').then(mod => ({ default: mod.PaywallBanner })),
  { ssr: false }
)

const RatingSection = dynamic(
  () => import('@/components/agents/RatingSection').then(mod => ({ default: mod.RatingSection })),
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
import { trackDownload, createReport } from '@/lib/supabase/mutations'
import { FavoriteButton } from '@/components/agents/FavoriteButton'
import { useSession, signIn } from 'next-auth/react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { canAccessFullDocumentation } from '@/lib/documents/access'
import { useQuery } from '@tanstack/react-query'
import { generatePDFFromHTML } from '@/lib/pdf/generatePDF'
import { useRef } from 'react'

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
  const [isReporting, setIsReporting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  // Fetch agent data
  const { data: agent, isLoading, error } = useAgent(slug, user?.id)
  console.log('Agent query state:', { isLoading, hasError: !!error, hasAgent: !!agent })
  if (agent) {
    console.log('Agent loaded:', { id: agent.id, slug: agent.slug, name: agent.name })
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

  // Check if user can access full documentation
  const { data: canAccessFull = false } = useQuery({
    queryKey: ['doc-access', agent?.id, user?.id],
    queryFn: async () => {
      if (!agent) return false
      return await canAccessFullDocumentation(agent.id, user?.id || null, {
        is_premium: agent.is_premium,
        user_id: agent.user_id,
      })
    },
    enabled: !!agent,
  })

  // Handle download
  const handleDownloadDocument = async () => {
    if (!agent || !documentRef.current) return

    setIsDownloading(true)

    try {
      // Track download
      await trackDownload({
        agent_id: agent.id,
        user_id: user?.id || null,
      })

      // Generate PDF from the document content
      const filename = `${agent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_documentation.pdf`

      await generatePDFFromHTML(documentRef.current, {
        filename,
        title: agent.name,
        author: agent.profile.full_name || agent.profile.username,
        orientation: 'portrait',
        margin: 15,
      })

      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle share dialog
  const handleShare = () => {
    setShareDialogOpen(true)
  }

  // Handle report
  const handleReport = async () => {
    if (!user) {
      toast.error('Please sign in to report this agent.')
      return
    }

    if (!agent) return

    setIsReporting(true)
    try {
      await createReport(agent.id, user.id)
      toast.success('Report submitted. Thank you for reporting. We will review this agent.')
    } catch (error: any) {
      // Check if already reported
      if (error?.code === '23505') {
        toast.error('You have already reported this agent.')
      } else {
        toast.error('Failed to submit report. Please try again.')
      }
    } finally {
      setIsReporting(false)
    }
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

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          {agent.status && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <span className={`text-sm font-medium px-2 py-1 rounded inline-block`} style={{ backgroundColor: agent.status.color + '20', color: agent.status.color }}>
                {agent.status.name}
              </span>
            </div>
          )}
          {agent.phase && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phase</p>
              <span className={`text-sm font-medium px-2 py-1 rounded inline-block`} style={{ backgroundColor: agent.phase.color + '20', color: agent.phase.color }}>
                {agent.phase.name}
              </span>
            </div>
          )}
          {agent.benefit && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Benefit Level</p>
              <span className={`text-sm font-medium px-2 py-1 rounded inline-block`} style={{ backgroundColor: agent.benefit.color + '20', color: agent.benefit.color }}>
                {agent.benefit.name}
              </span>
            </div>
          )}
          {agent.opsStatus && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Operational Status</p>
              <span className={`text-sm font-medium px-2 py-1 rounded inline-block`} style={{ backgroundColor: agent.opsStatus.color + '20', color: agent.opsStatus.color }}>
                {agent.opsStatus.name}
              </span>
            </div>
          )}
        </div>

        {/* Additional Information */}
        {(agent.data || agent.benefitsDesc || agent.link) && (
          <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
            {agent.benefitsDesc && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Benefits</h3>
                <p className="text-sm text-muted-foreground">{agent.benefitsDesc}</p>
              </div>
            )}
            {agent.data && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Additional Data</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{agent.data}</p>
              </div>
            )}
            {agent.link && (
              <div>
                <h3 className="text-sm font-semibold mb-2">External Link</h3>
                <a href={agent.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  {agent.link}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
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
            Updated {new Date(agent.updated_at).toLocaleDateString()}
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
            {/* Report button - only show to non-owners */}
            {(!user || agent.user_id !== user.id) && (
              <Button
                variant="ghost"
                size="default"
                onClick={handleReport}
                disabled={isReporting}
              >
                <Flag className="h-4 w-4 mr-2" />
                {isReporting ? 'Reporting...' : 'Report'}
              </Button>
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
      </div>

      {/* Main Content */}
      <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {/* Download Button */}
              {(agent.documentation_preview || agent.documentation_full) && (
                <div className="mb-6 flex justify-end">
                  <Button
                    onClick={handleDownloadDocument}
                    size="default"
                    variant="outline"
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                </div>
              )}

              {/* Document Viewer */}
              <div ref={documentRef}>
                {canAccessFull && agent.documentation_full ? (
                  <DocumentViewer content={agent.documentation_full} />
                ) : agent.documentation_preview ? (
                  <>
                    <DocumentViewer content={agent.documentation_preview} />
                    {agent.is_premium && (
                      <PaywallBanner
                        agentId={agent.id}
                        agentName={agent.name}
                        price={agent.price}
                        currency={agent.currency}
                      />
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No documentation available for this agent.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ratings & Reviews */}
          <Card>
            <CardContent className="pt-6">
              <RatingSection
                agentId={agent.id}
                userId={user?.id}
                averageRating={agent.avg_rating}
                totalRatings={agent.total_ratings}
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
