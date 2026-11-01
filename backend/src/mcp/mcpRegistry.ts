/**
 * ============================================================================
 * 🌐 REGISTRO CENTRAL DE SERVIDORES MCP (backend/src/mcp/mcpRegistry.ts)
 * ============================================================================
 * Centraliza e roteia as ferramentas padronizadas MCP para cada sistema corporativo:
 * - Servidor MCP CRM (Salesforce / HubSpot)
 * - Servidor MCP ERP Financeiro (SAP / TOTVS)
 * - Servidor MCP CLM Jurídico (Contratos & Minutas)
 * - Servidor MCP Notificações (Slack / Teams / Alçadas)
 */

import { McpToolHandler, McpToolResult } from './mcpTypes.js';

export class RegistroMCP {
  private static instancia: RegistroMCP;
  private ferramentas = new Map<string, McpToolHandler>();

  private constructor() {
    this.registrarFerramentasPadrao();
  }

  public static obterInstancia(): RegistroMCP {
    if (!RegistroMCP.instancia) {
      RegistroMCP.instancia = new RegistroMCP();
    }
    return RegistroMCP.instancia;
  }

  public registrar(handler: McpToolHandler) {
    this.ferramentas.set(handler.schema.name, handler);
  }

  public obterFerramenta(nome: string): McpToolHandler | undefined {
    return this.ferramentas.get(nome);
  }

  public listarFerramentas(): McpToolHandler[] {
    return Array.from(this.ferramentas.values());
  }

  public async executarFerramenta(
    nome: string,
    parametros: Record<string, any>,
    contextoUsuario?: { usuario: string; departamento: string }
  ): Promise<McpToolResult> {
    const handler = this.ferramentas.get(nome);
    if (!handler) {
      return {
        sucesso: false,
        dados: null,
        mensagem: `Ferramenta MCP '${nome}' não cadastrada no catálogo corporativo.`,
        servidorOrigem: 'desconhecido',
        tempoExecucaoMs: 0,
      };
    }

    // Validação de alçada por departamento (Tool-level RBAC)
    if (handler.departamentoPermitido && contextoUsuario?.departamento) {
      const autorizado = handler.departamentoPermitido.includes(contextoUsuario.departamento);
      if (!autorizado) {
        return {
          sucesso: false,
          dados: null,
          mensagem: `Acesso negado: o departamento '${contextoUsuario.departamento}' não tem permissão para a ferramenta '${nome}'.`,
          servidorOrigem: handler.servidor,
          tempoExecucaoMs: 0,
        };
      }
    }

    const inicio = Date.now();
    try {
      const res = await handler.executar(parametros, contextoUsuario);
      res.tempoExecucaoMs = Date.now() - inicio;
      return res;
    } catch (err: any) {
      return {
        sucesso: false,
        dados: null,
        mensagem: `Falha na execução da ferramenta MCP '${nome}': ${err.message}`,
        servidorOrigem: handler.servidor,
        tempoExecucaoMs: Date.now() - inicio,
      };
    }
  }

