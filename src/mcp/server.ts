#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { searchAgents, getAgent, createAgent as createAgentTool } from './tools/index.js';

// Create MCP server
const server = new Server(
  {
    name: 'ppagents-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'search_agents',
    description: 'Search for AI agents by keywords, tag, status, or category. Returns paginated results with relevance scoring.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keywords to find agents',
        },
        tag: {
          type: 'string',
          description: 'Filter by tag slug (e.g., "openai", "python", "api-integration")',
        },
        status: {
          type: 'string',
          description: 'Filter by status slug (e.g., "active", "draft", "deprecated")',
        },
        category: {
          type: 'string',
          description: 'Filter by category slug (e.g., "financial-audit", "compliance")',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (default: 20, max: 50)',
          default: 20,
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
          default: 0,
        },
      },
    },
  },
  {
    name: 'get_agent',
    description: 'Retrieve complete details of a specific agent by ID or slug, including configuration, instructions, and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Agent UUID',
        },
        slug: {
          type: 'string',
          description: 'Agent slug (human-readable identifier)',
        },
      },
      oneOf: [
        { required: ['id'] },
        { required: ['slug'] },
      ],
    },
  },
  {
    name: 'create_agent',
    description: 'Add a new AI agent to the database. Validates required fields and platform-specific configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Agent name (3-100 characters)',
        },
        description: {
          type: 'string',
          description: 'Agent description (10-1000 characters)',
        },
        platform: {
          type: 'string',
          description: 'Primary platform slug (e.g., "openai", "claude")',
        },
        category: {
          type: 'string',
          description: 'Category slug (optional)',
        },
        configuration: {
          type: 'object',
          description: 'Platform-specific configuration (JSONB)',
        },
        instructions: {
          type: 'object',
          description: 'Agent instructions (JSONB)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        markdownContent: {
          type: 'string',
          description: 'Full documentation in markdown format',
        },
      },
      required: ['name', 'description', 'platform'],
    },
  },
  {
    name: 'list_tags',
    description: 'Get a list of all available tags for categorizing agents.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_statuses',
    description: 'Get a list of all available agent statuses (e.g., draft, active, deprecated).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_categories',
    description: 'Get a list of all available agent categories.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_agents':
        return await searchAgents(args);

      case 'get_agent':
        return await getAgent(args);

      case 'create_agent':
        return await createAgentTool(args);

      case 'list_tags':
        return await import('./tools/list.js').then((m) => m.listTags());

      case 'list_statuses':
        return await import('./tools/list.js').then((m) => m.listStatuses());

      case 'list_categories':
        return await import('./tools/list.js').then((m) => m.listCategories());

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    throw error;
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PPAgents MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
