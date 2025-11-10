# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PPAgents is a private AI agent sharing platform for internal company use. It allows team members to share platform-agnostic AI agents (OpenAI, Google Gemini, Claude, LangChain, Copilot) with full documentation for recreation. The platform uses PostgreSQL for backend (GCP Cloud SQL or local) and Next.js for the frontend.

## Tech Stack

### Frontend
- **Framework**: Next.js 15+ with App Router and TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI primitives with custom components
- **State Management**: TanStack Query (React Query) v5 for server state
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Rich Text**: Tiptap editor with extensions (tables, images, links, etc.)
- **Toasts**: Sonner
- **Utilities**: clsx, tailwind-merge, class-variance-authority

### Backend
- **Database**: PostgreSQL (GCP Cloud SQL or local development)
- **Auth**: NextAuth.js v4 with Google OAuth, Azure AD support
- **API Layer**: Next.js API Routes with custom error handling and middleware
- **ORM**: Prisma v6 with PostgreSQL
- **Error Tracking**: Sentry integration (@sentry/nextjs)
- **Logging**: Winston for production logging
- **Security**: CSRF protection, rate limiting, input sanitization (DOMPurify)
- **Rate Limiting**: Upstash Redis with @upstash/ratelimit (required for production)

### Infrastructure
- **Cloud Platform**: Google Cloud Platform (GCP) or Vercel
- **Deployment**: Cloud Run, Vercel, or Docker containers
- **Database**: Cloud SQL PostgreSQL instance
- **Caching/Rate Limiting**: Upstash Redis (required for production)

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure:
# - DATABASE_URL and DIRECT_URL (PostgreSQL connection)
# - NEXTAUTH_URL and NEXTAUTH_SECRET
# - OAuth provider credentials (Google/Azure AD)
# - UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (for production)
# - Optional: NEXT_PUBLIC_SENTRY_DSN for error tracking

# Run database migrations
npx prisma migrate dev

# Generate TypeScript types from database
npx prisma generate

# Seed database (optional)
npm run prisma:seed
```

### Development
```bash
# Start development server
npm run dev
```

### Testing & Quality
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

### Database
```bash
# Create new migration
npx prisma migrate dev --name <migration_name>

# Reset local database
npx prisma migrate reset

# Push schema changes without migration
npx prisma db push

# Open Prisma Studio
npm run prisma:studio

# Deploy migrations to production
npm run prisma:migrate:deploy

