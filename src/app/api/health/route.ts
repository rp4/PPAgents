import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

/**
 * Health check endpoint
 * Used by monitoring services and load balancers
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            environment: 'failed',
            database: 'skipped',
          },
          error: 'Missing DATABASE_URL configuration',
        },
        { status: 503 }
      )
    }

    // Check database connection with a simple query
    await prisma.$queryRaw`SELECT 1`

    const responseTime = Date.now() - startTime

    // All checks passed
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        environment: 'ok',
        database: 'ok',
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        checks: {
          environment: 'unknown',
          database: 'failed',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

// Disable caching for health checks
export const dynamic = 'force-dynamic'
export const revalidate = 0
