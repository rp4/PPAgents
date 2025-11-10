import { getAgents, type AgentFilters, type AgentSort } from '../agents'
import { prisma } from '../client'

// Mock Prisma client
jest.mock('../client', () => ({
  prisma: {
    agent: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('Database - Agents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockAgents = [
    {
      id: 'agent-1',
      name: 'Test Agent 1',
      slug: 'test-agent-1',
      description: 'Description 1',
      isPublic: true,
      userId: 'user-1',
      categoryId: 'cat-1',
      createdAt: new Date('2024-01-01'),
      avgRating: 4.5,
      downloadsCount: 10,
      favoritesCount: 5,
    },
    {
      id: 'agent-2',
      name: 'Test Agent 2',
      slug: 'test-agent-2',
      description: 'Description 2',
      isPublic: true,
      userId: 'user-2',
      categoryId: 'cat-2',
      createdAt: new Date('2024-01-02'),
      avgRating: 3.5,
      downloadsCount: 20,
      favoritesCount: 8,
    },
  ]

  describe('getAgents', () => {
    it('should fetch agents with default parameters', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue(mockAgents)
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(2)

      const result = await getAgents({})

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        })
      )
      expect(prisma.agent.count).toHaveBeenCalledWith({
        where: { isPublic: true },
      })
    })

    it('should apply search filter', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      const filters: AgentFilters = { search: 'test query' }
      await getAgents({ filters })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'test query', mode: 'insensitive' } },
              { description: { contains: 'test query', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })

    it('should apply category filter', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      const filters: AgentFilters = { category: 'automation' }
      await getAgents({ filters })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 'automation' },
          }),
        })
      )
    })

    it('should apply tags filter', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      const filters: AgentFilters = { tags: ['ai', 'ml'] }
      await getAgents({ filters })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agentTags: {
              some: {
                tag: {
                  slug: { in: ['ai', 'ml'] },
                },
              },
            },
          }),
        })
      )
    })

    it('should apply statuses filter', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      const filters: AgentFilters = { statuses: ['published', 'draft'] }
      await getAgents({ filters })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { slug: { in: ['published', 'draft'] } },
          }),
        })
      )
    })

    it('should apply userId filter', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      const filters: AgentFilters = { userId: 'user-123' }
      await getAgents({ filters })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      )
    })

    it('should apply custom sort', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      const sort: AgentSort = { field: 'avgRating', order: 'desc' }
      await getAgents({ sort })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { avgRating: 'desc' },
        })
      )
    })

    it('should enforce maximum limit', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      await getAgents({ limit: 200 })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // MAX_LIMIT
        })
      )
    })

    it('should enforce minimum limit', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      await getAgents({ limit: -5 })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      )
    })

    it('should enforce minimum offset', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      await getAgents({ offset: -10 })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      )
    })

    it('should apply pagination', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      await getAgents({ limit: 10, offset: 20 })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      )
    })

    it('should combine multiple filters', async () => {
      ;(prisma.agent.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.agent.count as jest.Mock).mockResolvedValue(0)

      const filters: AgentFilters = {
        search: 'automation',
        category: 'productivity',
        tags: ['ai'],
        statuses: ['published'],
      }

      await getAgents({ filters })

      expect(prisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublic: true,
            OR: expect.any(Array),
            category: { slug: 'productivity' },
            status: { slug: { in: ['published'] } },
            agentTags: expect.any(Object),
          }),
        })
      )
    })
  })
})
