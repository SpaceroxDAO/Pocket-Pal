/**
 * MCP (Model Context Protocol) WebSocket Client
 *
 * Lightweight client for connecting to MCP servers via WebSocket.
 * Handles JSON-RPC communication, tool discovery, and execution.
 */

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion?: string;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

export class MCPClient {
  private ws: WebSocket | null = null;
  private url: string;
  private requestId = 0;
  private pendingRequests = new Map<number | string, PendingRequest>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private shouldReconnect = true;

  public serverInfo: MCPServerInfo | null = null;
  public onLog: (message: string) => void = () => {};
  public onError: (error: string) => void = () => {};
  public onConnected: () => void = () => {};
  public onDisconnected: () => void = () => {};

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to MCP server and perform handshake
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.onLog(`Connecting to MCP server: ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = async () => {
          this.onLog('WebSocket connected');
          try {
            await this.initialize();
            this.startHeartbeat();
            this.onConnected();
            resolve();
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.onError(`Initialization failed: ${errorMsg}`);
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          const errorMsg = 'WebSocket error occurred';
          this.onError(errorMsg);
          reject(new Error(errorMsg));
        };

        this.ws.onclose = () => {
          this.onLog('WebSocket disconnected');
          this.cleanup();
          this.onDisconnected();

          // Auto-reconnect if not explicitly disposed
          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Connection failed';
        this.onError(errorMsg);
        reject(new Error(errorMsg));
      }
    });
  }

  /**
   * Perform MCP initialization handshake
   */
  private async initialize(): Promise<void> {
    const initResult = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      clientInfo: {
        name: 'PocketPal-SuperAI',
        version: '1.0.0',
      },
    });

    this.serverInfo = {
      name: initResult.serverInfo?.name || 'Unknown',
      version: initResult.serverInfo?.version || 'Unknown',
      protocolVersion: initResult.protocolVersion,
    };

    // Send initialized notification
    this.sendNotification('notifications/initialized', {});
    this.isInitialized = true;
    this.onLog(`Initialized MCP server: ${this.serverInfo.name} v${this.serverInfo.version}`);
  }

  /**
   * List available tools from the server
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.isInitialized) {
      throw new Error('Client not initialized');
    }

    const result = await this.sendRequest('tools/list', {});
    return result.tools || [];
  }

  /**
   * Call a tool with given arguments
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Client not initialized');
    }

    this.onLog(`Calling tool: ${name}`);
    const result = await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });

    return result;
  }

  /**
   * Send a JSON-RPC request and wait for response
   */
  private sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = ++this.requestId;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      // Set timeout for request (30 seconds)
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify(request));
    });
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  private sendNotification(method: string, params?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.ws.send(JSON.stringify(notification));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle response to a request
      if ('id' in message && message.id !== null) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(message.id);

          const response = message as JsonRpcResponse;
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      }
      // Handle notifications from server
      else if ('method' in message) {
        this.onLog(`Received notification: ${message.method}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to parse message';
      this.onError(`Message parse error: ${errorMsg}`);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendNotification('ping', {});
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        this.onLog('Attempting to reconnect...');
        this.connect().catch((error) => {
          this.onError(`Reconnection failed: ${error.message}`);
        });
      }
    }, 5000); // Retry after 5 seconds
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();

    this.isInitialized = false;
  }

  /**
   * Disconnect and clean up
   */
  dispose(): void {
    this.shouldReconnect = false;
    this.cleanup();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.onLog('MCP client disposed');
  }

  /**
   * Check if client is connected and initialized
   */
  isConnected(): boolean {
    return this.ws !== null &&
           this.ws.readyState === WebSocket.OPEN &&
           this.isInitialized;
  }
}
