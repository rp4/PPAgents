import { checkRateLimit, getLimiterForPath, RATE_LIMITS } from '../ratelimit'

// Mock Upstash
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn(),
}))

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}))

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set test environment
    process.env.NODE_ENV = 'test'
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  describe('RATE_LIMITS configuration', () => {
    it('should have AUTH limits', () => {
      expect(RATE_LIMITS.AUTH).toEqual({
        maxRequests: 5,
        windowMs: 60000,
      })
    })

    it('should have MUTATION limits', () => {
      expect(RATE_LIMITS.MUTATION).toEqual({
        maxRequests: 20,
        windowMs: 60000,
      })
    })

    it('should have API limits', () => {
      expect(RATE_LIMITS.API).toEqual({
        maxRequests: 100,
        windowMs: 60000,
      })
    })

    it('should have UPLOAD limits', () => {
      expect(RATE_LIMITS.UPLOAD).toEqual({
        maxRequests: 10,
        windowMs: 300000,
      })
    })
  })

  describe('checkRateLimit with fallback limiter', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('test-id', null, RATE_LIMITS.API)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(RATE_LIMITS.API.maxRequests)
      expect(result.remaining).toBe(RATE_LIMITS.API.maxRequests - 1)
    })

    it('should track multiple requests from same identifier', async () => {
      const identifier = 'test-user-1'

      const result1 = await checkRateLimit(identifier, null, RATE_LIMITS.API)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(RATE_LIMITS.API.maxRequests - 1)

      const result2 = await checkRateLimit(identifier, null, RATE_LIMITS.API)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(RATE_LIMITS.API.maxRequests - 2)
    })

    it('should enforce rate limits', async () => {
      const identifier = 'test-user-2'
      const config = { maxRequests: 3, windowMs: 60000 }

      // Make requests up to limit
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(identifier, null, config)
        expect(result.success).toBe(true)
      }

      // Next request should be rate limited
      const result = await checkRateLimit(identifier, null, config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const identifier = 'test-user-3'
      const config = { maxRequests: 2, windowMs: 100 } // 100ms window

      // Use up the limit
      await checkRateLimit(identifier, null, config)
      await checkRateLimit(identifier, null, config)

      const rateLimitedResult = await checkRateLimit(identifier, null, config)
      expect(rateLimitedResult.success).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const result = await checkRateLimit(identifier, null, config)
      expect(result.success).toBe(true)
    })

    it('should handle different identifiers independently', async () => {
      const config = { maxRequests: 2, windowMs: 60000 }

      const result1 = await checkRateLimit('user-1', null, config)
      const result2 = await checkRateLimit('user-2', null, config)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.remaining).toBe(1)
      expect(result2.remaining).toBe(1)
    })
  })

  describe('getLimiterForPath', () => {
    it('should return AUTH limiter for auth paths', () => {
      const result1 = getLimiterForPath('/api/auth/signin')
      expect(result1.config).toEqual(RATE_LIMITS.AUTH)

      const result2 = getLimiterForPath('/auth/callback')
      expect(result2.config).toEqual(RATE_LIMITS.AUTH)
    })

    it('should return UPLOAD limiter for upload paths', () => {
      const result1 = getLimiterForPath('/api/upload')
      expect(result1.config).toEqual(RATE_LIMITS.UPLOAD)

      const result2 = getLimiterForPath('/api/storage/upload')
      expect(result2.config).toEqual(RATE_LIMITS.UPLOAD)
    })

    it('should return MUTATION limiter for mutation paths', () => {
      const result1 = getLimiterForPath('/api/agents/POST')
      expect(result1.config).toEqual(RATE_LIMITS.MUTATION)

      const result2 = getLimiterForPath('/api/agents/PUT')
      expect(result2.config).toEqual(RATE_LIMITS.MUTATION)

      const result3 = getLimiterForPath('/api/agents/DELETE')
      expect(result3.config).toEqual(RATE_LIMITS.MUTATION)
    })

    it('should return API limiter for general API paths', () => {
      const result1 = getLimiterForPath('/api/agents')
      expect(result1.config).toEqual(RATE_LIMITS.API)

      const result2 = getLimiterForPath('/api/categories')
      expect(result2.config).toEqual(RATE_LIMITS.API)

      const result3 = getLimiterForPath('/api/tags')
      expect(result3.config).toEqual(RATE_LIMITS.API)
    })

    it('should return API limiter for unknown paths', () => {
      const result = getLimiterForPath('/some/random/path')
      expect(result.config).toEqual(RATE_LIMITS.API)
    })
  })

  describe('In-memory limiter cleanup', () => {
    it('should include reset time in response', async () => {
      const result = await checkRateLimit('test-id', null, RATE_LIMITS.API)
      expect(result.reset).toBeGreaterThan(Date.now())
      expect(result.reset).toBeLessThan(Date.now() + RATE_LIMITS.API.windowMs + 1000)
    })
  })
})
