"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import { useAgent, useUpdateAgent } from "@/hooks/useAgents"
import { useStatuses, usePhases, useBenefits, useOpsStatuses } from "@/hooks/useAgentsAPI"
import { useQuery } from "@tanstack/react-query"
import { createAgentSchema, type CreateAgentInput } from "@/lib/validations/agent"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: slug } = use(params)
  const { data: session, status } = useSession()
  const user = session?.user
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch agent data
  const { data: agent, isLoading: loadingAgent, error: agentError } = useAgent(slug, user?.id)

  // Fetch statuses, phases, benefits, and ops statuses from API
  const { data: statusesResponse } = useStatuses()
  const { data: phasesResponse } = usePhases()
  const { data: benefitsResponse } = useBenefits()
  const { data: opsStatusesResponse } = useOpsStatuses()
  const statuses = statusesResponse?.statuses || []
  const phases = phasesResponse?.phases || []
  const benefits = benefitsResponse?.benefits || []
  const opsStatuses = opsStatusesResponse?.opsStatuses || []

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateAgentInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      is_public: true,
      status_id: '',
      phase_id: '',
      benefit_id: '',
      ops_status_id: '',
    },
  })

  // Update agent mutation
  const { mutate: updateAgent, isPending } = useUpdateAgent()

  // Populate form when agent data loads
  useEffect(() => {
    if (agent) {
      // Check if user is the owner
      if (user && agent.user_id !== user.id) {
        toast.error('You do not have permission to edit this agent')
        router.push(`/agents/${slug}`)
        return
      }

      // Set form values
      reset({
        name: agent.name,
        description: agent.description,
        is_public: agent.is_public,
        status_id: agent.statusId || '',
        phase_id: agent.phaseId || '',
        benefit_id: agent.benefitId || '',
        ops_status_id: agent.opsStatusId || '',
        data: agent.data || '',
        benefits_desc: agent.benefitsDesc || '',
        link: agent.link || '',
      })
    }
  }, [agent, user, reset, router, slug])

  const onSubmit = async (data: CreateAgentInput) => {
    setSubmitError(null)

    if (!user || !agent) {
      setSubmitError('You must be logged in to edit an agent')
      return
    }

    if (agent.user_id !== user.id) {
      setSubmitError('You do not have permission to edit this agent')
      return
    }

    try {
      // Prepare agent updates - only include fields that changed
      const agentUpdates: any = {
        name: data.name,
        description: data.description,
      }

      // Add status if provided
      if (data.status_id) {
        agentUpdates.statusId = data.status_id
      }

      // Add phase if provided
      if (data.phase_id) {
        agentUpdates.phaseId = data.phase_id
      }

      // Add benefit if provided
      if (data.benefit_id) {
        agentUpdates.benefitId = data.benefit_id
      }

      // Add ops status if provided
      if (data.ops_status_id) {
        agentUpdates.opsStatusId = data.ops_status_id
      }

      // Add free-form text fields if provided
      if (data.data) {
        agentUpdates.data = data.data
      }

      if (data.benefits_desc) {
        agentUpdates.benefitsDesc = data.benefits_desc
      }

      if (data.link) {
        agentUpdates.link = data.link
      }

      updateAgent(
        {
          agentId: agent.id,
          updates: agentUpdates
        },
        {
          onSuccess: (updatedAgent) => {
            toast.success('Agent updated successfully!')
            // Redirect to the agent detail page
            setTimeout(() => {
              router.push(`/agents/${updatedAgent.slug}`)
            }, 1000)
          },
          onError: (error: any) => {
            console.error('Error updating agent:', error)
            setSubmitError(error.message || 'Failed to update agent. Please try again.')
            toast.error('Failed to update agent')
          }
        }
      )
    } catch (error: any) {
      console.error('Error in onSubmit:', error)
      setSubmitError(error.message || 'An unexpected error occurred')
    }
  }

  // Show loading state
  if (loadingAgent) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Show error if agent not found or user not authorized
  if (agentError || !agent) {
    return notFound()
  }

  if (!user) {
    router.push(`/agents/${slug}`)
    return null
  }

  if (agent.user_id !== user.id) {
    toast.error('You do not have permission to edit this agent')
    router.push(`/agents/${slug}`)
    return null
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/agents/${slug}`} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Agent
        </Link>
      </div>


      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Agent Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Agent Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Financial Statement Analyzer"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Describe what your agent does and how it helps auditors..."
                rows={1}
                className={`w-full px-3 py-2 border rounded-md resize-none overflow-y-auto ${
                  errors.description ? 'border-red-500' : 'border-input'
                }`}
                style={{ minHeight: '2.5rem', maxHeight: '12rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                }}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status_id" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status_id"
                {...register('status_id')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a status</option>
                {statuses.map((status: any) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              {errors.status_id && (
                <p className="text-sm text-red-500">{errors.status_id.message}</p>
              )}
            </div>

            {/* Phase */}
            <div className="space-y-2">
              <label htmlFor="phase_id" className="text-sm font-medium">
                Phase
              </label>
              <select
                id="phase_id"
                {...register('phase_id')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a phase</option>
                {phases.map((phase: any) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
              {errors.phase_id && (
                <p className="text-sm text-red-500">{errors.phase_id.message}</p>
              )}
            </div>

            {/* Benefit */}
            <div className="space-y-2">
              <label htmlFor="benefit_id" className="text-sm font-medium">
                Benefit Level
              </label>
              <select
                id="benefit_id"
                {...register('benefit_id')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select benefit level</option>
                {benefits.map((benefit: any) => (
                  <option key={benefit.id} value={benefit.id}>
                    {benefit.name}
                  </option>
                ))}
              </select>
              {errors.benefit_id && (
                <p className="text-sm text-red-500">{errors.benefit_id.message}</p>
              )}
            </div>

            {/* Ops Status */}
            <div className="space-y-2">
              <label htmlFor="ops_status_id" className="text-sm font-medium">
                Operational Status
              </label>
              <select
                id="ops_status_id"
                {...register('ops_status_id')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select operational status</option>
                {opsStatuses.map((opsStatus: any) => (
                  <option key={opsStatus.id} value={opsStatus.id}>
                    {opsStatus.name}
                  </option>
                ))}
              </select>
              {errors.ops_status_id && (
                <p className="text-sm text-red-500">{errors.ops_status_id.message}</p>
              )}
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label htmlFor="data" className="text-sm font-medium">
                Data
              </label>
              <textarea
                id="data"
                {...register('data')}
                placeholder="Additional data or notes..."
                rows={1}
                className="w-full px-3 py-2 border rounded-md resize-none overflow-y-auto"
                style={{ minHeight: '2.5rem', maxHeight: '12rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                }}
              />
              {errors.data && (
                <p className="text-sm text-red-500">{errors.data.message}</p>
              )}
            </div>

            {/* Benefits Description */}
            <div className="space-y-2">
              <label htmlFor="benefits_desc" className="text-sm font-medium">
                Benefits Description
              </label>
              <textarea
                id="benefits_desc"
                {...register('benefits_desc')}
                placeholder="Describe the benefits of using this agent..."
                rows={1}
                className="w-full px-3 py-2 border rounded-md resize-none overflow-y-auto"
                style={{ minHeight: '2.5rem', maxHeight: '12rem' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                }}
              />
              {errors.benefits_desc && (
                <p className="text-sm text-red-500">{errors.benefits_desc.message}</p>
              )}
            </div>

            {/* Link */}
            <div className="space-y-2">
              <label htmlFor="link" className="text-sm font-medium">
                External Link
              </label>
              <Input
                id="link"
                {...register('link')}
                placeholder="https://example.com/agent-docs"
                type="url"
              />
              {errors.link && (
                <p className="text-sm text-red-500">{errors.link.message}</p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/agents/${slug}`)}
            className="flex-1"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isPending}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            size="lg"
          >
            {isSubmitting || isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Agent
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
