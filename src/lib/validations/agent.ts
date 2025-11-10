import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize HTML/text content to prevent XSS
 */
function sanitizeHtml(value: unknown): string {
  if (typeof value !== 'string') return ''
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

// ============================================
// AGENT SCHEMAS
// ============================================

export const createAgentSchema = z.object({
  // Required fields
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })), // Strip all HTML

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .transform(sanitizeHtml),

  // Optional dropdown fields (IDs) - transform empty strings to undefined
  status_id: z.string()
    .transform(val => val === '' ? undefined : val)
    .optional(),

  phase_id: z.string()
    .transform(val => val === '' ? undefined : val)
    .optional(),

  benefit_id: z.string()
    .transform(val => val === '' ? undefined : val)
    .optional(),

  ops_status_id: z.string()
    .transform(val => val === '' ? undefined : val)
    .optional(),

  // Optional free-form text fields
  data: z.string()
    .max(10000, 'Data must be less than 10000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),

  benefits_desc: z.string()
    .max(5000, 'Benefits description must be less than 5000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),

  link: z.string()
    .url('Must be a valid URL')
    .max(500, 'Link must be less than 500 characters')
    .optional()
    .or(z.literal('')),

  // Public visibility
  is_public: z.boolean()
    .optional()
    .default(true),
})

export const updateAgentSchema = createAgentSchema.partial()

// Input type (before validation/transform) for forms
export type CreateAgentInput = z.input<typeof createAgentSchema>
// Output type (after validation/transform) for API
export type CreateAgentOutput = z.output<typeof createAgentSchema>

export type UpdateAgentInput = z.input<typeof updateAgentSchema>
export type UpdateAgentOutput = z.output<typeof updateAgentSchema>

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  agent_id: z.string().cuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters')
    .transform(sanitizeHtml),
  parent_id: z.string().cuid().optional(),
})

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters')
    .transform(sanitizeHtml),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

// ============================================
// RATING SCHEMAS (for rating system)
// ============================================

export const createRatingSchema = z.object({
  agent_id: z.string().cuid(),
  score: z.number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  review: z.string()
    .max(1000, 'Review must be less than 1000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),
})

export type CreateRatingInput = z.infer<typeof createRatingSchema>

// ============================================
// PROFILE SCHEMAS
// ============================================

export const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),

  full_name: z.string()
    .max(100, 'Full name must be less than 100 characters')
    .optional()
    .transform(val => val ? DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }) : undefined),

  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),

  website: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),

  github_url: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),

  linkedin_url: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
})

export type UpdateProfileInput = z.input<typeof updateProfileSchema>
export type UpdateProfileOutput = z.output<typeof updateProfileSchema>

// ============================================
// COLLECTION SCHEMAS (for user collections)
// ============================================

export const createCollectionSchema = z.object({
  name: z.string()
    .min(3, 'Collection name must be at least 3 characters')
    .max(100, 'Collection name must be less than 100 characters')
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),

  is_public: z.boolean()
    .optional()
    .default(true),
})

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
