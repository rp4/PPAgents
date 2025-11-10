"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, ArrowLeft, Check, AlertCircle } from "lucide-react"
import { useCreateAgent, useStatuses, usePhases, useBenefits, useOpsStatuses } from "@/hooks/useAgentsAPI"
import { createAgentSchema, type CreateAgentInput } from "@/lib/validations/agent"
import Link from "next/link"

export default function AddAgentPage() {
  const { data: session, status } = useSession()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const router = useRouter()

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
    watch,
    setValue,
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

  // Create agent mutation
  const { mutate: createAgent, isPending } = useCreateAgent()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/add' })
  }

  const onSubmit = async (data: CreateAgentInput) => {
    console.log('=== Form submitted ===')
    console.log('Form data:', data)
    console.log('Form errors:', errors)
    console.log('Session:', session)

    setSubmitError(null)
    setSubmitSuccess(false)

    if (!session?.user) {
      console.error('No session user')
      setSubmitError('You must be logged in to create an agent')
      return
    }

    try {
      // Generate slug from name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 100)

      // Prepare agent data for API (using camelCase as API expects)
      const agentData: any = {
        name: data.name,
        description: data.description,
        tagIds: [], // Empty array since we removed tags
      }

      // Only add status if provided
      if (data.status_id) {
        agentData.statusId = data.status_id
      }

      // Only add phase if provided
      if (data.phase_id) {
        agentData.phaseId = data.phase_id
      }

      // Only add benefit if provided
      if (data.benefit_id) {
        agentData.benefitId = data.benefit_id
      }

      // Only add ops status if provided
      if (data.ops_status_id) {
        agentData.opsStatusId = data.ops_status_id
      }

      // Add free-form text fields if provided
      if (data.data) {
        agentData.data = data.data
      }

      if (data.benefits_desc) {
        agentData.benefitsDesc = data.benefits_desc
      }

      if (data.link) {
        agentData.link = data.link
      }

      console.log('Generated slug:', slug)
      console.log('Agent data to send:', agentData)

      console.log('Calling createAgent mutation...')
      createAgent(
        agentData,
        {
          onSuccess: (newAgent) => {
            console.log('=== Agent created successfully ===')
            console.log('Agent object:', JSON.stringify(newAgent, null, 2))
            console.log('Agent ID:', newAgent.id)
            console.log('Agent slug:', newAgent.slug)
            console.log('Agent name:', newAgent.name)
            console.log('Agent isPublic:', newAgent.isPublic)
            console.log('Redirect URL will be:', `/agents/${newAgent.slug}`)

            setSubmitSuccess(true)
            toast.success('Agent created successfully!')

            // Redirect to the agent detail page after a short delay
            const redirectUrl = `/agents/${newAgent.slug}`
            console.log('Scheduling redirect to:', redirectUrl)
            setTimeout(() => {
              console.log('Executing redirect to:', redirectUrl)
              router.push(redirectUrl)
            }, 1500)
          },
          onError: (error: any) => {
            console.error('=== Error creating agent ===')
            console.error('Error:', error)
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
            setSubmitError(error.message || 'Failed to create agent. Please try again.')
            toast.error('Failed to create agent')
          }
        }
      )
      console.log('createAgent called')
    } catch (error: any) {
      console.error('Error in onSubmit:', error)
      setSubmitError(error.message || 'An unexpected error occurred')
    }
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // This will be handled by the useEffect redirect, but keep for safety
  if (!session) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/browse" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Browse
        </Link>
      </div>


      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Agent created successfully!</p>
            <p className="text-sm text-green-700">Redirecting to your agent...</p>
          </div>
        </div>
      )}

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
                <p className="text-sm text-red-500" role="alert">{errors.name.message}</p>
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
                <p className="text-sm text-red-500" role="alert">{errors.description.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status_id" className="text-sm font-medium">
                Status <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <select
                id="status_id"
                {...register('status_id')}
                className="w-full px-3 py-2 border rounded-md"
                aria-label="Agent status"
              >
                <option value="">Select a status</option>
                {statuses.map((status: any) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              {errors.status_id && (
                <p className="text-sm text-red-500" role="alert">{errors.status_id.message}</p>
              )}
            </div>

            {/* Phase */}
            <div className="space-y-2">
              <label htmlFor="phase_id" className="text-sm font-medium">
                Phase <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <select
                id="phase_id"
                {...register('phase_id')}
                className="w-full px-3 py-2 border rounded-md"
                aria-label="Agent phase"
              >
                <option value="">Select a phase</option>
                {phases.map((phase: any) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
              {errors.phase_id && (
                <p className="text-sm text-red-500" role="alert">{errors.phase_id.message}</p>
              )}
            </div>

            {/* Benefit */}
            <div className="space-y-2">
              <label htmlFor="benefit_id" className="text-sm font-medium">
                Benefit Level <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <select
                id="benefit_id"
                {...register('benefit_id')}
                className="w-full px-3 py-2 border rounded-md"
                aria-label="Benefit level"
              >
                <option value="">Select benefit level</option>
                {benefits.map((benefit: any) => (
                  <option key={benefit.id} value={benefit.id}>
                    {benefit.name}
                  </option>
                ))}
              </select>
              {errors.benefit_id && (
                <p className="text-sm text-red-500" role="alert">{errors.benefit_id.message}</p>
              )}
            </div>

            {/* Ops Status */}
            <div className="space-y-2">
              <label htmlFor="ops_status_id" className="text-sm font-medium">
                Operational Status <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <select
                id="ops_status_id"
                {...register('ops_status_id')}
                className="w-full px-3 py-2 border rounded-md"
                aria-label="Operational status"
              >
                <option value="">Select operational status</option>
                {opsStatuses.map((opsStatus: any) => (
                  <option key={opsStatus.id} value={opsStatus.id}>
                    {opsStatus.name}
                  </option>
                ))}
              </select>
              {errors.ops_status_id && (
                <p className="text-sm text-red-500" role="alert">{errors.ops_status_id.message}</p>
              )}
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label htmlFor="data" className="text-sm font-medium">
                Data <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <textarea
                id="data"
                {...register('data')}
                placeholder="Additional data or notes..."
                rows={1}
                className="w-full px-3 py-2 border rounded-md resize-none overflow-y-auto"
                style={{ minHeight: '2.5rem', maxHeight: '12rem' }}
                aria-label="Additional data or notes"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                }}
              />
              {errors.data && (
                <p className="text-sm text-red-500" role="alert">{errors.data.message}</p>
              )}
            </div>

            {/* Benefits Description */}
            <div className="space-y-2">
              <label htmlFor="benefits_desc" className="text-sm font-medium">
                Benefits Description <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <textarea
                id="benefits_desc"
                {...register('benefits_desc')}
                placeholder="Describe the benefits of using this agent..."
                rows={1}
                className="w-full px-3 py-2 border rounded-md resize-none overflow-y-auto"
                style={{ minHeight: '2.5rem', maxHeight: '12rem' }}
                aria-label="Benefits description"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 192) + 'px';
                }}
              />
              {errors.benefits_desc && (
                <p className="text-sm text-red-500" role="alert">{errors.benefits_desc.message}</p>
              )}
            </div>

            {/* Link */}
            <div className="space-y-2">
              <label htmlFor="link" className="text-sm font-medium">
                External Link <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <Input
                id="link"
                {...register('link')}
                placeholder="https://example.com/agent-docs"
                type="url"
                aria-label="External documentation link"
              />
              {errors.link && (
                <p className="text-sm text-red-500" role="alert">{errors.link.message}</p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending || submitSuccess}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            size="lg"
            onClick={(e) => {
              console.log('=== Button clicked ===')
              console.log('Button type:', e.currentTarget.type)
              console.log('Form errors before submit:', errors)
              console.log('Is submitting:', isSubmitting)
              console.log('Is pending:', isPending)
              console.log('Submit success:', submitSuccess)
            }}
          >
            {isSubmitting || isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : submitSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Created!
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create Agent
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
