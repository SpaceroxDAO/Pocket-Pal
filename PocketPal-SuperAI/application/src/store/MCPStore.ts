/**
 * MCP Store - Manages MCP server connections and tool execution
 */

import {makeAutoObservable, runInAction} from 'mobx';
import {makePersistable} from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {MCPClient, MCPTool} from '../services/mcp/MCPClient';
import {MessageType} from '../utils/types';

export interface MCPServer {
  id: string;
  name: string;
  url: string;
}

class MCPStore {
  // Persisted data
  servers: MCPServer[] = [];

  // Runtime state
  activeClient: MCPClient | null = null;
  activeServerId: string | null = null;
  tools: MCPTool[] = [];
  isConnecting: boolean = false;
  isLoadingTools: boolean = false;
  logs: string[] = [];
  lastError: string | null = null;

  constructor() {
    makeAutoObservable(this);

    makePersistable(this, {
      name: 'MCPStore',
      properties: ['servers'],
      storage: AsyncStorage,
    });
  }

  /**
   * Add a new MCP server configuration
   */
  async addServer(name: string, url: string): Promise<void> {
    const id = Date.now().toString();
    const server: MCPServer = {id, name, url};

    runInAction(() => {
      this.servers.push(server);
    });

    // Auto-connect to first server
    if (this.servers.length === 1) {
      await this.connectToServer(id);
    }
  }

  /**
   * Remove a server configuration
   */
  removeServer(id: string): void {
    const index = this.servers.findIndex(s => s.id === id);
    if (index !== -1) {
      runInAction(() => {
        this.servers.splice(index, 1);
      });
    }

    // Disconnect if this was the active server
    if (this.activeServerId === id) {
      this.disposeActiveClient();
    }
  }

  /**
   * Connect to an MCP server and load its tools
   */
  async connectToServer(serverId: string): Promise<void> {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Disconnect existing client
    this.disposeActiveClient();

    runInAction(() => {
      this.isConnecting = true;
      this.lastError = null;
      this.logs = [];
    });

    try {
      const client = new MCPClient(server.url);

      // Set up logging
      client.onLog = (message: string) => {
        runInAction(() => {
          this.logs.push(`[${new Date().toISOString()}] ${message}`);
          // Keep last 100 logs
          if (this.logs.length > 100) {
            this.logs.shift();
          }
        });
      };

      client.onError = (error: string) => {
        runInAction(() => {
          this.lastError = error;
          this.logs.push(`[${new Date().toISOString()}] ERROR: ${error}`);
        });
      };

      client.onConnected = () => {
        runInAction(() => {
          this.isConnecting = false;
        });
      };

      client.onDisconnected = () => {
        runInAction(() => {
          if (this.activeClient === client) {
            this.tools = [];
          }
        });
      };

      // Connect to server
      await client.connect();

      // Load tools
      await this.loadTools(client);

      runInAction(() => {
        this.activeClient = client;
        this.activeServerId = serverId;
        this.isConnecting = false;
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      runInAction(() => {
        this.isConnecting = false;
        this.lastError = errorMsg;
        this.logs.push(`[${new Date().toISOString()}] CONNECTION ERROR: ${errorMsg}`);
      });
      throw error;
    }
  }

  /**
   * Load available tools from the connected server
   */
  private async loadTools(client: MCPClient): Promise<void> {
    runInAction(() => {
      this.isLoadingTools = true;
    });

    try {
      const tools = await client.listTools();
      runInAction(() => {
        this.tools = tools;
        this.isLoadingTools = false;
        this.logs.push(`[${new Date().toISOString()}] Loaded ${tools.length} tools`);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load tools';
      runInAction(() => {
        this.isLoadingTools = false;
        this.lastError = errorMsg;
        this.logs.push(`[${new Date().toISOString()}] TOOL LOAD ERROR: ${errorMsg}`);
      });
      throw error;
    }
  }

  /**
   * Run a tool and inject results into the current chat session
   */
  async runTool(
    toolName: string,
    args: Record<string, any>,
    chatSessionStore: any, // Import type from ChatSessionStore if needed
  ): Promise<void> {
    if (!this.activeClient || !this.activeClient.isConnected()) {
      throw new Error('Not connected to any MCP server');
    }

    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      // Add system message showing tool call
      const argsMessage: MessageType.System = {
        id: Date.now().toString(),
        type: 'system',
        createdAt: Date.now(),
        text: `🛠 Running tool: ${toolName}\nArguments: ${JSON.stringify(args, null, 2)}`,
      };

      await chatSessionStore.addMessageToCurrentSession(argsMessage);

      // Call the tool
      this.logs.push(`[${new Date().toISOString()}] Calling tool: ${toolName}`);
      const result = await this.activeClient.callTool(toolName, args);

      // Add result as system message
      const resultText = typeof result === 'string'
        ? result
        : JSON.stringify(result, null, 2);

      const resultMessage: MessageType.System = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        createdAt: Date.now() + 1,
        text: `✅ Tool result:\n${resultText}`,
      };

      await chatSessionStore.addMessageToCurrentSession(resultMessage);

      this.logs.push(`[${new Date().toISOString()}] Tool executed successfully`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Tool execution failed';

      // Add error as system message
      const errorMessage: MessageType.System = {
        id: (Date.now() + 2).toString(),
        type: 'system',
        createdAt: Date.now() + 2,
        text: `❌ Tool error: ${errorMsg}`,
      };

      await chatSessionStore.addMessageToCurrentSession(errorMessage);

      runInAction(() => {
        this.lastError = errorMsg;
        this.logs.push(`[${new Date().toISOString()}] TOOL ERROR: ${errorMsg}`);
      });

      throw error;
    }
  }

  /**
   * Dispose of the active client connection
   */
  disposeActiveClient(): void {
    if (this.activeClient) {
      this.activeClient.dispose();
      runInAction(() => {
        this.activeClient = null;
        this.activeServerId = null;
        this.tools = [];
      });
    }
  }

  /**
   * Get the currently active server
   */
  get activeServer(): MCPServer | null {
    if (!this.activeServerId) {
      return null;
    }
    return this.servers.find(s => s.id === this.activeServerId) || null;
  }

  /**
   * Check if currently connected
   */
  get isConnected(): boolean {
    return this.activeClient !== null && this.activeClient.isConnected();
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.lastError = null;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

export const mcpStore = new MCPStore();
