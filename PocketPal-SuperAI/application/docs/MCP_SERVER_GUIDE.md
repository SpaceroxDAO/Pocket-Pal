# PocketPal MCP Server Development Guide

This guide explains how to create MCP (Model Context Protocol) servers that are compatible with PocketPal's implementation.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Server Architecture](#server-architecture)
- [Step-by-Step Implementation](#step-by-step-implementation)
- [Protocol Specification](#protocol-specification)
- [Testing Your Server](#testing-your-server)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

PocketPal uses **WebSocket-based MCP servers** that implement a JSON-RPC 2.0 protocol for tool calling. This allows the AI to access external data and functionality through standardized tool interfaces.

### Key Concepts

**MCP Server** - A WebSocket server that exposes tools (functions) that the AI can call
**Tool** - A function with a name, description, and input schema
**JSON-RPC** - The message format used for communication
**WebSocket** - The transport layer (not stdio)

---

## Requirements

### ✅ **MUST USE: WebSocket Transport**

PocketPal **only supports WebSocket MCP servers**. Stdio-based servers will NOT work.

```javascript
// ✅ CORRECT - WebSocket
import { WebSocketServer } from 'ws';
const server = new WebSocketServer({ port: 3002 });

// ❌ WRONG - Stdio (NOT supported by PocketPal)
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

### Dependencies

```json
{
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

### Node.js Version

- Node.js v18+ recommended
- ES modules (`"type": "module"` in package.json)

---

## Server Architecture

### Basic Structure

```
MCP Server
├── WebSocket Server (listens on a port)
├── Message Handler (processes JSON-RPC messages)
├── Tool Definitions (describes available functions)
└── Tool Implementations (executes the functions)
```

### Communication Flow

```
PocketPal → [WebSocket] → MCP Server
    ↓
Initialize handshake
    ↓
List available tools
    ↓
Call tool with arguments
    ↓
Return results
```

---

## Step-by-Step Implementation

### 1. Create Project Structure

```bash
mkdir mcp-your-server
cd mcp-your-server
npm init -y
npm install ws
```

**package.json:**
```json
{
  "name": "mcp-your-server",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

### 2. Create WebSocket Server

**server.js:**
```javascript
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3002;
const server = new WebSocketServer({ port: PORT }, () => {
  console.log(`[MCP] Server listening on ws://localhost:${PORT}`);
});

server.on('connection', (ws) => {
  console.log('[MCP] Client connected');

  ws.on('message', async (data) => {
    // Handle messages here
  });

  ws.on('close', () => {
    console.log('[MCP] Client disconnected');
  });
});
```

### 3. Define Your Tools

```javascript
const tools = [
  {
    name: 'yourToolName',
    description: 'What this tool does (be descriptive for the AI)',
    inputSchema: {
      type: 'object',
      properties: {
        paramName: {
          type: 'string',
          description: 'What this parameter is for'
        }
      },
      required: ['paramName']
    }
  }
];
```

### 4. Implement Message Handler

```javascript
function send(ws, payload) {
  ws.send(JSON.stringify(payload));
}

ws.on('message', async (data) => {
  let message;
  try {
    message = JSON.parse(data.toString());
  } catch (err) {
    console.error('[MCP] Invalid JSON:', err);
    return;
  }

  const { id, method, params } = message;

  const replyError = (code, messageText) => {
    if (id === undefined) return;
    send(ws, {
      jsonrpc: '2.0',
      id,
      error: { code, message: messageText }
    });
  };

  try {
    switch (method) {
      case 'initialize': {
        send(ws, {
          jsonrpc: '2.0',
          id,
          result: {
            capabilities: { tools: {} },
            serverInfo: { name: 'Your Server Name', version: '1.0.0' }
          }
        });
        break;
      }

      case 'tools/list': {
        send(ws, {
          jsonrpc: '2.0',
          id,
          result: { tools }
        });
        break;
      }

      case 'tools/call': {
        const { name, arguments: args = {} } = params || {};

        if (name === 'yourToolName') {
          try {
            // Execute your tool logic here
            const result = await yourToolFunction(args);

            send(ws, {
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: result
                  }
                ]
              }
            });
          } catch (err) {
            replyError(-32000, err.message || 'Tool execution failed');
          }
          break;
        }

        replyError(-32601, `Unknown tool: ${name}`);
        break;
      }

      case 'notifications/initialized': {
        // Notification, no response needed
        break;
      }

      case 'telemetry/ping': {
        send(ws, {
          jsonrpc: '2.0',
          id,
          result: { ok: true }
        });
        break;
      }

      default: {
        console.warn('[MCP] Unknown method:', method);
        replyError(-32601, `Unknown method: ${method}`);
      }
    }
  } catch (err) {
    console.error('[MCP] Handler error:', err);
    replyError(-32603, err.message || 'Internal error');
  }
});
```

### 5. Implement Tool Function

```javascript
async function yourToolFunction(args) {
  // Validate arguments
  if (!args.paramName) {
    throw new Error('paramName is required');
  }

  // Execute your logic
  const result = `Processed: ${args.paramName}`;

  // Return formatted result (markdown supported)
  return result;
}
```

---

## Protocol Specification

### Required Methods

#### 1. `initialize`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "0.1.0",
    "clientInfo": {
      "name": "PocketPal",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "Your Server Name",
      "version": "1.0.0"
    }
  }
}
```

#### 2. `tools/list`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "toolName",
        "description": "Tool description",
        "inputSchema": {
          "type": "object",
          "properties": {
            "param": {
              "type": "string",
              "description": "Parameter description"
            }
          },
          "required": ["param"]
        }
      }
    ]
  }
}
```

#### 3. `tools/call`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "toolName",
    "arguments": {
      "param": "value"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Tool result here"
      }
    ]
  }
}
```

