/**
 * ============================================================================
 * 🤖 ROTAS DE ARQUITETURA MULTI-AGENTE (backend/src/routes/multiagent.routes.ts)
 * ============================================================================
 * Endpoints corporativos para orquestração de agentes especializados,
 * fila de aprovações Human-in-the-Loop (HITL), catálogo MCP e telemetria FinOps.
 */

import { FastifyInstance } from 'fastify';
import { ServicoMultiagente } from '../modules/multiagent/multiagent.service.js';
import { ServicoHitl } from '../modules/hitl/hitl.service.js';
import { RegistroMCP } from '../mcp/mcpRegistry.js';

export async function rotasMultiagente(app: FastifyInstance) {
  const servicoMultiagente = new ServicoMultiagente();
  const servicoHitl = new ServicoHitl();
  const mcp = RegistroMCP.obterInstancia();

  /**
   * POST /api/v1/multi-agente/executar
   * Executa uma solicitação complexa multi-departamental (ex: caso de renovação XPTO).
   */
  app.post(
    '/executar',
    {
      schema: {
        summary: 'Executar solicitação complexa via Orquestrador Multi-Agente',
        description:
          'Passa por Guardrails, executa plano em DAG com agentes Comercial, Financeiro e Jurídico, aciona MCP e HITL se necessário.',
        tags: ['Multi-Agentes'],
        body: {
          type: 'object',
          required: ['solicitacao'],
          properties: {
            solicitacao: { type: 'string', description: 'Instrução em linguagem natural' },
            solicitante: { type: 'string', description: 'Nome do colaborador' },
            departamento: { type: 'string', description: 'Departamento de origem' },
          },
        },
      },
    },
    async (requisicao, resposta) => {
      const corpo = requisicao.body as any;
      try {
        const resultado = await servicoMultiagente.executar({
          solicitacao: corpo.solicitacao,
          solicitante: corpo.solicitante || 'Colaborador Comercial',
          departamento: corpo.departamento || 'Comercial',
        });
        return resposta.status(200).send(resultado);
      } catch (err: any) {
        return resposta.status(400).send({
          erro: err.message || 'Falha ao processar solicitação no orquestrador multi-agente.',
        });
      }
    }
  );

  /**
   * GET /api/v1/multi-agente/execucoes
   * Lista as últimas execuções de workflows multi-agente.
   */
  app.get(
    '/execucoes',
    {
      schema: {
        summary: 'Listar execuções multi-agente',
        tags: ['Multi-Agentes'],
      },
    },
    async () => {
      return servicoMultiagente.listarExecucoes();
    }
  );

  /**
   * GET /api/v1/multi-agente/execucoes/:id
   * Obtém detalhes de uma execução com DAG e telemetria.
   */
  app.get(
    '/execucoes/:id',
    {
      schema: {
        summary: 'Detalhes de uma execução multi-agente',
        tags: ['Multi-Agentes'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (requisicao, resposta) => {
      const { id } = requisicao.params as { id: string };
      const item = await servicoMultiagente.obterExecucaoPorId(id);
      if (!item) return resposta.status(404).send({ erro: 'Execução não encontrada.' });
      return item;
    }
  );

  /**
   * GET /api/v1/multi-agente/aprovacoes
   * Fila de aprovações Human-in-the-Loop (HITL).
   */
  app.get(
    '/aprovacoes',
    {
      schema: {
        summary: 'Fila de aprovações Human-in-the-Loop (HITL)',
        tags: ['Multi-Agentes'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pendente', 'aprovado', 'rejeitado'] },
          },
        },
      },
    },
    async (requisicao) => {
      const { status } = (requisicao.query as any) || {};
      return servicoHitl.listarAprovacoes(status);
    }
  );

  /**
   * POST /api/v1/multi-agente/aprovacoes/:id/responder
   * Decide sobre uma solicitação pendente de aprovação humana (aprovar ou rejeitar).
   */
  app.post(
    '/aprovacoes/:id/responder',
    {
      schema: {
        summary: 'Responder aprovação Human-in-the-Loop (HITL)',
        tags: ['Multi-Agentes'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['decisao', 'aprovador'],
          properties: {
            decisao: { type: 'string', enum: ['aprovado', 'rejeitado'] },
            aprovador: { type: 'string' },
            justificativa: { type: 'string' },
          },
        },
      },
    },
    async (requisicao, resposta) => {
      const { id } = requisicao.params as { id: string };
      const corpo = requisicao.body as any;
      const res = await servicoHitl.responderAprovacao(
        id,
        corpo.decisao,
        corpo.aprovador,
        corpo.justificativa
      );
      return resposta.status(200).send(res);
    }
  );

  /**
   * GET /api/v1/multi-agente/ferramentas-mcp
   * Retorna o catálogo de ferramentas MCP disponíveis por servidor.
   */
  app.get(
    '/ferramentas-mcp',
    {
      schema: {
        summary: 'Catálogo de ferramentas e servidores MCP',
        tags: ['Multi-Agentes'],
      },
    },
    async () => {
      return mcp.listarFerramentas().map((h) => ({
        servidor: h.servidor,
        departamentosPermitidos: h.departamentoPermitido || ['Todos'],
        ferramenta: h.schema,
      }));
    }
  );
}

