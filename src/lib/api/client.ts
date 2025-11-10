/**
 * Secure API Client
 * Fetch wrapper with automatic CSRF token inclusion
 */

import { getCsrfToken } from '@/hooks/useCsrfToken';

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Secure fetch wrapper that automatically includes CSRF token
 * for state-changing requests (POST, PUT, PATCH, DELETE)
 */
export async function secureFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // Build headers
  const headers = new Headers(options.headers);

  // Add CSRF token for state-changing requests
  if (isStateChanging) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('x-csrf-token', csrfToken);
    } else {
      console.warn('CSRF token not found. Request may be rejected.');
    }
  }

  // Ensure Content-Type is set for JSON payloads
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Make the request
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * API client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: async <T = any>(url: string, options?: FetchOptions): Promise<T> => {
    const response = await secureFetch(url, {
      ...options,
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * POST request
   */
  post: async <T = any>(
    url: string,
    data?: any,
    options?: FetchOptions
  ): Promise<T> => {
    const response = await secureFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * PUT request
   */
  put: async <T = any>(
    url: string,
    data?: any,
    options?: FetchOptions
  ): Promise<T> => {
    const response = await secureFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(
    url: string,
    data?: any,
    options?: FetchOptions
  ): Promise<T> => {
    const response = await secureFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(url: string, options?: FetchOptions): Promise<T> => {
    const response = await secureFetch(url, {
      ...options,
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
  },
};

/**
 * Type-safe API client for specific endpoints
 */
export const api = {
  agents: {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiClient.get(`/api/agents${query}`);
    },
    get: (id: string) => apiClient.get(`/api/agents/${id}`),
    create: (data: any) => apiClient.post('/api/agents', data),
    update: (id: string, data: any) => apiClient.patch(`/api/agents/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/agents/${id}`),
    favorite: (id: string) => apiClient.post(`/api/agents/${id}/favorite`),
    rate: (id: string, data: { score: number; review?: string }) =>
      apiClient.post(`/api/agents/${id}/rate`, data),
  },
  comments: {
    list: (agentId: string) => apiClient.get(`/api/agents/${agentId}/comments`),
    create: (agentId: string, data: { content: string; parentId?: string }) =>
      apiClient.post(`/api/agents/${agentId}/comments`, data),
  },
  profiles: {
    get: (username: string) => apiClient.get(`/api/profiles/${username}`),
    agents: (username: string) =>
      apiClient.get(`/api/profiles/${username}/agents`),
    favorites: (username: string) =>
      apiClient.get(`/api/profiles/${username}/favorites`),
  },
};
