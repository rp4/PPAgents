import { generateCSRFToken, validateCSRFToken, CSRF_COOKIE_OPTIONS, CSRF_HEADER_NAME } from '../csrf'

describe('CSRF Protection', () => {
  describe('generateCSRFToken', () => {
    it('should generate a token', () => {
      const token = generateCSRFToken()
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes as hex = 64 characters
    })

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })

    it('should generate hex tokens', () => {
      const token = generateCSRFToken()
      expect(/^[0-9a-f]+$/i.test(token)).toBe(true)
    })
  })

  describe('validateCSRFToken', () => {
    it('should validate matching tokens', () => {
      const token = generateCSRFToken()
      expect(validateCSRFToken(token, token)).toBe(true)
    })

    it('should reject non-matching tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(validateCSRFToken(token1, token2)).toBe(false)
    })

    it('should reject undefined cookie token', () => {
      const token = generateCSRFToken()
      expect(validateCSRFToken(undefined, token)).toBe(false)
    })

    it('should reject undefined header token', () => {
      const token = generateCSRFToken()
      expect(validateCSRFToken(token, undefined)).toBe(false)
    })

    it('should reject both undefined', () => {
      expect(validateCSRFToken(undefined, undefined)).toBe(false)
    })

    it('should handle different length tokens safely', () => {
      expect(validateCSRFToken('short', 'much-longer-token')).toBe(false)
    })

    it('should be timing-safe (constant time comparison)', () => {
      // This test verifies the function doesn't throw with different lengths
      const token1 = 'a'.repeat(32)
      const token2 = 'b'.repeat(64)
      expect(() => validateCSRFToken(token1, token2)).not.toThrow()
      expect(validateCSRFToken(token1, token2)).toBe(false)
    })
  })

  describe('CSRF_COOKIE_OPTIONS', () => {
    it('should have secure cookie options', () => {
      expect(CSRF_COOKIE_OPTIONS.httpOnly).toBe(true)
      expect(CSRF_COOKIE_OPTIONS.sameSite).toBe('strict')
      expect(CSRF_COOKIE_OPTIONS.path).toBe('/')
    })

    it('should use __Host- prefix for security', () => {
      expect(CSRF_COOKIE_OPTIONS.name).toBe('__Host-csrf-token')
    })

    it('should have appropriate expiry', () => {
      expect(CSRF_COOKIE_OPTIONS.maxAge).toBe(60 * 60 * 24) // 24 hours
    })

    it('should be secure in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      // Re-import to get new value
      jest.resetModules()
      const { CSRF_COOKIE_OPTIONS: prodOptions } = require('../csrf')
      expect(prodOptions.secure).toBe(true)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('CSRF_HEADER_NAME', () => {
    it('should have the correct header name', () => {
      expect(CSRF_HEADER_NAME).toBe('x-csrf-token')
    })
  })
})
