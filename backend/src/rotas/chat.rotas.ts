import { FastifyInstance } from 'fastify';
import { ServicoChat } from '../modulos/chat/servico.chat.js';

export async function rotasChat(app: FastifyInstance) {
  const servicoChat = new ServicoChat();

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

