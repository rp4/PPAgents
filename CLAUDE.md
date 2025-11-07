# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PPAgents is a private AI agent sharing platform for internal company use. It allows team members to share platform-agnostic AI agents (OpenAI, Google Gemini, Claude, LangChain, Copilot) with full documentation for recreation. The platform uses GCP PostgreSQL for backend/storage, Next.js for the frontend, and provides MCP (Model Context Protocol) integration for AI agent access.

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui or Radix UI
- **State Management**: Zustand or Redux Toolkit
- **Forms**: React Hook Form with Zod validation

### Backend
- **Database**: Google Cloud SQL (PostgreSQL)
- **Auth**: NextAuth.js with SSO (SAML/OIDC)
- **Storage**: Google Cloud Storage
- **API Layer**: Next.js API Routes + tRPC (optional)
- **ORM**: Prisma or Drizzle ORM
- **MCP Server**: Custom MCP implementation for AI agent access

### Infrastructure
- **Cloud Platform**: Google Cloud Platform (GCP)
- **Deployment**: Cloud Run or Vercel with GCP backend
- **Database**: Cloud SQL PostgreSQL instance
- **Storage**: Cloud Storage buckets for agent files

## Development Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure:
# - DATABASE_URL (GCP Cloud SQL connection)
# - NEXTAUTH_URL and NEXTAUTH_SECRET
# - SSO provider credentials (SAML/OIDC)
# - GCP_PROJECT_ID, GCP_STORAGE_BUCKET
# - MCP_SERVER_PORT

# Run database migrations
npx prisma migrate dev

# Generate TypeScript types from database
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### Development
```bash
# Start development server
npm run dev

# Start MCP server
npm run mcp:dev

# Run both concurrently
npm run dev:all
```

### Testing & Quality
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run single test file
npm test -- path/to/test.spec.ts

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
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
npx prisma studio

# Deploy migrations to production
npx prisma migrate deploy
```

### MCP Server
```bash
# Start MCP server in development
npm run mcp:dev

# Build MCP server
npm run mcp:build

# Test MCP tools
npm run mcp:test
```

### Build & Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloud Run (or Vercel)
npm run deploy

# Deploy MCP server
npm run mcp:deploy
```

## Architecture Overview

### Database Schema Structure

The application follows a user-centric model with these core relationships:
- **Users** → **Profiles** (1:1) - Extended user information from SSO
- **Users** → **Agents** (1:many) - Users create multiple agents
- **Users** → **Favorites/Ratings/Downloads** (many:many with Agents) - Interaction tracking
- **Agents** → **Comments** (1:many) - Threaded discussions
- **Users** → **Collections** → **Agents** (many:many) - Curated agent lists

**Note**: The platform uses **favorites** (saves) instead of upvotes for user engagement.

### Key Application Flows

1. **Agent Upload Flow**
   - Multi-step form captures platform-agnostic agent data
   - Stores configurations as JSONB for flexibility
   - Generates unique slug for URL routing
   - Uploads files to GCS if needed
   - API routes handle validation and database insertion

2. **Discovery System**
   - Full-text search using PostgreSQL's text search capabilities
   - Faceted filtering on platform, category, ratings
   - Sorting algorithms factor in recency, popularity, and quality
   - Efficient indexing for performance

3. **Authentication Flow**
   - NextAuth.js with SSO provider (SAML/OIDC)
   - All users must authenticate via company SSO
   - Session management via JWT or database sessions
   - Middleware protects authenticated routes
   - Authorization handled in API routes and server components

4. **MCP Integration Flow**
   - MCP server exposes tools for AI agents:
     - `search_agents`: Search for agents by query, platform, category
     - `get_agent`: Get full details of a specific agent
     - `create_agent`: Add a new agent to the database
     - `list_platforms`: Get available platforms
     - `list_categories`: Get available categories
   - Authentication via MCP auth tokens
   - Rate limiting and logging for security

