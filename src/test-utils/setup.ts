/**
 * Test utilities and setup
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Create a fresh QueryClient for each test
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Mock fetch for API tests
 */
export function mockFetch(response: any, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      headers: new Headers(),
    })
  ) as jest.Mock
}

/**
 * Reset fetch mock
 */
export function resetFetchMock() {
  if (jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockReset()
  }
}

/**
 * Create mock session
 */
export function createMockSession(overrides = {}) {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Create mock agent data
 */
export function createMockAgent(overrides = {}) {
  return {
    id: 'test-agent-id',
    name: 'Test Agent',
    description: 'A test agent description that meets the minimum length requirement',
    slug: 'test-agent',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author_id: 'test-user-id',
    category_id: 'test-category-id',
    status_id: 'test-status-id',
    phase_id: null,
    benefit_id: null,
    ops_status_id: null,
    platforms: [],
    tags: [],
    author: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
    category: {
      id: 'test-category-id',
      name: 'Test Category',
    },
    ...overrides,
  }
}

/**
 * Create mock NextRequest for API route tests
 */
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: any
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}
) {
  const headers = new Headers(options.headers || {})

  return {
    method,
    url,
    headers,
    json: async () => options.body || {},
    cookies: {
      get: (name: string) => options.cookies?.[name] ? { value: options.cookies[name] } : undefined,
    },
  }
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
