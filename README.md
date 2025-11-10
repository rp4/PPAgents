# OpenAuditSwarms

AI Agent Sharing Platform for Auditors - A centralized platform where auditors can discover, share, and implement AI agents across multiple platforms (OpenAI, Claude, Gemini, LangChain, Copilot).

## Features

- 🤖 **Platform Agnostic**: Share agents across OpenAI, Claude, Gemini, LangChain, and Copilot
- 🔍 **Advanced Search & Filtering**: Find the perfect agent for your audit needs
- 👥 **Community Driven**: Upvote, rate, and review agents from the audit community
- 📊 **User Dashboard**: Track your agents' performance and manage your uploads
- 🔐 **Secure Authentication**: Sign up/sign in with email or OAuth providers
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend (Currently Implemented)
- **Framework**: Next.js 15+ with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components inspired by shadcn/ui
- **Icons**: Lucide React

### Backend (To Be Implemented)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (for database and authentication)
- Upstash Redis account (for production rate limiting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/OpenAuditSwarms.git
cd OpenAuditSwarms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication (Required)
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# SSO Configuration (Choose your provider)
# Google Workspace
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_HD=yourcompany.com

# Azure AD
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Email Domain Restrictions (Optional but recommended)
ALLOWED_EMAIL_DOMAINS=yourcompany.com,partner.com

# Rate Limiting (Development uses in-memory, Production requires Upstash)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Error Tracking (Optional but recommended for production)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Environment
NODE_ENV=development
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Seed the database (optional):
```bash
npx prisma db seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
OpenAuditSwarms/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── browse/             # Browse agents page
│   │   ├── agents/[id]/        # Agent detail page
│   │   ├── upload/             # Upload agent page
│   │   ├── signin/             # Sign in page
│   │   ├── signup/             # Sign up page
│   │   └── dashboard/          # User dashboard
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   └── layouts/            # Layout components (Header, etc.)
│   ├── lib/
│   │   └── utils/              # Utility functions
│   └── styles/
│       └── globals.css         # Global styles with Tailwind
├── public/                     # Static assets
├── PRD.md                      # Product Requirements Document
├── CLAUDE.md                   # Development guide for Claude AI
└── package.json

```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Pages Overview

### Landing Page (`/`)
- Hero section with call-to-action
- Featured agents showcase
- Popular categories
- Platform features

### Browse Page (`/browse`)
- Search and filter agents
- Grid/list view toggle
- Category and platform filters
- Sorting options (popular, recent, highest rated)

### Agent Detail Page (`/agents/[id]`)
- Complete agent information
- Platform-specific configurations
- Sample inputs/outputs
- User reviews and ratings
- Download and upvote functionality

### Upload Page (`/upload`)
- Multi-step form wizard
- Platform configuration for each supported AI
- Documentation and sample data
- Prerequisites and setup instructions

### Authentication (`/auth/signin`)
- SSO via OAuth providers (Google, Azure AD)
- Automatic account creation on first sign-in
- Session-based authentication with NextAuth.js

## Production Deployment

### Pre-Deployment Checklist

Before deploying to production, ensure you have:

#### 1. Environment Variables Configured

**Required:**
- ✅ `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- ✅ `NEXTAUTH_URL` - Your production domain (e.g., `https://yourdomain.com`)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

**SSO Configuration (at least one):**
- ✅ Google Workspace: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_HD`
- ✅ Azure AD: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

**Rate Limiting (Required for Production):**
- ✅ `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- ✅ `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

> ⚠️ **Warning**: Without Upstash Redis configured, the app will use in-memory rate limiting, which won't work properly in serverless/distributed environments.

**Security (Recommended):**
- ✅ `ALLOWED_EMAIL_DOMAINS` - Comma-separated list of allowed email domains
- ✅ `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking

#### 2. Security Configuration

1. **Upstash Redis Setup** (Required):
   ```bash
   # Sign up at https://console.upstash.com
   # Create a new Redis database
   # Copy the REST URL and Token to your environment variables
   ```

2. **Email Domain Restrictions** (Recommended):
   ```bash
   ALLOWED_EMAIL_DOMAINS=yourcompany.com,partner.com
   ```
   This ensures only users from your organization can sign in.

3. **Verify Security Headers**:
   - Visit https://securityheaders.com after deployment
   - Ensure all headers are properly configured

#### 3. Database Migration

```bash
# Deploy migrations to production database
npx prisma migrate deploy
```

#### 4. Frontend CSRF Integration

The backend now requires CSRF tokens for all POST/PUT/PATCH/DELETE requests. Ensure your frontend includes CSRF tokens:

```typescript
// Example: Include CSRF token in fetch requests
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('__Host-csrf-token='))
  ?.split('=')[1];

fetch('/api/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken || '',
  },
  body: JSON.stringify(data),
});
```

#### 5. Testing

- [ ] Run `npm audit` and fix any vulnerabilities
- [ ] Run `npx tsc --noEmit` to check for type errors
- [ ] Test authentication flow end-to-end
- [ ] Verify CSRF protection is working
- [ ] Test rate limiting by exceeding limits
- [ ] Verify session expiration after 7 days

#### 6. Monitoring & Alerts

- [ ] Set up Sentry for error tracking
- [ ] Configure security monitoring for failed auth attempts
- [ ] Set up alerts for rate limit violations
- [ ] Monitor CSRF token validation failures

### Deployment Commands

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy (platform-specific)
# Vercel: vercel --prod
# Cloud Run: npm run deploy
```

### Security Documentation

For detailed security information, see:
- **[SECURITY.md](./SECURITY.md)** - Complete security guide and best practices
- **[SECURITY_CHANGES.md](./SECURITY_CHANGES.md)** - Recent security improvements

### Next Steps

### Additional Features
- Comment system on agents
- Agent versioning
- Export/import functionality
- API documentation
- Advanced analytics
- Email notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or feedback, please open an issue on GitHub.