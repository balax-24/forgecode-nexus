/**
 * ForgeCode Standalone MCP Server
 * STDIO Transport Entry Point for TrueForge Harness
 */

import { EditorMcpServer } from './EditorMcpServer';

const workspaceRoot = process.env.FORGECODE_WORKSPACE || process.cwd();
const server = new EditorMcpServer(workspaceRoot);

process.stdin.setEncoding('utf8');

let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const request = JSON.parse(line);
      const { id, method, params } = request;

      if (method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'forgecode-editor-mcp',
              version: '1.0.0',
            },
          },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (method === 'ping') {
        const response = {
          jsonrpc: '2.0',
          id,
          result: {},
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (method === 'notifications/initialized') {
        // Notification, no reply expected
      } else if (method === 'tools/list') {
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'workspace_search',
                description: 'Search workspace code using regex or substring match',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    filePattern: { type: 'string' },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'read_file_outline',
                description: 'Read top-level class and function symbols from a file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    filePath: { type: 'string' },
                  },
                  required: ['filePath'],
                },
              },
              {
                name: 'read_file_chunk',
                description: 'Read a range of lines from a specific file',
                inputSchema: {
                  type: 'object',
                  properties: {
                    filePath: { type: 'string' },
                    startLine: { type: 'number' },
                    endLine: { type: 'number' },
                  },
                  required: ['filePath', 'startLine', 'endLine'],
                },
              },
              {
                name: 'propose_hunk_edits',
                description: 'Propose search/replace blocks for interactive review before disk write',
                inputSchema: {
                  type: 'object',
                  properties: {
                    filePath: { type: 'string' },
                    hunks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          search: { type: 'string' },
                          replace: { type: 'string' },
                        },
                        required: ['search', 'replace'],
                      },
                    },
                  },
                  required: ['filePath', 'hunks'],
                },
              },
              {
                name: 'run_terminal_command',
                description: 'Run tests or build commands in the workspace',
                inputSchema: {
                  type: 'object',
                  properties: {
                    command: { type: 'string' },
                  },
                  required: ['command'],
                },
              },
            ],
          },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (method === 'tools/call') {
        const { name, arguments: args } = params;
        let result;

        switch (name) {
          case 'workspace_search':
            result = await server.workspaceSearch(args.query, args.filePattern);
            break;
          case 'read_file_outline':
            result = await server.readFileOutline(args.filePath);
            break;
          case 'read_file_chunk':
            result = await server.readFileChunk(args.filePath, args.startLine, args.endLine);
            break;
          case 'propose_hunk_edits':
            result = await server.proposeHunkEdits(args.filePath, args.hunks);
            break;
          case 'run_terminal_command':
            result = await server.runTerminalCommand(args.command);
            break;
          default:
            result = { content: `Unknown tool: ${name}`, isError: true };
        }

        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: result.content }],
            isError: result.isError,
          },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (err: any) {
      console.error('[MCP Error]', err);
    }
  }
});
