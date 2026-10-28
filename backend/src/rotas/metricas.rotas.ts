/**
 * ============================================================================
 * 📊 ROTAS DE MÉTRICAS & AUDITORIA (backend/src/rotas/metricas.rotas.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Expõe endpoints para métricas operacionais e rastreamento de Lacunas de Conhecimento:
 * - `GET /api/v1/metricas/visao-geral`: Total de documentos, vetores, conversas e lacunas.
 * - `GET /api/v1/metricas/lacunas`: Lista perguntas em que o RAG não encontrou evidências.
 * - `PATCH /api/v1/metricas/lacunas/:id/resolver`: Marca uma lacuna como resolvida.
 * 
 * 🔄 QUEM CHAMA:
 * - A tela de métricas em `frontend/src/app/metricas/page.tsx`
 * - Funções em `frontend/src/lib/api.ts`
 * 
 * ➡️ QUEM ESTE ARQUIVO CHAMA:
 * - `ServicoMetricas` em `src/modulos/metricas/servico.metricas.ts`
 * ============================================================================
 */

import { FastifyInstance } from 'fastify';
import { ServicoMetricas } from '../modulos/metricas/servico.metricas.js';

export async function rotasMetricas(app: FastifyInstance) {
  const servicoMetricas = new ServicoMetricas();

  /**
   * GET /api/v1/metricas/visao-geral
   * Devolve os números consolidados dos 4 KPIs da aplicação.
   */
  app.get(
    '/visao-geral',
    {
      schema: {
        summary: 'Métricas gerais do sistema',
        description: 'Retorna a contagem de documentos indexados, fragmentos, conversas, diagnósticos e lacunas pendentes.',
        tags: ['Métricas & Governança'],
      },
    },
    async () => {
      return servicoMetricas.obterVisaoGeral();
    }
  );

  /**
   * GET /api/v1/metricas/lacunas
   * Lista todas as dúvidas de usuários que não obtiveram resposta suficiente nos manuais.
   */
  app.get(
    '/lacunas',
    {
      schema: {
        summary: 'Listar lacunas de documentação (Knowledge Gaps)',
        description: 'Retorna perguntas para as quais o sistema não encontrou evidências suficientes nos manuais.',
        tags: ['Métricas & Governança'],
        querystring: {
          type: 'object',
          properties: {
            resolvido: { type: 'boolean', description: 'Filtrar por lacunas resolvidas ou pendentes' },
          },
        },
      },
    },
    async (requisicao) => {
      const consulta = requisicao.query as { resolvido?: boolean };
      return servicoMetricas.obterLacunasConhecimento(consulta.resolvido);
    }
  );

  /**
   * PATCH /api/v1/metricas/lacunas/:id/resolver
   * Marca uma lacuna como resolvida quando o novo manual contendo a resposta é indexado.
   */
  app.patch(
    '/lacunas/:id/resolver',
    {
      schema: {
        summary: 'Marcar lacuna de conhecimento como resolvida',
        description: 'Usado quando um manual com a resposta é cadastrado na biblioteca.',
        tags: ['Métricas & Governança'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (requisicao) => {
      const { id } = requisicao.params as { id: string };
      await servicoMetricas.marcarLacunaResolvida(id);
      return { mensagem: 'Lacuna marcada como resolvida com sucesso.' };
    }
  );
}