  /**
   * Registra os servidores MCP corporativos para simulação e execução real
   */
  private registrarFerramentasPadrao() {
    // -------------------------------------------------------------
    // 1. SERVIDOR MCP SALESFORCE / CRM (Comercial)
    // -------------------------------------------------------------
    this.registrar({
      servidor: 'mcp-server-salesforce',
      departamentoPermitido: ['Comercial', 'Diretoria', 'Operações', 'Financeiro'],
      schema: {
        name: 'salesforce_get_customer_history',
        description: 'Consulta o histórico comercial, LTV, tempo de casa e churn risk do cliente no CRM.',
        parameters: {
          type: 'object',
          properties: {
            clienteId: { type: 'string', description: 'Código ou nome do cliente (ex: XPTO)' },
          },
          required: ['clienteId'],
        },
      },
      executar: async (params) => {
        const cliente = String(params.clienteId || 'XPTO').toUpperCase();
        return {
          sucesso: true,
          servidorOrigem: 'mcp-server-salesforce',
          tempoExecucaoMs: 0,
          dados: {
            cliente,
            tempoDeCasaAnos: 3.5,
            ltvTotal: 1240000.0,
            contratoAtualAnual: 360000.0,
            tier: 'Enterprise Tier 1',
            satisfacaoNps: 88,
            churnRisk: 'Baixo (2.1%)',
            executivoConta: 'Fernanda Lima',
            historicoNegociacoes: [
              { ano: 2024, tipo: 'Contrato Inicial', valor: 300000, descontoAplicado: '0%' },
              { ano: 2025, tipo: 'Renovação + Add-on', valor: 360000, descontoAplicado: '3%' },
            ],
          },
        };
      },
    });

    this.registrar({
      servidor: 'mcp-server-salesforce',
      departamentoPermitido: ['Comercial', 'Diretoria'],
      schema: {
        name: 'salesforce_calculate_margin',
        description: 'Calcula o impacto do desconto na margem de contribuição operacional do contrato.',
        parameters: {
          type: 'object',
          properties: {
            valorBase: { type: 'number', description: 'Valor anual do contrato' },
            percentualDesconto: { type: 'number', description: 'Percentual de desconto solicitado (ex: 10)' },
          },
          required: ['valorBase', 'percentualDesconto'],
        },
      },
      executar: async (params) => {
        const base = Number(params.valorBase) || 360000;
        const desc = Number(params.percentualDesconto) || 10;
        const valorFinal = base * (1 - desc / 100);
        const margemBrutaOriginal = 0.32; // 32%
        const margemBrutaFinal = margemBrutaOriginal - (desc / 100) * 0.9; // ~23%
        const margemMinimaExigida = 0.18; // 18%

        const viavel = margemBrutaFinal >= margemMinimaExigida;

        return {
          sucesso: true,
          servidorOrigem: 'mcp-server-salesforce',
          tempoExecucaoMs: 0,
          dados: {
            valorOriginal: base,
            descontoPercentual: desc,
            valorComDesconto: valorFinal,
            economiaClienteAnual: base - valorFinal,
            margemBrutaFinalPercentual: Math.round(margemBrutaFinal * 100),
            margemMinimaCorporativa: Math.round(margemMinimaExigida * 100),
            viavel,
            motivo: viavel
              ? `Margem resultante de ${Math.round(margemBrutaFinal * 100)}% é superior à margem mínima corporativa de 18%.`
              : `Inviável: margem ficaria abaixo do piso de 18%.`,
          },
        };
      },
    });

    // -------------------------------------------------------------
    // 2. SERVIDOR MCP SAP ERP (Financeiro)
    // -------------------------------------------------------------
    this.registrar({
      servidor: 'mcp-server-sap-erp',
      departamentoPermitido: ['Financeiro', 'Comercial', 'Diretoria'],
      schema: {
        name: 'sap_get_aging_report',
        description: 'Consulta no SAP ERP o status de pendências financeiras, títulos a receber em aberto e score de crédito.',
        parameters: {
          type: 'object',
          properties: {
            clienteId: { type: 'string', description: 'Código do cliente no ERP' },
          },
          required: ['clienteId'],
        },
      },
      executar: async (params) => {
        const cliente = String(params.clienteId || 'XPTO').toUpperCase();
        return {
          sucesso: true,
          servidorOrigem: 'mcp-server-sap-erp',
          tempoExecucaoMs: 0,
          dados: {
            cliente,
            titulosVencidos: 0,
            valorInadimplente: 0.0,
            titulosAVencer: 3,
            valorAVencer: 90000.0,
            diasAtrasoMedioHistorico: 1.2,
            scoreCreditoSerasa: 920,
            bloqueioFinanceiro: false,
            conceitoFinanceiro: 'Excelente (Adimplência Impecável)',
          },
        };
      },
    });

    // -------------------------------------------------------------
    // 3. SERVIDOR MCP CLM JURÍDICO (Contratos & Minutas)
    // -------------------------------------------------------------
    this.registrar({
      servidor: 'mcp-server-clm-legal',
      departamentoPermitido: ['Jurídico', 'Comercial', 'Diretoria'],
      schema: {
        name: 'clm_get_contract_clauses',
        description: 'Consulta cláusulas vigentes de renovação, reajuste de preço e limites de desconto no CLM.',
        parameters: {
          type: 'object',
          properties: {
            clienteId: { type: 'string', description: 'Código do cliente ou contrato' },
          },
          required: ['clienteId'],
        },
      },
      executar: async (params) => {
        return {
          sucesso: true,
          servidorOrigem: 'mcp-server-clm-legal',
          tempoExecucaoMs: 0,
          dados: {
            contratoNumero: 'CTR-2023-8841-XPTO',
            vigenciaInicio: '2023-12-01',
            vigenciaFim: '2026-11-30',
            diasAteExpirar: 29,
            indiceReajusteAnual: 'IPCA acumulado (4.2%)',
            clausulaRenovacao: {
              artigo: 'Cláusula 8ª — Da Renovação e Descontos',
              texto: 'A renovação automática ou acordada poderá contemplar desconto promocional de até 5% por alçada do executivo de conta. Descontos entre 5.1% e 12% são permitidos ESTRITAMENTE mediante aprovação formal do Diretor Comercial.',
              limiteDescontoAutonomo: 5.0,
              limiteDescontoComAprovacao: 12.0,
              necessitaAprovacaoAlcada: true,
            },
          },
        };
      },
    });

    this.registrar({
      servidor: 'mcp-server-clm-legal',
      departamentoPermitido: ['Jurídico', 'Comercial', 'Diretoria'],
      schema: {
        name: 'clm_create_draft_proposal',
        description: 'Gera a minuta da proposta comercial atualizada de renovação contratual com os termos negociados.',
        parameters: {
          type: 'object',
          properties: {
            clienteId: { type: 'string', description: 'Código do cliente' },
            valorAnual: { type: 'number', description: 'Valor anual final acordado' },
            descontoPercentual: { type: 'number', description: 'Desconto aplicado' },
            prazoVigenciaMeses: { type: 'number', description: 'Prazo em meses (ex: 12)' },
          },
          required: ['clienteId', 'valorAnual', 'descontoPercentual'],
        },
      },
      executar: async (params) => {
        const idProposta = `PROP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        return {
          sucesso: true,
          servidorOrigem: 'mcp-server-clm-legal',
          tempoExecucaoMs: 0,
          dados: {
            propostaId: idProposta,
            titulo: `Proposta de Renovação Contratual — Cliente ${params.clienteId}`,
            valorOriginal: params.valorAnual / (1 - (params.descontoPercentual || 10) / 100),
            valorFinalComDesconto: params.valorAnual,
            descontoConcedido: `${params.descontoPercentual}%`,
            vigenciaMeses: params.prazoVigenciaMeses || 12,
            arquivoGerado: `https://storage.empresa.com.br/propostas/${idProposta}.pdf`,
            status: 'Minuta Gerada (Aguardando Assinatura/Aprovação)',
          },
        };
      },
    });
  }
}
