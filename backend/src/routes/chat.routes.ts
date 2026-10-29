/**
 * ============================================================================
 * 💬 ROTAS DE CHAT RAG (backend/src/rotas/chat.rotas.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Expõe o endpoint conversacional `/api/v1/chat` para perguntas e respostas
 * ancoradas em manuais e histórico da conversa.
 * 
 * 🔄 QUEM CHAMA:
 * - A tela principal de chat em `frontend/src/app/page.tsx`
 * - A função `enviarPerguntaChat()` em `frontend/src/lib/api.ts`
 * 
 * ➡️ QUEM ESTE ARQUIVO CHAMA:
 * - `ServicoChat` em `src/modulos/chat/servico.chat.ts`
 * ============================================================================
 */

import { FastifyInstance } from 'fastify';
import { ServicoChat } from '../modules/chat/chat.service.js';

export async function rotasChat(app: FastifyInstance) {
  const servicoChat = new ServicoChat();

  /**
   * POST /api/v1/chat
   * Envia uma pergunta sobre o ERP, recupera trechos no pgvector, monta o contexto
   * com páginas e gera a resposta fundamentada com o LLM.
   */
  app.post(
    '/',
    {
      schema: {
        summary: 'Conversar com os manuais do ERP (RAG)',
        description: 'Envia uma dúvida, recupera as evidências nos manuais do ERP e devolve uma resposta fundamentada com fontes e páginas.',
        tags: ['Chat RAG'],
        body: {
          type: 'object',
          required: ['pergunta'],
          properties: {
            pergunta: { type: 'string', description: 'Pergunta sobre o ERP' },
            conversaId: { type: 'string', format: 'uuid', description: 'ID da conversa para manter o contexto' },
            sistema: { type: 'string', description: 'Sistema ERP' },
            modulo: { type: 'string', description: 'Módulo específico' },
            versao: { type: 'string', description: 'Versão do sistema' },
          },
        },
      },
    },
    async (requisicao) => {
      const corpo = requisicao.body as any;
      return servicoChat.perguntar({
        pergunta: corpo.pergunta || corpo.question,
        conversaId: corpo.conversaId || corpo.conversationId,
        sistema: corpo.sistema || corpo.system,
        modulo: corpo.modulo || corpo.module,
        versao: corpo.versao || corpo.version,
      });
    }
  );

  /**
   * GET /api/v1/chat/conversas
   * Retorna a lista das últimas conversas ativas no sistema.
   */
  app.get(
    '/conversas',
    {
      schema: {
        summary: 'Listar conversas recentes',
        description: 'Retorna a lista das últimas sessões de chat gravadas no banco.',
        tags: ['Chat RAG'],
      },
    },
    async () => {
      return servicoChat.listarConversas();
    }
  );

  /**
   * GET /api/v1/chat/:conversaId/historico
   * Retorna todas as mensagens trocadas em uma conversa e as fontes associadas.
   */
  app.get(
    '/:conversaId/historico',
    {
      schema: {
        summary: 'Histórico da conversa',
        description: 'Retorna todas as mensagens e fontes de uma conversa específica.',
        tags: ['Chat RAG'],
        params: {
          type: 'object',
          required: ['conversaId'],
          properties: { conversaId: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (requisicao) => {
      const { conversaId } = requisicao.params as { conversaId: string };
      return servicoChat.obterHistoricoConversa(conversaId);
    }
  );
}
