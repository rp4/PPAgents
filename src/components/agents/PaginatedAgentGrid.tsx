'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AgentCard } from './AgentCard'
import { ChevronLeft, ChevronRight, Search, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaginatedAgentGridProps {
  agents: any[]
  isLoading: boolean
  error: any
  totalCount?: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function PaginatedAgentGrid({
  agents,
  isLoading,
  error,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
}: PaginatedAgentGridProps) {
  const router = useRouter()
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
        <span className="sr-only">Loading agents...</span>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-muted-foreground mb-4 font-medium">Failed to load agents</p>
        <p className="text-sm text-muted-foreground mb-6">
          There was a problem loading the agents. Please try again.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <Search className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No agents found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Try adjusting your filters or search query, or be the first to create an agent!
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Clear All
          </Button>
          <Button onClick={() => router.push('/add')}>
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Create Agent
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Agent Cards Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent: any) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalCount && totalCount > pageSize && (
        <nav className="flex items-center justify-between border-t pt-6" aria-label="Pagination">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} agents
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
              Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1" role="list">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-10"
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage}
              aria-label="Go to next page"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