# Seed database
npm run prisma:seed
```

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Architecture Overview

### Database Schema Structure

The application uses a comprehensive PostgreSQL schema with the following core models:

#### User & Authentication
- **User**: Core NextAuth.js user model with CUID primary keys
- **Account**: OAuth provider accounts (Google, Azure AD)
- **Session**: User sessions with database persistence
- **Profile**: Extended user information (username, bio, avatar, social links)

#### Content Models
- **Agent**: Main content entity with JSONB configuration storage
- **Category**: Hierarchical categories with parent-child relationships
- **Tag**: Tags for agent classification (many-to-many via AgentTag)
- **Status**: Agent development status (draft, published, archived)
- **Phase**: Agent lifecycle phase
- **Benefit**: Agent benefit categories
- **OpsStatus**: Operational status tracking

#### User Interactions
- **Favorite**: User's saved agents (replaces upvotes)
- **Download**: Download tracking with IP and user agent
- **Comment**: Threaded comments on agents
- **Rating**: 1-5 star ratings with optional reviews
- **Follow**: User following system
- **Notification**: User notification system

#### Collections & Versioning
- **Collection**: User-created agent collections
- **CollectionAgent**: Many-to-many relationship between collections and agents
- **AgentVersion**: Version history for agents

#### MCP (Model Context Protocol)
- **McpToken**: API tokens for MCP access
- **McpAuditLog**: Audit trail for MCP tool usage

**Key Schema Features**:
- CUID primary keys for all entities
- Comprehensive indexing for performance
- Cascading deletes for data integrity
- JSONB fields for flexible configuration storage
- Timestamptz for all timestamps

### Key Application Flows

1. **Agent Creation Flow**
   - Form in [src/app/add/page.tsx](src/app/add/page.tsx)
   - Validation using Zod schemas in [src/lib/validations/agent.ts](src/lib/validations/agent.ts)
   - API endpoint at [src/app/api/agents/route.ts](src/app/api/agents/route.ts)
   - Database operations in [src/lib/db/agents.ts](src/lib/db/agents.ts)
   - Stores configurations as JSONB for flexibility
   - Generates unique slug for URL routing

2. **Discovery System**
   - Browse page at [src/app/browse/page.tsx](src/app/browse/page.tsx)
   - Client-side filtering and pagination using TanStack Query
   - API endpoint provides filtered/sorted results
   - Efficient indexing on common search fields

3. **Authentication Flow**
   - NextAuth.js configuration in [src/lib/auth/config.ts](src/lib/auth/config.ts)
   - Google OAuth and Azure AD providers
   - Database session persistence
   - Profile auto-creation on first sign-in
   - Session helpers in [src/lib/auth/session.ts](src/lib/auth/session.ts)

4. **Security & Rate Limiting**
   - CSRF protection in [src/lib/security/csrf.ts](src/lib/security/csrf.ts)
   - Rate limiting in [src/lib/ratelimit.ts](src/lib/ratelimit.ts) using Upstash Redis
   - Input sanitization in [src/lib/security/sanitize.ts](src/lib/security/sanitize.ts)
   - Error logging in [src/lib/security/logger.ts](src/lib/security/logger.ts)

### Frontend Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── page.tsx                  # Landing page
│   ├── browse/page.tsx           # Browse agents
│   ├── add/page.tsx              # Add new agent
│   ├── agents/[id]/              # Agent detail and edit pages
│   ├── profile/                  # User profiles
│   ├── auth/                     # Auth pages (signin, error)
│   └── api/                      # API routes
│       ├── auth/                 # NextAuth.js endpoints
│       ├── agents/               # Agent CRUD operations
│       ├── categories/           # Lookup data endpoints
│       ├── tags/
│       ├── statuses/
│       ├── phases/
│       ├── benefits/
│       ├── ops-statuses/
│       └── profiles/             # Profile endpoints
├── components/
│   ├── agents/                   # Agent-related components
│   │   ├── AgentCard.tsx
│   │   ├── RatingSection.tsx
│   │   ├── CommentSection.tsx
│   │   ├── FavoriteButton.tsx
│   │   └── PaginatedAgentGrid.tsx
│   ├── ui/                       # Radix UI-based components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── dropdown-menu.tsx
│   ├── layouts/                  # Layout components
│   │   └── Header.tsx
│   └── providers/                # React context providers
│       ├── QueryProvider.tsx     # TanStack Query
│       └── SessionProvider.tsx   # NextAuth session
├── lib/
│   ├── db/                       # Database layer
│   │   ├── client.ts             # Prisma client singleton
│   │   ├── agents.ts             # Agent database operations
│   │   └── query-fragments.ts   # Reusable Prisma query fragments
│   ├── auth/                     # Authentication
│   │   ├── config.ts             # NextAuth configuration
│   │   └── session.ts            # Session helpers
│   ├── security/                 # Security utilities
│   │   ├── csrf.ts               # CSRF protection
│   │   ├── sanitize.ts           # Input sanitization
│   │   └── logger.ts             # Winston logging
│   ├── api/                      # API utilities
│   │   ├── client.ts             # API client
│   │   ├── error-handler.ts      # Error handling
│   │   ├── auth-helpers.ts       # Auth helpers
│   │   ├── transformers.ts       # Data transformers
│   │   └── lookup-route-factory.ts # Generic lookup route factory
│   ├── validations/              # Zod schemas
│   │   └── agent.ts              # Agent validation schemas
│   ├── ratelimit.ts              # Rate limiting
│   └── utils.ts                  # Utility functions
├── hooks/                        # Custom React hooks
│   ├── useAgents.ts              # Agent data fetching
│   ├── useAgentsAPI.ts           # Agent API mutations
│   ├── useAuth.ts                # Authentication state
│   ├── useComments.ts            # Comment management
│   ├── useFavorites.ts           # Favorite management
│   ├── useRatings.ts             # Rating management
│   ├── useStatuses.ts            # Lookup data hooks
│   └── useCsrfToken.ts           # CSRF token management
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Database types
│   └── next-auth.d.ts            # NextAuth type extensions
└── prisma/
    ├── schema.prisma             # Database schema
    ├── seed.ts                   # Seed data
    └── migrations/               # Database migrations
```

### Database Configuration

Using PostgreSQL (GCP Cloud SQL or local):
- **Access Control**: Application-level authorization in API routes
- **Indexes**: Comprehensive B-tree indexes on foreign keys and search fields
- **Cascading Deletes**: Foreign key constraints for data integrity
- **Connection Pooling**: Prisma connection pool
- **Direct URL**: Required for migrations (DIRECT_URL environment variable)

