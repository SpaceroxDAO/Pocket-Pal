# PocketPal SuperAI Documentation

This directory contains developer documentation for PocketPal SuperAI.

## Available Guides

### [MCP Server Development Guide](./MCP_SERVER_GUIDE.md)
**Complete guide for creating MCP servers that work with PocketPal**

Learn how to:
- Build WebSocket-based MCP servers
- Implement the JSON-RPC protocol
- Define and expose tools to the AI
- Handle tool calls and return results
- Test your server with PocketPal
- Troubleshoot common issues

**Key Points:**
- ✅ **MUST use WebSocket transport** (not stdio)
- ✅ Implement required methods: `initialize`, `tools/list`, `tools/call`
- ✅ Use JSON-RPC 2.0 format
- ✅ Return results in `content` array format

**Working Examples:**
- `/tmp/mcp-weather/` - Weather API server
- `/tmp/mcp-echo/` - Simple echo server
- `/tmp/mcp-nfl-rag/` - RAG knowledge base server

---

## Quick Start

### Creating Your First MCP Server

1. **Install dependencies:**
   ```bash
   npm install ws
   ```

2. **Create WebSocket server:**
   ```javascript
   import { WebSocketServer } from 'ws';
   const server = new WebSocketServer({ port: 3002 });
   ```

3. **Implement required handlers:**
   - `initialize` - Server info and capabilities
   - `tools/list` - Available tools
   - `tools/call` - Execute tools

4. **Test in PocketPal:**
   - Settings → MCP Servers → Add Server
   - URL: `ws://localhost:3002`
   - Enable tools in chat session

See [MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md) for complete instructions.

---

## Additional Resources

- **Architecture Docs** - Coming soon
- **API Reference** - Coming soon
- **Testing Guide** - Coming soon

---

**For detailed MCP server development, see [MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md)**