#### 4. `notifications/initialized` (optional)

**Notification (no response):**
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

#### 5. `telemetry/ping` (optional)

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "telemetry/ping"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "ok": true
  }
}
```

### Error Responses

**Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32602,
    "message": "Invalid parameters"
  }
}
```

**Standard Error Codes:**
- `-32700` - Parse error
- `-32600` - Invalid request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error
- `-32000` - Custom application error

---

## Testing Your Server

### 1. Start the Server

```bash
node server.js
```

You should see:
```
[MCP] Server listening on ws://localhost:3002
```

### 2. Add to PocketPal

1. Open PocketPal
2. Go to **Settings → MCP Servers**
3. Tap **Add Server**
4. Enter:
   - **Name:** Your Server Name
   - **URL:** `ws://localhost:3002`
5. Tap **Save**

### 3. Test in Chat

1. Start a new chat
2. Tap model picker → **MCP** tab
3. Select your server
4. Go to **Tools** tab
5. Enable your tool(s)
6. Ask the AI to use your tool:
   - "Use the yourToolName tool with paramName = test"

### 4. Check Logs

Your server should log:
```
[MCP] Client connected
[MCP] Received message: initialize
[MCP] Received message: tools/list
[MCP] Received message: tools/call
```

---

## Examples

### Example 1: Simple Echo Server

```javascript
import { WebSocketServer } from 'ws';

const PORT = 3000;
const server = new WebSocketServer({ port: PORT }, () => {
  console.log(`[Echo] Server on ws://localhost:${PORT}`);
});

function send(ws, payload) {
  ws.send(JSON.stringify(payload));
}

const tools = [
  {
    name: 'echo',
    description: 'Echoes back the provided text',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to echo back'
        }
      },
      required: ['text']
    }
  }
];