### Frontend Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth-required routes (all routes)
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js endpoints
│   │   ├── agents/        # Agent CRUD operations
│   │   └── mcp/           # MCP webhook endpoints (optional)
│   └── ...                # Page routes
├── components/
│   ├── agents/            # Agent-related components
│   ├── ui/                # Shadcn/ui components
│   └── layouts/           # Layout components
├── lib/
│   ├── db/                # Database client (Prisma)
│   ├── auth/              # NextAuth configuration
│   ├── gcs/               # Google Cloud Storage helpers
│   └── utils/             # Utility functions
├── mcp/                   # MCP server implementation
│   ├── server.ts          # MCP server entry point
│   ├── tools/             # MCP tool implementations
│   └── auth.ts            # MCP authentication
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── prisma/
    ├── schema.prisma      # Database schema
    └── migrations/        # Database migrations
```

### Database Configuration

Using standard PostgreSQL on GCP Cloud SQL:
- **Access Control**: Application-level authorization in API routes
- **Indexes**: B-tree and GiST indexes for full-text search
- **Cascading Deletes**: Foreign key constraints for data integrity
- **Connection Pooling**: Prisma connection pool or PgBouncer

### Storage Configuration

Google Cloud Storage for agent files:
- **Bucket Structure**: Organized by agent ID and file type
- **Access Control**: Signed URLs for temporary access
- **File Validation**: MIME type checking and size limits
- **CDN**: Cloud CDN for faster file delivery

### State Management Patterns

- **Server State**: TanStack Query (React Query) for API data
- **Client State**: Zustand for UI state (modals, filters)
- **Form State**: React Hook Form for complex forms
- **URL State**: Next.js router for shareable states

### MCP Server Architecture

The MCP server provides AI agent access to the platform:

**Available Tools**:
1. `search_agents`
   - Search agents by keywords, platform, category
   - Returns paginated results with relevance scoring

2. `get_agent`
   - Retrieve complete agent details by ID or slug
   - Includes configuration, metadata, and usage stats

3. `create_agent`
   - Add new agent to database
   - Validates required fields and platform-specific config
   - Returns created agent details

4. `list_platforms`
   - Get all supported AI platforms

5. `list_categories`
   - Get all agent categories

**Security**:
- Token-based authentication for MCP clients
- Rate limiting per client
- Audit logging of all operations
- Input validation and sanitization

## Important Considerations

### Security
- **SSO Authentication**: All access requires company SSO login
- **Input Sanitization**: All user inputs sanitized before database storage
- **File Upload Security**: Validate MIME types, implement virus scanning
- **Rate Limiting**: Apply to all API routes and MCP endpoints
- **SQL Injection**: Use Prisma's parameterized queries
- **XSS Protection**: Sanitize all rendered user content
- **MCP Security**: Token-based auth, audit logs, rate limits

### Performance
- **Pagination**: Limit 20-50 items per page with cursor-based pagination
- **Database Queries**: Use Prisma's efficient query builder, select only needed fields
- **Caching**: Implement Redis or in-memory caching for frequent queries
- **Image Optimization**: Use Next.js Image component with GCS
- **Connection Pooling**: Configure Prisma connection pool appropriately
- **Indexes**: Create appropriate indexes for search and filter queries

### Agent Data Structure
Agents store platform-specific configurations in JSONB format. Each platform has different requirements:
- **OpenAI**: Store complete assistant configuration JSON
- **Claude**: Store constitution/system prompts
- **Gemini**: Store model parameters and instructions
- **LangChain**: Store chain configuration and dependencies
- **Copilot**: Store extension settings

### GCP Setup Requirements
- **Cloud SQL Instance**: PostgreSQL 14+ with appropriate machine type
- **Cloud Storage Bucket**: With lifecycle policies for old files
- **Service Account**: With appropriate IAM roles
- **VPC Connector**: For secure database access (if using Cloud Run)
- **Secrets Manager**: Store sensitive credentials

### SSO Configuration
Configure your identity provider (IdP) with:
- **SAML 2.0** or **OIDC** endpoint
- **Allowed redirect URLs**: Include your app domain
- **User Attributes**: Email, name, groups (for authorization)
- **Session Duration**: Configure based on security requirements

### MCP Deployment
- Deploy MCP server as separate Cloud Run service or alongside Next.js
- Configure CORS for allowed AI agent origins
- Set up monitoring and logging
- Document available tools for AI agent developers
