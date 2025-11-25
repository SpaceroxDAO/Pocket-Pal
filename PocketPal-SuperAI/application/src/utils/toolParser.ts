/**
 * Tool Parser Utility
 *
 * Parses LLM responses for tool call markers and formats tool schemas
 */

import {MCPTool} from '../services/mcp/MCPClient';

/**
 * Represents a parsed tool call from LLM response
 */
export interface ParsedToolCall {
  name: string;
  arguments: Record<string, any>;
  rawText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Parse tool calls from LLM response text
 *
 * Looks for pattern: [TOOL:tool_name]{"arg": "value"}[/TOOL]
 *
 * @param text - The LLM response text
 * @returns Array of parsed tool calls
 */
export function parseToolCalls(text: string): ParsedToolCall[] {
  const regex = /\[TOOL:(\w+)\](\{[^\]]+\})\[\/TOOL\]/g;
  const calls: ParsedToolCall[] = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const name = match[1];
      const argsJson = match[2];
      const args = JSON.parse(argsJson);

      calls.push({
        name,
        arguments: args,
        rawText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    } catch (error) {
      console.error('[ToolParser] Failed to parse tool call:', match[0], error);
      // Continue parsing other tool calls
    }
  }

  return calls;
}

/**
 * Remove tool call markers from text
 *
 * Used to clean up the displayed message by removing the technical markers
 *
 * @param text - Text containing tool markers
 * @returns Cleaned text without markers
 */
export function removeToolMarkers(text: string): string {
  return text.replace(/\[TOOL:\w+\]\{[^\]]+\}\[\/TOOL\]/g, '');
}

/**
 * Generate tool schema text for system prompt
 *
 * Formats MCP tools into a human-readable schema that the LLM can understand
 *
 * @param tools - Array of MCP tools
 * @returns Formatted tool schema text
 */
export function generateToolSchemas(tools: MCPTool[]): string {
  if (tools.length === 0) {
    return '';
  }

  const schemas = tools.map(tool => {
    // Extract parameter names from inputSchema
    const params = tool.inputSchema?.properties || {};
    const paramNames = Object.keys(params);
    const required = tool.inputSchema?.required || [];

    // Build parameter signature
    const paramSignature = paramNames
      .map(name => {
        const isRequired = required.includes(name);
        const param = params[name];
        const typeStr = param.type || 'string';
        return isRequired ? `${name}: ${typeStr}` : `${name}?: ${typeStr}`;
      })
      .join(', ');

    // Build example
    const exampleArgs: Record<string, string> = {};
    paramNames.forEach(name => {
      const param = params[name];
      const description = param.description || name;
      // Use description as example value, or just the param name
      exampleArgs[name] = description.includes('example')
        ? description.split('example:')[1]?.trim() || `example_${name}`
        : `example_${name}`;
    });

    return `- ${tool.name}(${paramSignature}): ${tool.description}
  Example: [TOOL:${tool.name}]${JSON.stringify(exampleArgs)}[/TOOL]`;
  }).join('\n\n');

  return schemas;
}

/**
 * Build enhanced system prompt with tool instructions
 *
 * @param basePrompt - The original system prompt
 * @param tools - Array of available MCP tools
 * @returns Enhanced system prompt with tool instructions
 */
export function buildSystemPromptWithTools(
  basePrompt: string,
  tools: MCPTool[],
): string {
  if (tools.length === 0) {
    return basePrompt;
  }

  const toolSchemas = generateToolSchemas(tools);

  const toolInstructions = `

You have access to external tools that can help you provide more accurate and up-to-date information.

Available Tools:
${toolSchemas}

Tool Usage Instructions:
- Use tools ONLY when they would provide helpful, accurate information
- To call a tool, use this EXACT format: [TOOL:tool_name]{"arg": "value"}[/TOOL]
- Wait for the tool result before continuing your response
- Use the tool result to provide an accurate, natural response to the user
- If a tool fails or times out, acknowledge this and provide your best response without it

Example Conversation:
User: "What's the weather in Tokyo?"
Assistant: "Let me check the current weather for you. [TOOL:get_weather]{"location": "Tokyo"}[/TOOL]"
[Tool returns: {"temperature": 72, "condition": "Sunny"}]
Assistant: "The current weather in Tokyo is 72°F and sunny."

Remember: Be natural and conversational. The user doesn't need to know about the technical details of tool calls.`;

  return basePrompt + toolInstructions;
}

/**
 * Format tool result for injection into conversation
 *
 * @param toolName - Name of the tool that was executed
 * @param result - Result from the tool
 * @returns Formatted text for injection
 */
export function formatToolResult(toolName: string, result: any): string {
  let resultText: string;

  if (typeof result === 'string') {
    resultText = result;
  } else if (result && typeof result === 'object') {
    // Try to extract meaningful data
    if (result.content && Array.isArray(result.content)) {
      // MCP response format
      const textContent = result.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');
      resultText = textContent || JSON.stringify(result, null, 2);
    } else {
      resultText = JSON.stringify(result, null, 2);
    }
  } else {
    resultText = String(result);
  }

  return `[TOOL_RESULT(${toolName}): ${resultText}]`;
}
