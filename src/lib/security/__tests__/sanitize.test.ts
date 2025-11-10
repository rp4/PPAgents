import {
  sanitizeMarkdown,
  sanitizePlainText,
  sanitizeURL,
  validateUsername,
  generateSafeUsername,
} from '../sanitize'

describe('Content Sanitization', () => {
  describe('sanitizeMarkdown', () => {
    it('should allow safe markdown elements', () => {
      const input = '<p>Test <strong>bold</strong> and <em>italic</em></p>'
      const result = sanitizeMarkdown(input)
      expect(result).toContain('strong')
      expect(result).toContain('em')
    })

    it('should remove script tags', () => {
      const input = '<p>Safe content</p><script>alert("xss")</script>'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('script')
      expect(result).not.toContain('alert')
    })

    it('should remove event handlers', () => {
      const input = '<p onclick="malicious()">Click me</p>'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('malicious')
    })

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('javascript:')
    })

    it('should allow safe links', () => {
      const input = '<a href="https://example.com">Link</a>'
      const result = sanitizeMarkdown(input)
      expect(result).toContain('href')
      expect(result).toContain('https://example.com')
    })

    it('should handle null input', () => {
      expect(sanitizeMarkdown(null)).toBe('')
    })

    it('should handle undefined input', () => {
      expect(sanitizeMarkdown(undefined)).toBe('')
    })

    it('should handle empty string', () => {
      expect(sanitizeMarkdown('')).toBe('')
    })

    it('should allow code blocks', () => {
      const input = '<pre><code>const x = 1;</code></pre>'
      const result = sanitizeMarkdown(input)
      expect(result).toContain('code')
      expect(result).toContain('pre')
    })

    it('should allow tables', () => {
      const input = '<table><tr><td>Cell</td></tr></table>'
      const result = sanitizeMarkdown(input)
      expect(result).toContain('table')
      expect(result).toContain('td')
    })

    it('should remove style tags', () => {
      const input = '<style>body { background: red; }</style><p>Content</p>'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('style')
      expect(result).toContain('Content')
    })
  })

  describe('sanitizePlainText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Text with <strong>HTML</strong></p>'
      const result = sanitizePlainText(input)
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
      expect(result).toContain('Text with')
      expect(result).toContain('HTML')
    })

    it('should remove script tags and content', () => {
      const input = 'Safe text<script>alert("xss")</script>'
      const result = sanitizePlainText(input)
      expect(result).not.toContain('script')
      expect(result).not.toContain('alert')
    })

    it('should handle null input', () => {
      expect(sanitizePlainText(null)).toBe('')
    })

    it('should handle undefined input', () => {
      expect(sanitizePlainText(undefined)).toBe('')
    })

    it('should preserve plain text', () => {
      const input = 'Just plain text'
      const result = sanitizePlainText(input)
      expect(result).toBe(input)
    })
  })

  describe('sanitizeURL', () => {
    it('should allow https URLs', () => {
      const input = 'https://example.com/path'
      const result = sanitizeURL(input)
      expect(result).toBe(input)
    })

    it('should allow http URLs', () => {
      const input = 'http://example.com/path'
      const result = sanitizeURL(input)
      expect(result).toBe(input)
    })

    it('should reject javascript: protocol', () => {
      const input = 'javascript:alert(1)'
      const result = sanitizeURL(input)
      expect(result).toBeNull()
    })

    it('should reject data: protocol', () => {
      const input = 'data:text/html,<script>alert(1)</script>'
      const result = sanitizeURL(input)
      expect(result).toBeNull()
    })

    it('should reject file: protocol', () => {
      const input = 'file:///etc/passwd'
      const result = sanitizeURL(input)
      expect(result).toBeNull()
    })

    it('should handle malformed URLs', () => {
      const input = 'not-a-valid-url'
      const result = sanitizeURL(input)
      expect(result).toBeNull()
    })

    it('should handle null input', () => {
      expect(sanitizeURL(null)).toBeNull()
    })

    it('should handle undefined input', () => {
      expect(sanitizeURL(undefined)).toBeNull()
    })

    it('should handle empty string', () => {
      expect(sanitizeURL('')).toBeNull()
    })
  })

  describe('validateUsername', () => {
    it('should accept valid username', () => {
      const result = validateUsername('john_doe')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept username with numbers', () => {
      const result = validateUsername('user123')
      expect(result.valid).toBe(true)
    })

    it('should accept username with hyphens', () => {
      const result = validateUsername('john-doe')
      expect(result.valid).toBe(true)
    })

    it('should reject username too short', () => {
      const result = validateUsername('ab')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least 3 characters')
    })

    it('should reject username too long', () => {
      const result = validateUsername('a'.repeat(31))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at most 30 characters')
    })

    it('should reject username with spaces', () => {
      const result = validateUsername('john doe')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('letters, numbers, hyphens, and underscores')
    })

    it('should reject username with special characters', () => {
      const result = validateUsername('john@doe')
      expect(result.valid).toBe(false)
    })

    it('should reject reserved username - admin', () => {
      const result = validateUsername('admin')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('reserved')
    })

    it('should reject reserved username - root', () => {
      const result = validateUsername('root')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('reserved')
    })

    it('should reject reserved username - system', () => {
      const result = validateUsername('system')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('reserved')
    })

    it('should reject SQL keywords', () => {
      expect(validateUsername('select').valid).toBe(false)
      expect(validateUsername('delete').valid).toBe(false)
      expect(validateUsername('drop').valid).toBe(false)
    })

    it('should be case-insensitive for reserved words', () => {
      expect(validateUsername('ADMIN').valid).toBe(false)
      expect(validateUsername('Admin').valid).toBe(false)
    })
  })

  describe('generateSafeUsername', () => {
    it('should generate username from email', () => {
      const result = generateSafeUsername('john.doe@example.com')
      expect(result).toBe('johndoe')
    })

    it('should remove special characters', () => {
      const result = generateSafeUsername('john+test@example.com')
      expect(result).toBe('johntest')
    })

    it('should convert to lowercase', () => {
      const result = generateSafeUsername('JohnDoe@example.com')
      expect(result).toBe('johndoe')
    })

    it('should truncate to 30 characters', () => {
      const result = generateSafeUsername('verylongemailaddressthatshouldbetruncated@example.com')
      expect(result.length).toBeLessThanOrEqual(30)
    })

    it('should generate random username for reserved words', () => {
      const result = generateSafeUsername('admin@example.com')
      expect(result).toMatch(/^user_[a-z0-9]+$/)
      expect(result).not.toBe('admin')
    })

    it('should generate random username for short emails', () => {
      const result = generateSafeUsername('ab@example.com')
      expect(result).toMatch(/^user_[a-z0-9]+$/)
    })

    it('should handle emails with numbers', () => {
      const result = generateSafeUsername('user123@example.com')
      expect(result).toBe('user123')
    })

    it('should preserve hyphens and underscores', () => {
      const result = generateSafeUsername('john_doe-test@example.com')
      expect(result).toBe('john_doe-test')
    })
  })
})
