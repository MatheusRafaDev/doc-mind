import { criarAplicacao } from './app.js';
import { executarMigracoes } from './banco/migrar.js';
import { ambiente } from './configuracao/ambiente.js';

async function iniciar() {
  const app = await criarAplicacao();

  try {
    // Tenta rodar as migrações automáticas
    try {
      await executarMigracoes();
    } catch (erroMigracao) {
      console.warn(
        '⚠️ Não foi possível rodar as migrações automáticas no banco (verifique se o PostgreSQL com pgvector está ativo):',
        erroMigracao
      );
    }

    await app.listen({ port: ambiente.PORTA, host: ambiente.HOST });

    console.log(`\n🚀 Servidor DocMind iniciado com sucesso!`);
    console.log(`📡 URL Principal: http://${ambiente.HOST === '0.0.0.0' ? 'localhost' : ambiente.HOST}:${ambiente.PORTA}`);
    console.log(`📑 Documentação Interativa Swagger: http://localhost:${ambiente.PORTA}/docs\n`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

iniciar();