server.on('connection', (ws) => {
  console.log('[Echo] Client connected');

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    const { id, method, params } = message;

    switch (method) {
      case 'initialize':
        send(ws, {
          jsonrpc: '2.0',
          id,
          result: {
            capabilities: { tools: {} },
            serverInfo: { name: 'Echo Server', version: '1.0.0' }
          }
        });
        break;

      case 'tools/list':
        send(ws, { jsonrpc: '2.0', id, result: { tools } });
        break;

      case 'tools/call':
        if (params.name === 'echo') {
          send(ws, {
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: params.arguments.text }]
            }
          });
        }
        break;

      case 'notifications/initialized':
        break;

      case 'telemetry/ping':
        send(ws, { jsonrpc: '2.0', id, result: { ok: true } });
        break;
    }
  });
});
```

### Example 2: Weather Server

See: `/tmp/mcp-weather/server.js` for a complete working example

### Example 3: NFL RAG Server

See: `/tmp/mcp-nfl-rag/server.js` for a knowledge base example

---

## Troubleshooting

### Server Not Connecting

**Problem:** PocketPal can't connect to server

**Solutions:**
- ✅ Check server is running (`node server.js`)
- ✅ Verify correct port in URL (`ws://localhost:3002`)
- ✅ Ensure using **WebSocket** not stdio
- ✅ Check for port conflicts (`lsof -i :3002`)
- ✅ Try a different port

### Tools Not Showing

**Problem:** Tools tab is empty after selecting MCP server

**Solutions:**
- ✅ Ensure `tools/list` method is implemented
- ✅ Check server logs for errors
- ✅ Verify tool schema is valid JSON Schema
- ✅ Make sure session was created (see MCP session fix)

### Tool Execution Fails

**Problem:** Tool is called but returns error

**Solutions:**
- ✅ Validate input parameters match schema
- ✅ Check server logs for execution errors
- ✅ Return proper error response format
- ✅ Ensure result has `content` array

### JSON Parse Errors

**Problem:** Invalid JSON errors in logs

**Solutions:**
- ✅ Use `JSON.stringify()` for all responses
- ✅ Use `JSON.parse()` for all incoming messages
- ✅ Handle parse errors gracefully
- ✅ Log raw messages for debugging

---

## Best Practices

### Tool Design

1. **Descriptive Names** - Use clear, action-oriented names (e.g., `searchKnowledge`, `getWeather`)
2. **Detailed Descriptions** - Help the AI understand when to use the tool
3. **Clear Parameters** - Document each parameter's purpose and format
4. **Validation** - Always validate input parameters
5. **Error Handling** - Return clear error messages

### Response Formatting

1. **Use Markdown** - Format results with markdown for better display
2. **Structure Data** - Use headings, lists, and tables
3. **Cite Sources** - Include source information when relevant
4. **Be Concise** - Return focused, relevant information

### Performance

1. **Async Operations** - Use `async/await` for I/O operations
2. **Timeouts** - Implement timeouts for long-running operations
3. **Error Recovery** - Handle errors gracefully without crashing
4. **Logging** - Log important events and errors

### Security

1. **Input Validation** - Never trust user input
2. **Rate Limiting** - Prevent abuse of expensive operations
3. **Authentication** - Add auth if needed (not shown in examples)
4. **Sandboxing** - Limit what tools can access

---

## Additional Resources

- **Working Examples:**
  - `/tmp/mcp-weather/` - Weather API integration
  - `/tmp/mcp-echo/` - Simple echo server
  - `/tmp/mcp-nfl-rag/` - Knowledge base with RAG
- **MCP Specification:** https://modelcontextprotocol.io/
- **WebSocket API:** https://github.com/websockets/ws
- **JSON-RPC 2.0:** https://www.jsonrpc.org/specification

---

## Quick Reference

### Checklist for New Server

- [ ] Using WebSocket (not stdio)
- [ ] Listening on a port (default: 3002)
- [ ] Handles `initialize` method
- [ ] Handles `tools/list` method
- [ ] Handles `tools/call` method
- [ ] Handles `notifications/initialized` (optional)
- [ ] Handles `telemetry/ping` (optional)
- [ ] Returns JSON-RPC 2.0 format
- [ ] Tool schema is valid
- [ ] Input validation implemented
- [ ] Error handling implemented
- [ ] Tested with PocketPal

### Common Ports

- `3000` - Echo server
- `3001` - Weather server
- `3002` - NFL RAG server (or your custom server)
- `3335` - Alternative weather server

Choose an unused port for your server!

---

**Happy coding! 🚀**

For questions or issues, check the PocketPal repository issues or create a new one.
