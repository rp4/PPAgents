import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth, AuthProvider } from '../useAuth'
import { useSession, signIn, signOut } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('useAuth Hook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    jest.clearAllMocks()

    // Setup default fetch mock
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )

  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    console.error = originalError
  })

  it('should return loading state initially', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('should return user when authenticated', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'avatar.jpg',
      },
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: 'avatar.jpg',
    })
  })

  it('should fetch profile when user is authenticated', async () => {
    const mockProfile = {
      id: 'profile-123',
      username: 'testuser',
      fullName: 'Test User',
      bio: 'Test bio',
      avatarUrl: 'avatar.jpg',
      website: 'https://example.com',
      githubUrl: null,
      linkedinUrl: null,
      reputationScore: 100,
      isVerified: false,
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => mockProfile,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123/profile')
  })

  it('should return null user when not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('should handle signIn', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await result.current.signIn()

    expect(signIn).toHaveBeenCalled()
  })

  it('should handle signOut and clear queries', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    })

    const clearSpy = jest.spyOn(queryClient, 'clear')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await result.current.signOut()

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    expect(clearSpy).toHaveBeenCalled()
  })

  it('should invalidate queries when auth status changes', async () => {
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agents'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['platforms'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] })
    })
  })

  it('should handle profile fetch errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    })

    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch profile:',
        expect.any(Error)
      )
    })

    expect(result.current.profile).toBeNull()

    consoleErrorSpy.mockRestore()
  })

  it('should clear profile when user signs out', async () => {
    const mockProfile = {
      id: 'profile-123',
      username: 'testuser',
      fullName: 'Test User',
      bio: null,
      avatarUrl: null,
      website: null,
      githubUrl: null,
      linkedinUrl: null,
      reputationScore: 0,
      isVerified: false,
    }

    // Start authenticated
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => mockProfile,
    })

    const { result, rerender } = renderHook(() => useAuth(), { wrapper })

    // Wait for profile to load
    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile)
    })

    // Sign out
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    rerender()

    // Profile should be cleared
    await waitFor(() => {
      expect(result.current.profile).toBeNull()
    })
  })
})
