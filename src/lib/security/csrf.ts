/**
 * CSRF Protection
 * Double-submit cookie pattern for CSRF protection
 */

import crypto from 'crypto';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token using double-submit cookie pattern
 */
export function validateCSRFToken(
  cookieToken: string | undefined,
  headerToken: string | undefined
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    // If lengths don't match, timingSafeEqual throws
    return false;
  }
}

/**
 * Cookie options for CSRF token
 * Using __Host- prefix requires: secure=true, path='/', and no domain
 * This ensures the cookie is only sent over HTTPS and bound to the exact host
 */
export const CSRF_COOKIE_OPTIONS = {
  name: '__Host-csrf-token',
  httpOnly: true,
  secure: true, // Always secure for __Host- prefix (even in dev, HTTPS required)
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 24 hours
};

/**
 * Header name for CSRF token
 */
export const CSRF_HEADER_NAME = 'x-csrf-token';
