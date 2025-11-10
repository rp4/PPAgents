import React from 'react'
import { render, screen } from '@testing-library/react'
import { AgentCard } from '../AgentCard'
import type { AgentWithRelations } from '@/types/database'

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('AgentCard Component', () => {
  const mockAgent: AgentWithRelations = {
    id: 'agent-1',
    name: 'Test Agent',
    slug: 'test-agent',
    description: 'This is a test agent description',
    is_public: true,
    is_featured: false,
    created_at: new Date('2024-01-01').toISOString(),
    updated_at: new Date('2024-01-01').toISOString(),
    user_id: 'user-1',
    category_id: 'cat-1',
    status_id: 'status-1',
    phase_id: null,
    benefit_id: null,
    ops_status_id: null,
    favorites_count: 5,
    downloads_count: 10,
    avg_rating: 4.5,
    agent_platforms: [
      {
        platform_id: 'platform-1',
        platform: {
          id: 'platform-1',
          name: 'OpenAI',
          slug: 'openai',
        },
      },
    ],
    category: {
      id: 'cat-1',
      name: 'Automation',
      slug: 'automation',
    },
    agentTags: [
      {
        tag: {
          id: 'tag-1',
          name: 'AI',
          slug: 'ai',
          color: '#3b82f6',
        },
      },
      {
        tag: {
          id: 'tag-2',
          name: 'Productivity',
          slug: 'productivity',
          color: null,
        },
      },
    ],
    profile: {
      id: 'profile-1',
      username: 'testuser',
      full_name: 'Test User',
      avatar_url: null,
    },
  } as any

  it('should render agent name', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('Test Agent')).toBeInTheDocument()
  })

  it('should render agent description', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('This is a test agent description')).toBeInTheDocument()
  })

  it('should render platforms', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
  })

  it('should render category', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('Automation')).toBeInTheDocument()
  })

  it('should render tags', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('#AI')).toBeInTheDocument()
    expect(screen.getByText('#Productivity')).toBeInTheDocument()
  })

  it('should render author information when showAuthor is true', () => {
    render(<AgentCard agent={mockAgent} showAuthor={true} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('should not render author information when showAuthor is false', () => {
    render(<AgentCard agent={mockAgent} showAuthor={false} />)
    expect(screen.queryByText('Test User')).not.toBeInTheDocument()
  })

  it('should render favorites count', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render featured badge when agent is featured', () => {
    const featuredAgent = { ...mockAgent, is_featured: true }
    render(<AgentCard agent={featuredAgent} />)
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('should not render featured badge when agent is not featured', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.queryByText('Featured')).not.toBeInTheDocument()
  })

  it('should render link to agent detail page', () => {
    render(<AgentCard agent={mockAgent} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/agents/test-agent')
  })

  it('should render author avatar when available', () => {
    const agentWithAvatar = {
      ...mockAgent,
      profile: {
        ...mockAgent.profile,
        avatar_url: 'https://example.com/avatar.jpg',
      },
    }
    render(<AgentCard agent={agentWithAvatar as any} />)
    const avatar = screen.getByAltText('Test User')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should render initials when avatar is not available', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('T')).toBeInTheDocument() // First letter of username
  })

  it('should limit displayed tags to 3', () => {
    const agentWithManyTags = {
      ...mockAgent,
      agentTags: [
        { tag: { id: 'tag-1', name: 'AI', slug: 'ai', color: null } },
        { tag: { id: 'tag-2', name: 'ML', slug: 'ml', color: null } },
        { tag: { id: 'tag-3', name: 'NLP', slug: 'nlp', color: null } },
        { tag: { id: 'tag-4', name: 'CV', slug: 'cv', color: null } },
        { tag: { id: 'tag-5', name: 'RL', slug: 'rl', color: null } },
      ],
    }
    render(<AgentCard agent={agentWithManyTags as any} />)
    expect(screen.getByText('+2 more')).toBeInTheDocument()
  })

  it('should handle agent without category', () => {
    const agentWithoutCategory = { ...mockAgent, category: null }
    render(<AgentCard agent={agentWithoutCategory as any} />)
    expect(screen.queryByText('Automation')).not.toBeInTheDocument()
  })

  it('should handle agent without tags', () => {
    const agentWithoutTags = { ...mockAgent, agentTags: [] }
    render(<AgentCard agent={agentWithoutTags as any} />)
    expect(screen.queryByText(/#/)).not.toBeInTheDocument()
  })

  it('should handle agent without platforms', () => {
    const agentWithoutPlatforms = { ...mockAgent, agent_platforms: [] }
    render(<AgentCard agent={agentWithoutPlatforms as any} />)
    expect(screen.queryByText('OpenAI')).not.toBeInTheDocument()
  })

  it('should show 0 favorites when count is null', () => {
    const agentWithNoFavorites = { ...mockAgent, favorites_count: null }
    render(<AgentCard agent={agentWithNoFavorites as any} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should use full_name if available, otherwise username', () => {
    const agentWithoutFullName = {
      ...mockAgent,
      profile: {
        ...mockAgent.profile,
        full_name: null,
      },
    }
    render(<AgentCard agent={agentWithoutFullName as any} />)
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('should apply tag colors when available', () => {
    render(<AgentCard agent={mockAgent} />)
    const aiTag = screen.getByText('#AI')
    expect(aiTag).toHaveStyle({ color: '#3b82f6' })
  })
})
