'use client'

import { useState, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { useAgents } from '@/hooks/useAgents'
import { useStatuses, usePhases, useBenefits, useOpsStatuses } from '@/hooks/useAgentsAPI'
import { PaginatedAgentGrid } from '@/components/agents/PaginatedAgentGrid'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedPhases, setSelectedPhases] = useState<string[]>([])
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [selectedOpsStatuses, setSelectedOpsStatuses] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'createdAt' | 'favoritesCount' | 'viewsCount'>('createdAt')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Collapsible state for each filter section - status expanded by default
  const [statusExpanded, setStatusExpanded] = useState(true)
  const [phaseExpanded, setPhaseExpanded] = useState(false)
  const [benefitExpanded, setBenefitExpanded] = useState(false)
  const [opsStatusExpanded, setOpsStatusExpanded] = useState(false)

  // Fetch all filter options
  const { data: statusesResponse } = useStatuses()
  const { data: phasesResponse } = usePhases()
  const { data: benefitsResponse } = useBenefits()
  const { data: opsStatusesResponse } = useOpsStatuses()

  const statuses = statusesResponse?.statuses || []
  const phases = phasesResponse?.phases || []
  const benefits = benefitsResponse?.benefits || []
  const opsStatuses = opsStatusesResponse?.opsStatuses || []

  // Build query params for agents
  const queryParams = useMemo(
    () => ({
      search: debouncedSearchQuery || undefined,
      statuses: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
      phases: selectedPhases.length > 0 ? selectedPhases.join(',') : undefined,
      benefits: selectedBenefits.length > 0 ? selectedBenefits.join(',') : undefined,
      opsStatuses: selectedOpsStatuses.length > 0 ? selectedOpsStatuses.join(',') : undefined,
      sortBy,
      order: 'desc' as const,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }),
    [debouncedSearchQuery, selectedStatuses, selectedPhases, selectedBenefits, selectedOpsStatuses, sortBy, currentPage, pageSize]
  )

  // Fetch agents
  const { data: agentsResponse, isLoading, error } = useAgents(queryParams)
  const agents = agentsResponse?.agents || []
  const totalCount = agentsResponse?.total || 0

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return selectedStatuses.length + selectedPhases.length + selectedBenefits.length + selectedOpsStatuses.length
  }, [selectedStatuses, selectedPhases, selectedBenefits, selectedOpsStatuses])

  // Toggle filter handlers
  const toggleStatus = (slug: string) => {
    setSelectedStatuses(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setCurrentPage(1)
  }

  const togglePhase = (slug: string) => {
    setSelectedPhases(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setCurrentPage(1)
  }

  const toggleBenefit = (slug: string) => {
    setSelectedBenefits(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setCurrentPage(1)
  }

  const toggleOpsStatus = (slug: string) => {
    setSelectedOpsStatuses(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
    setCurrentPage(1)
  }

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search agents by name or description..."
            aria-label="Search agents by name or description"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden relative"
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <select
            className="px-4 py-2 border rounded-md text-sm"
            value={sortBy}
            aria-label="Sort agents by"
            onChange={(e) => {
              setSortBy(e.target.value as any)
              setCurrentPage(1)
            }}
          >
            <option value="createdAt">Most Recent</option>
            <option value="favoritesCount">Most Favorited</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="border rounded-lg">
              <button
                onClick={() => setStatusExpanded(!statusExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                aria-expanded={statusExpanded}
                aria-controls="status-filter-content"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Status</span>
                  {selectedStatuses.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                </div>
                {statusExpanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>
              {statusExpanded && (
                <div id="status-filter-content" className="px-3 pb-3 space-y-2">
                  {statuses.map((status: any) => (
                    <label key={status.id} className="flex items-center cursor-pointer hover:bg-muted/30 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.slug)}
                        onChange={() => toggleStatus(status.slug)}
                        className="mr-2"
                        aria-label={`Filter by ${status.name}`}
                      />
                      <span className="text-sm">{status.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Phase Filter */}
            <div className="border rounded-lg">
              <button
                onClick={() => setPhaseExpanded(!phaseExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                aria-expanded={phaseExpanded}
                aria-controls="phase-filter-content"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Phase</span>
                  {selectedPhases.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedPhases.length}
                    </Badge>
                  )}
                </div>
                {phaseExpanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>
              {phaseExpanded && (
                <div id="phase-filter-content" className="px-3 pb-3 space-y-2">
                  {phases.map((phase: any) => (
                    <label key={phase.id} className="flex items-center cursor-pointer hover:bg-muted/30 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPhases.includes(phase.slug)}
                        onChange={() => togglePhase(phase.slug)}
                        className="mr-2"
                        aria-label={`Filter by ${phase.name}`}
                      />
                      <span className="text-sm">{phase.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Benefit Filter */}
            <div className="border rounded-lg">
              <button
                onClick={() => setBenefitExpanded(!benefitExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                aria-expanded={benefitExpanded}
                aria-controls="benefit-filter-content"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Benefit Level</span>
                  {selectedBenefits.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedBenefits.length}
                    </Badge>
                  )}
                </div>
                {benefitExpanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>
              {benefitExpanded && (
                <div id="benefit-filter-content" className="px-3 pb-3 space-y-2">
                  {benefits.map((benefit: any) => (
                    <label key={benefit.id} className="flex items-center cursor-pointer hover:bg-muted/30 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedBenefits.includes(benefit.slug)}
                        onChange={() => toggleBenefit(benefit.slug)}
                        className="mr-2"
                        aria-label={`Filter by ${benefit.name}`}
                      />
                      <span className="text-sm">{benefit.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Ops Status Filter */}
            <div className="border rounded-lg">
              <button
                onClick={() => setOpsStatusExpanded(!opsStatusExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                aria-expanded={opsStatusExpanded}
                aria-controls="ops-status-filter-content"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Operational Status</span>
                  {selectedOpsStatuses.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedOpsStatuses.length}
                    </Badge>
                  )}
                </div>
                {opsStatusExpanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>
              {opsStatusExpanded && (
                <div id="ops-status-filter-content" className="px-3 pb-3 space-y-2">
                  {opsStatuses.map((opsStatus: any) => (
                    <label key={opsStatus.id} className="flex items-center cursor-pointer hover:bg-muted/30 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedOpsStatuses.includes(opsStatus.slug)}
                        onChange={() => toggleOpsStatus(opsStatus.slug)}
                        className="mr-2"
                        aria-label={`Filter by ${opsStatus.name}`}
                      />
                      <span className="text-sm">{opsStatus.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStatuses([])
                    setSelectedPhases([])
                    setSelectedBenefits([])
                    setSelectedOpsStatuses([])
                    setCurrentPage(1)
                  }}
                  className="w-full"
                >
                  Clear Filters ({activeFilterCount})
                </Button>
              )}
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setCurrentPage(1)
                  }}
                  className="w-full"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Agents Grid/List */}
        <div className="flex-1">
          <PaginatedAgentGrid
            agents={agents}
            isLoading={isLoading}
            error={error}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
