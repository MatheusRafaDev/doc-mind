/**
 * ============================================================================
 * 🚀 PONTO DE ENTRADA DO SERVIDOR (backend/src/server.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Este é o primeiro arquivo executado quando o backend inicia:
 * Executado via: `npm run dev:backend` -> `tsx watch src/server.ts`
 * 
 * 🔄 FLUXO DE EXECUÇÃO:
 * 1. Importa a função `criarAplicacao()` de `src/app.ts` (que monta todas as rotas e plugins).
 * 2. Tenta executar as migrações automáticas do banco chamando `executarMigracoes()` de `src/banco/migrar.ts`.
 * 3. Faz o bind do servidor Fastify na porta configurada (padrão: 3000) e escuta requisições.
 * 4. Imprime no console os links da API e da Documentação Interativa Swagger.
 * ============================================================================
 */

import { criarAplicacao } from './app.js';
import { executarMigracoes } from './banco/migrar.js';
import { ambiente } from './configuracao/ambiente.js';

async function iniciar() {
  // 1. Constrói a instância da aplicação Fastify com Swagger, CORS e Rotas
  const app = await criarAplicacao();

  try {
    // 2. Executa migrações no PostgreSQL (habilita pgvector e cria tabelas se não existirem)
    try {
      await executarMigracoes();
    } catch (erroMigracao) {
      console.warn(
        '⚠️ Não foi possível rodar as migrações automáticas no banco (verifique se o PostgreSQL com pgvector está ativo):',
        erroMigracao
      );
    }

    // 3. Inicia o servidor HTTP para escutar requisições
    await app.listen({ port: ambiente.PORTA, host: ambiente.HOST });

    // 4. Mensagens informativas de inicialização
    console.log(`\n🚀 Servidor DocMind iniciado com sucesso!`);
    console.log(`📡 URL Principal: http://${ambiente.HOST === '0.0.0.0' ? 'localhost' : ambiente.HOST}:${ambiente.PORTA}`);
    console.log(`📑 Documentação Interativa Swagger: http://localhost:${ambiente.PORTA}/docs\n`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

// Dispara a inicialização
iniciar();
