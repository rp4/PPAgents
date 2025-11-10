/**
 * Content Sanitization Utilities
 * Prevents XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize markdown content to prevent XSS attacks
 * Allows common markdown elements while removing dangerous content
 */
export function sanitizeMarkdown(input: string | null | undefined): string {
  if (!input) return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'strike', 's',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Code
      'code', 'pre',
      // Links
      'a',
      // Quotes
      'blockquote',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Misc
      'hr', 'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'class', 'id',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize plain text content
 * Removes all HTML tags and dangerous characters
 */
export function sanitizePlainText(input: string | null | undefined): string {
  if (!input) return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}


/**
 * Validate and sanitize URL
 * Ensures URLs are safe and well-formed
 */
export function sanitizeURL(input: string | null | undefined): string | null {
  if (!input) return null;

  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Reserved usernames that should not be allowed
 */
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'system', 'sys',
  'api', 'www', 'mail', 'smtp', 'ftp',
  'support', 'help', 'info', 'contact',
  'user', 'users', 'profile', 'profiles',
  'account', 'accounts', 'auth', 'login',
  'register', 'signup', 'signin', 'signout',
  'dashboard', 'settings', 'config', 'configuration',
  'null', 'undefined', 'void', 'delete',
  'select', 'insert', 'update', 'drop', 'create',
]);

/**
 * Validate username
 * Checks length, characters, and reserved words
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  // Length check
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' };
  }

  // Character check (alphanumeric, hyphen, underscore only)
  if (!/^[a-z0-9_-]+$/i.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, hyphens, and underscores',
    };
  }

  // Reserved word check
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true };
}

/**
 * Generate a safe username from email
 * Ensures uniqueness will be handled by caller
 */
export function generateSafeUsername(email: string): string {
  const baseUsername = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .substring(0, 30);

  // If too short or reserved, generate random username
  if (baseUsername.length < 3 || RESERVED_USERNAMES.has(baseUsername)) {
    return `user_${Math.random().toString(36).substring(2, 10)}`;
  }

  return baseUsername;
}
