/**
 * CSRF Token Hook
 * Provides access to CSRF token for secure API requests
 */

import { useEffect, useState } from 'react';

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side
  }

  const cookieName = '__Host-csrf-token=';
  const cookies = document.cookie.split('; ');
  const csrfCookie = cookies.find(row => row.startsWith(cookieName));

  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

/**
 * Hook to access CSRF token
 * Returns the current CSRF token from cookie
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get initial token
    setToken(getCsrfTokenFromCookie());

    // Optional: Watch for token changes
    // This is useful if the token gets refreshed during the session
    const interval = setInterval(() => {
      const currentToken = getCsrfTokenFromCookie();
      setToken(currentToken);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return token;
}

/**
 * Direct function to get CSRF token (for use outside React components)
 */
export function getCsrfToken(): string | null {
  return getCsrfTokenFromCookie();
}
