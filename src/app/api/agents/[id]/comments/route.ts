import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { sanitizePlainText } from '@/lib/security/sanitize'
import { logger, logError } from '@/lib/security/logger'

// GET /api/agents/[id]/comments - Fetch comments for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch comments with user profile information
    const comments = await prisma.comment.findMany({
      where: {
        agentId: id,
        isDeleted: false,
        parentId: null, // Only fetch top-level comments for now
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        replies: {
          where: {
            isDeleted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the data to match the expected format
    const transformedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.createdAt.toISOString(),
      updated_at: comment.updatedAt.toISOString(),
      is_edited: comment.isEdited,
      profile: {
        id: comment.user.id,
        username: comment.user.username,
        full_name: comment.user.fullName,
        avatar_url: comment.user.avatarUrl,
      },
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        created_at: reply.createdAt.toISOString(),
        updated_at: reply.updatedAt.toISOString(),
        is_edited: reply.isEdited,
        profile: {
          id: reply.user.id,
          username: reply.user.username,
          full_name: reply.user.fullName,
          avatar_url: reply.user.avatarUrl,
        },
      })),
    }))

    return NextResponse.json(transformedComments)
  } catch (error: any) {
    logError(error, { action: 'fetch_comments', agentId: (await params).id })
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/agents/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params
    const body = await request.json()
    const { content, parentId } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Verify parent comment exists if provided
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment || parentComment.agentId !== agentId) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        )
      }
    }

    // Sanitize comment content to prevent XSS
    const sanitizedContent = sanitizePlainText(content.trim());

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        userId: session.user.id,
        agentId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Transform response
    const transformedComment = {
      id: comment.id,
      content: comment.content,
      created_at: comment.createdAt.toISOString(),
      updated_at: comment.updatedAt.toISOString(),
      is_edited: comment.isEdited,
      profile: {
        id: comment.user.id,
        username: comment.user.username,
        full_name: comment.user.fullName,
        avatar_url: comment.user.avatarUrl,
      },
    }

    return NextResponse.json(transformedComment, { status: 201 })
  } catch (error: any) {
    logError(error, { action: 'create_comment', agentId: (await params).id, userId: session?.user?.id })
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
