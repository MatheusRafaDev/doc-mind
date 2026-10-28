import { FastifyInstance } from 'fastify';
import { ServicoDocumentos } from '../modulos/documentos/servico.documentos.js';

export async function rotasDocumentos(app: FastifyInstance) {
  const servicoDocumentos = new ServicoDocumentos();

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

