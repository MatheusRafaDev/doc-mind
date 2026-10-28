/**
 * ============================================================================
 * 🏗️ FÁBRICA DA APLICAÇÃO FASTIFY (backend/src/app.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Este arquivo reúne e registra todos os plugins, middlewares e controladores da API:
 * - CORS (para permitir que o frontend Next.js acesse a API sem bloqueios)
 * - Multipart (para receber uploads de arquivos PDF/TXT/MD de até 50MB)
 * - Swagger / OpenAPI (para gerar a documentação interativa em `/docs`)
 * - Rota de integridade `/saude`
 * - Todas as rotas de negócio:
 *   - `/api/v1/documentos` (em `src/rotas/documentos.rotas.ts`)
 *   - `/api/v1/busca` (em `src/rotas/busca.rotas.ts`)
 *   - `/api/v1/chat` (em `src/rotas/chat.rotas.ts`)
 *   - `/api/v1/diagnostico` (em `src/rotas/diagnostico.rotas.ts`)
 *   - `/api/v1/metricas` (em `src/rotas/metricas.rotas.ts`)
 * 
 * 🔄 QUEM CHAMA:
 * - `backend/src/server.ts` (ao subir o servidor)
 * - `backend/src/testar-api.ts` (ao rodar testes automatizados com `app.inject()`)
 * ============================================================================
 */

import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { verificarConexaoBanco } from './banco/index.js';
import { rotasDocumentos } from './rotas/documentos.rotas.js';
import { rotasBusca } from './rotas/busca.rotas.js';
import { rotasChat } from './rotas/chat.rotas.js';
import { rotasDiagnostico } from './rotas/diagnostico.rotas.js';
import { rotasMetricas } from './rotas/metricas.rotas.js';
import { ambiente } from './configuracao/ambiente.js';

export async function criarAplicacao() {
  const app = fastify({
    logger: true,
  });

  // 1. CORS: Permite que navegadores e o Next.js façam requisições cross-origin
  await app.register(cors, {
    origin: '*',
  });

  // 2. Multipart: Habilita recebimento de formulários multipart com arquivos até 50MB
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  });

  // 3. Documentação Swagger / OpenAPI 3.0 gerada automaticamente
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'DocMind API — ERP Knowledge AI',
        description:
          'Backend em TypeScript para busca semântica, RAG fundamentado e diagnóstico técnico para sistemas ERP.',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${ambiente.PORTA}`,
          description: 'Ambiente Local',
        },
      ],
      tags: [
        { name: 'Documentos', description: 'Ingestão, metadados e ciclo de vida de manuais' },
        { name: 'Pesquisa Técnica', description: 'Busca híbrida combinando vetores e texto' },
        { name: 'Chat RAG', description: 'Perguntas e respostas fundamentadas com fontes e páginas' },
        { name: 'Diagnóstico Técnico', description: 'Investigação e classificação de erros e logs via LangGraph' },
        { name: 'Métricas & Governança', description: 'Monitoramento e lacunas de documentação' },
      ],
    },
  });

  // Interface visual interativa Swagger UI acessível em http://localhost:3000/docs
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // 4. Endpoint de Saúde do Sistema (/saude e alias /health)
  app.get(
    '/saude',
    {
      schema: {
        summary: 'Verificação de integridade do sistema',
        tags: ['Geral'],
      },
    },
    async () => {
      const statusBanco = await verificarConexaoBanco();
      return {
        status: 'online',
        horario: new Date().toISOString(),
        bancoDados: statusBanco,
        provedores: {
          vetorial: ambiente.PROVEDOR_VETOR,
          llm: ambiente.PROVEDOR_LLM,
        },
      };
    }
  );

  app.get('/health', async () => {
    const statusBanco = await verificarConexaoBanco();
    return {
      status: 'online',
      horario: new Date().toISOString(),
      bancoDados: statusBanco,
      provedores: {
        vetorial: ambiente.PROVEDOR_VETOR,
        llm: ambiente.PROVEDOR_LLM,
      },
    };
  });

  // 5. Registro de Rotas de Negócio em Português
  await app.register(rotasDocumentos, { prefix: '/api/v1/documentos' });
  await app.register(rotasBusca, { prefix: '/api/v1/busca' });
  await app.register(rotasChat, { prefix: '/api/v1/chat' });
  await app.register(rotasDiagnostico, { prefix: '/api/v1/diagnostico' });
  await app.register(rotasMetricas, { prefix: '/api/v1/metricas' });

  return app;
}
