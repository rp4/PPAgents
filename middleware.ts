import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit, getLimiterForPath } from './src/lib/ratelimit';
import crypto from 'crypto';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Generate request ID for tracing
  const requestId = crypto.randomUUID();

  // Public paths that don't require authentication
  const publicPaths = [
    '/api/auth',
    '/auth/signin',
    '/auth/signout',
    '/auth/error',
    '/_next',
    '/favicon.ico',
  ];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Check authentication for protected routes
  if (!isPublicPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      // Redirect to sign-in page for page routes
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
      // Return 401 for API routes
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // CSRF Protection for state-changing requests
  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    request.method !== 'OPTIONS'
  ) {
    // Verify Origin header matches the request host
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    }
  }

  // Get client identifier - prefer authenticated user ID over IP
  const ip =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    '127.0.0.1';

  // Try to get user ID from NextAuth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const identifier = token?.id ? `user:${token.id}` : `ip:${ip}`;

  // Get appropriate rate limiter for this path
  const { limiter, config } = getLimiterForPath(pathname);

  // Check rate limit
  const result = await checkRateLimit(identifier, limiter, config);

  // Add rate limit headers
  const response = result.success
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );

  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

  // Enhanced security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Content Security Policy (updated for GCS and NextAuth)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://storage.googleapis.com https://lh3.googleusercontent.com https://*.googleusercontent.com blob:;
    font-src 'self' data:;
    connect-src 'self' https://storage.googleapis.com https://accounts.google.com https://vercel.live;
    frame-src 'self' https://vercel.live https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
