import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import type { AgentWithRelations } from '@/types/database'

interface AgentCardProps {
  agent: AgentWithRelations
  showAuthor?: boolean
}

function AgentCardComponent({ agent, showAuthor = true }: AgentCardProps) {
  return (
    <Link href={`/agents/${agent.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg line-clamp-2">{agent.name}</CardTitle>
            {agent.is_featured && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                Featured
              </div>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {agent.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platforms */}
          <div className="flex flex-wrap gap-2">
            {agent.agent_platforms?.map((ap) => (
              <span
                key={ap.platform_id}
                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium"
              >
                {ap.platform.name}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>{agent.favorites_count}</span>
            </div>
          </div>

          {/* Category */}
          {agent.category && (
            <div className="text-xs text-muted-foreground">
              {agent.category.name}
            </div>
          )}

          {/* Phase and Benefit */}
          {(agent.phase || agent.benefit) && (
            <div className="space-y-1.5 text-xs">
              {agent.phase && (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-muted-foreground">Phase:</span>
                  <span
                    className="text-foreground px-2 py-0.5 rounded"
                    style={agent.phase.color ? { backgroundColor: agent.phase.color + '20', color: agent.phase.color } : undefined}
                  >
                    {agent.phase.name}
                  </span>
                </div>
              )}
              {agent.benefit && (
                <div className="flex items-start gap-1.5">
                  <span className="font-medium text-muted-foreground">Benefit:</span>
                  <span
                    className="text-foreground line-clamp-2 px-2 py-0.5 rounded"
                    style={agent.benefit.color ? { backgroundColor: agent.benefit.color + '20', color: agent.benefit.color } : undefined}
                  >
                    {agent.benefit.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Author */}
          {showAuthor && agent.profile && (
            <div className="flex items-center gap-2 pt-4 border-t">
              {agent.profile.avatar_url ? (
                <Image
                  src={agent.profile.avatar_url}
                  alt={agent.profile.full_name || agent.profile.username}
                  width={24}
                  height={24}
                  className="rounded-full"
                  loading="lazy"
                  sizes="24px"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                  {agent.profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                {agent.profile.full_name || agent.profile.username}
              </span>
            </div>
          )}

          {/* Tags */}
          {agent.agentTags && agent.agentTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agent.agentTags.slice(0, 3).map((agentTag: any) => (
                <span
                  key={agentTag.tag.id}
                  className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
                  style={agentTag.tag.color ? { backgroundColor: agentTag.tag.color + '20', color: agentTag.tag.color } : undefined}
                >
                  #{agentTag.tag.name}
                </span>
              ))}
              {agent.agentTags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{agent.agentTags.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// Memoized export to prevent unnecessary re-renders
export const AgentCard = memo(AgentCardComponent)
