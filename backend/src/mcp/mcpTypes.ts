/**
 * ============================================================================
 * 🔌 MODEL CONTEXT PROTOCOL (MCP) — TIPOS (backend/src/mcp/mcpTypes.ts)
 * ============================================================================
 * Implementa a especificação aberta MCP da Anthropic para integração de ferramentas,
 * recursos corporativos e contextos de execução de agentes de IA.
 */

export interface McpToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
}

export interface McpToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, McpToolParameter>;
    required?: string[];
  };
}

export interface McpToolResult {
  sucesso: boolean;
  dados: any;
  mensagem?: string;
  servidorOrigem: string;
  tempoExecucaoMs: number;
}

export interface McpToolHandler {
  schema: McpToolSchema;
  servidor: string;
  departamentoPermitido?: string[];
  executar: (parametros: Record<string, any>, contextoUsuario?: any) => Promise<McpToolResult>;
}
