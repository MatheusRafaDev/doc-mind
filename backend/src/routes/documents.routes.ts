/**
 * ============================================================================
 * 📚 ROTAS DE DOCUMENTOS (backend/src/rotas/documentos.rotas.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Define os endpoints HTTP REST para upload, listagem e exclusão de manuais.
 * 
 * 🔄 QUEM CHAMA:
 * - O frontend em `frontend/src/lib/api.ts` (`uploadDocumento`, `listarDocumentos`, `excluirDocumento`)
 * - A tela visual em `frontend/src/app/documentos/page.tsx`
 * - Ou requisições cURL / Swagger em `/docs`
 * 
 * ➡️ QUEM ESTE ARQUIVO CHAMA:
 * - `ServicoDocumentos` em `src/modulos/documentos/servico.documentos.ts`
 * ============================================================================
 */

import { FastifyInstance } from 'fastify';
import { ServicoDocumentos } from '../modules/documents/documents.service.js';

export async function rotasDocumentos(app: FastifyInstance) {
  const servicoDocumentos = new ServicoDocumentos();

  /**
   * POST /api/v1/documentos/upload
   * Recebe um arquivo multipart (PDF, TXT ou MD) com título, sistema, módulo e versão.
   * Aciona a extração de texto por página, o chunking e a gravação de vetores no pgvector.
   */
  app.post(
    '/upload',
    {
      schema: {
        summary: 'Upload e ingestão de manual ou documento técnico',
        description:
          'Faz o upload de um arquivo PDF, TXT ou MD, extrai o texto página a página, divide em fragmentos e armazena os vetores no PostgreSQL com pgvector.',
        tags: ['Documentos'],
        consumes: ['multipart/form-data'],
      },
    },
    async (requisicao, resposta) => {
      const dados = await requisicao.file();
      if (!dados) {
        return resposta.status(400).send({ erro: 'Nenhum arquivo enviado.' });
      }

      const buffer = await dados.toBuffer();
      const campos: Record<string, string> = {};

      for (const [chave, valor] of Object.entries(dados.fields)) {
        if (valor && typeof valor === 'object' && 'value' in valor) {
          campos[chave] = String((valor as any).value);
        }
      }

      const titulo = campos.titulo || campos.title;
      const sistema = campos.sistema || campos.system;
      const modulo = campos.modulo || campos.module;
      const versao = campos.versao || campos.version || 'padrao';
      const tipoDocumento = campos.tipoDocumento || campos.docType || 'manual';

      if (!titulo || !sistema || !modulo) {
        return resposta.status(400).send({
          erro: 'Os campos "titulo", "sistema" e "modulo" são obrigatórios no formulário multipart.',
        });
      }

      // Chama o caso de uso de ingestão
      const resultado = await servicoDocumentos.uploadEIngestao({
        titulo,
        sistema,
        modulo,
        versao,
        tipoDocumento,
        nomeArquivo: dados.filename,
        tipoMime: dados.mimetype,
        buffer,
      });

      return resposta.status(201).send(resultado);
    }
  );

  /**
   * POST /api/v1/documentos/texto
   * Cria um documento e seus fragmentos vetoriais diretamente a partir de um texto ou Markdown colado (Ctrl+V).
   */
  app.post(
    '/texto',
    {
      schema: {
        summary: 'Criar documento colando texto ou Markdown diretamente',
        description:
          'Recebe o texto/markdown via JSON, extrai seções, divide em fragmentos e gera vetores no PostgreSQL com pgvector.',
        tags: ['Documentos'],
        body: {
          type: 'object',
          required: ['titulo', 'sistema', 'modulo', 'conteudo'],
          properties: {
            titulo: { type: 'string' },
            sistema: { type: 'string' },
            modulo: { type: 'string' },
            versao: { type: 'string' },
            tipoDocumento: { type: 'string' },
            conteudo: { type: 'string' },
          },
        },
      },
    },
    async (requisicao, resposta) => {
      const { titulo, sistema, modulo, versao, tipoDocumento, conteudo } = requisicao.body as {
        titulo: string;
        sistema: string;
        modulo: string;
        versao?: string;
        tipoDocumento?: string;
        conteudo: string;
      };

      if (!conteudo || conteudo.trim().length === 0) {
        return resposta.status(400).send({ erro: 'O conteúdo em Markdown não pode estar vazio.' });
      }

      const nomeLimpo = titulo.toLowerCase().replace(/[^a-z0-9_-]/g, '-') + '.md';
      const buffer = Buffer.from(conteudo, 'utf-8');

      const resultado = await servicoDocumentos.uploadEIngestao({
        titulo,
        sistema,
        modulo,
        versao: versao || 'padrao',
        tipoDocumento: tipoDocumento || 'manual',
        nomeArquivo: nomeLimpo,
        tipoMime: 'text/markdown',
        buffer,
      });

      return resposta.status(201).send(resultado);
    }
  );

  /**
   * GET /api/v1/documentos
   * Retorna todos os manuais cadastrados com filtros opcionais por sistema, módulo ou versão.
   */
  app.get(
    '/',
    {
      schema: {
        summary: 'Listar documentos cadastrados',
        description: 'Retorna a lista de manuais cadastrados, com filtros opcionais por sistema, módulo e versão.',
        tags: ['Documentos'],
        querystring: {
          type: 'object',
          properties: {
            sistema: { type: 'string' },
            modulo: { type: 'string' },
            versao: { type: 'string' },
          },
        },
      },
    },
    async (requisicao) => {
      const consulta = requisicao.query as { sistema?: string; modulo?: string; versao?: string };
      return servicoDocumentos.listarDocumentos(consulta);
    }
  );

  /**
   * GET /api/v1/documentos/:id
   * Retorna detalhes de um manual e a lista de seus fragmentos de texto gerados.
   */
  app.get(
    '/:id',
    {
      schema: {
        summary: 'Detalhes de um documento por ID',
        description: 'Retorna os metadados do documento e a lista de seus fragmentos indexados.',
        tags: ['Documentos'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (requisicao, resposta) => {
      const { id } = requisicao.params as { id: string };
      const doc = await servicoDocumentos.obterDocumentoPorId(id);
      if (!doc) {
        return resposta.status(404).send({ erro: 'Documento não encontrado.' });
      }
      return doc;
    }
  );

  /**
   * DELETE /api/v1/documentos/:id
   * Exclui o arquivo físico e remove em cascata todos os fragmentos e vetores do pgvector.
   */
  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Excluir documento',
        description: 'Remove o documento, seu arquivo físico e todos os fragmentos vetoriais.',
        tags: ['Documentos'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (requisicao, resposta) => {
      const { id } = requisicao.params as { id: string };
      const excluido = await servicoDocumentos.excluirDocumento(id);
      if (!excluido) {
        return resposta.status(404).send({ erro: 'Documento não encontrado.' });
      }
      return resposta.send({ mensagem: 'Documento e fragmentos removidos com sucesso.' });
    }
  );
}
