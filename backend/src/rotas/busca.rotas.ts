/**
 * ============================================================================
 * 🔎 ROTAS DE PESQUISA TÉCNICA (backend/src/rotas/busca.rotas.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Expõe o endpoint de Busca Híbrida (`/api/v1/busca/hibrida`).
 * 
 * 🔄 QUEM CHAMA:
 * - A tela de pesquisa em `frontend/src/app/busca/page.tsx`
 * - A função `executarBuscaHibrida()` em `frontend/src/lib/api.ts`
 * 
 * ➡️ QUEM ESTE ARQUIVO CHAMA:
 * - `ServicoBusca` em `src/modulos/busca/servico.busca.ts`
 * ============================================================================
 */

import { FastifyInstance } from 'fastify';
import { ServicoBusca } from '../modulos/busca/servico.busca.js';

export async function rotasBusca(app: FastifyInstance) {
  const servicoBusca = new ServicoBusca();

  /**
   * POST /api/v1/busca/hibrida
   * Recebe um termo de busca e filtros de ERP e devolve os melhores fragmentos
   * ordenados por pontuação composta (75% cosseno vetorial + 25% texto ILIKE).
   */
  app.post(
    '/hibrida',
    {
      schema: {
        summary: 'Busca técnica híbrida (Vetorial + Lexical)',
        description: 'Combina similaridade por cosseno no pgvector com busca de texto exata para localizar trechos, tabelas, endpoints ou códigos.',
        tags: ['Pesquisa Técnica'],
        body: {
          type: 'object',
          required: ['termoBusca'],
          properties: {
            termoBusca: { type: 'string', description: 'Pergunta ou termo técnico a pesquisar' },
            sistema: { type: 'string', description: 'Filtro por sistema ERP (ex: Volpe)' },
            modulo: { type: 'string', description: 'Filtro por módulo (ex: Financeiro)' },
            versao: { type: 'string', description: 'Filtro por versão (ex: 2026.1)' },
            limite: { type: 'number', default: 5, description: 'Número máximo de resultados' },
          },
        },
      },
    },
    async (requisicao) => {
      const corpo = requisicao.body as any;
      return servicoBusca.buscaHibrida({
        termoBusca: corpo.termoBusca || corpo.query,
        sistema: corpo.sistema || corpo.system,
        modulo: corpo.modulo || corpo.module,
        versao: corpo.versao || corpo.version,
        limite: corpo.limite || corpo.limit || 5,
      });
    }
  );
}