### State Management Patterns

- **Server State**: TanStack Query (React Query) for all API data fetching and mutations
- **Form State**: React Hook Form for complex forms with Zod validation
- **URL State**: Next.js router for shareable filter/search states
- **No Global Client State**: Minimal client state, primarily server-driven

## Important Considerations

### Security

- **OAuth Authentication**: Google Workspace and Azure AD support
- **Input Sanitization**: All user inputs sanitized using DOMPurify before storage ([src/lib/security/sanitize.ts](src/lib/security/sanitize.ts))
- **Rate Limiting**: Upstash Redis-based rate limiting on all API routes ([src/lib/ratelimit.ts](src/lib/ratelimit.ts))
  - **REQUIRED for production**: Must configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
  - Development fallback uses in-memory rate limiting (not suitable for production)
- **SQL Injection**: Prevented using Prisma's parameterized queries
- **XSS Protection**: Content sanitized before rendering
- **CSRF Protection**: Token-based CSRF validation for mutations ([src/lib/security/csrf.ts](src/lib/security/csrf.ts))
- **Session Security**: Database-persisted sessions with NextAuth.js
- **Error Tracking**: Sentry integration for production error monitoring

### Performance

- **Pagination**: Implemented in browse page with configurable page size
- **Database Queries**: Use Prisma's query builder with selective field loading
- **Caching**: TanStack Query provides automatic client-side caching with stale-while-revalidate
- **Connection Pooling**: Configured via DATABASE_URL parameters
- **Indexes**: Strategic indexes on frequently queried fields (see schema)
- **Query Fragments**: Reusable Prisma query fragments in [src/lib/db/query-fragments.ts](src/lib/db/query-fragments.ts)

### Agent Data Structure

Agents use JSONB fields for flexible configuration storage:
- **instructions**: Platform-specific setup instructions
- **configuration**: Platform-specific configuration (API keys, model settings, etc.)
- **sampleInputs**: Array of example inputs
- **sampleOutputs**: Array of example outputs
- **data**: Free-form additional data

Additional agent fields:
- **markdownContent**: Rich markdown documentation
- **benefitsDesc**: Benefits description
- **link**: External resource URL
- **prerequisites**: Array of prerequisite steps

### Required Environment Variables

**Database**:
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection for migrations

**Authentication**:
- `NEXTAUTH_URL`: Base URL of the application
- `NEXTAUTH_SECRET`: Secret for JWT encryption (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: For Google OAuth
- `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`: For Azure AD

**Rate Limiting (Required for Production)**:
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token

**Optional**:
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry error tracking
- `GCP_PROJECT_ID`: GCP project ID
- `GCP_STORAGE_BUCKET`: Google Cloud Storage bucket name
- `ENABLE_DEBUG_PANEL`: Enable debug panel in development

### API Design Patterns

1. **Lookup Route Factory**: Generic factory for category/tag/status endpoints ([src/lib/api/lookup-route-factory.ts](src/lib/api/lookup-route-factory.ts))
2. **Error Handling**: Centralized error handler with proper HTTP status codes ([src/lib/api/error-handler.ts](src/lib/api/error-handler.ts))
3. **Auth Helpers**: Session validation and user authorization utilities ([src/lib/api/auth-helpers.ts](src/lib/api/auth-helpers.ts))
4. **Data Transformers**: Consistent data transformation for API responses ([src/lib/api/transformers.ts](src/lib/api/transformers.ts))

### Testing

- **Framework**: Jest with TypeScript support
- **React Testing**: Testing Library for component tests
- **Test Scripts**: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Example Tests**: See [src/lib/validations/__tests__/agent.test.ts](src/lib/validations/__tests__/agent.test.ts)

### Production Deployment Checklist

1. **Environment Variables**: Configure all required variables (especially Upstash Redis)
2. **Database Migration**: Run `npx prisma migrate deploy`
3. **Security Audit**: Run `npm audit` and fix vulnerabilities
4. **Type Check**: Run `npm run type-check`
5. **Build Test**: Run `npm run build` to verify production build
6. **Sentry Setup**: Configure error tracking
7. **CSRF Tokens**: Ensure frontend includes CSRF tokens in mutations
8. **Rate Limiting**: Verify Upstash Redis is configured (required for serverless)
